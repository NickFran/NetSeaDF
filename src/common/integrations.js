const { execFile, spawn } = require('node:child_process');
const path = require('node:path');
const { fromHereToRoot } = require('./pathDep.js');
const fs = require('node:fs');
const os = require('node:os');

let pyProc = null;
let pending = [];

// Check if app is packaged (production) or in development
const isDev = !process.resourcesPath || process.resourcesPath.includes('node_modules');
const isMac = process.platform === 'darwin';
const isAppleSilicon = isMac && process.arch === 'arm64';
const isIntelMac = isMac && process.arch === 'x64';

// Determine which Python to use based on platform and architecture
const pythonExe = (() => {
    if (!isMac) {
        // Windows
        return isDev 
            ? path.join(fromHereToRoot(__dirname), 'PythonPortable', 'Scripts', 'python.exe')
            : path.join(process.resourcesPath, 'PythonPortable', 'Scripts', 'python.exe');
    }
    
    // macOS - choose based on architecture
    const macPythonFolder = isAppleSilicon ? 'PythonPortableMac_arm64' : 'PythonPortableMac_x64';
    return isDev
        ? path.join(fromHereToRoot(__dirname), macPythonFolder, 'python', 'bin', 'python3.10')
        : path.join(process.resourcesPath, macPythonFolder, 'python', 'bin', 'python3.10');
})();

function ensurePyProc() {
    if (pyProc) return;
    
    // In production, pythonProcess.py is unpacked from asar to app.asar.unpacked
    const pythonPath = isDev
        ? path.join(fromHereToRoot(__dirname), 'src', 'common', 'pythonProcess.py')
        : path.join(path.dirname(process.execPath), 'resources', 'app.asar.unpacked', 'src', 'common', 'pythonProcess.py');
    
    // Set up environment for Python
    const env = Object.assign({}, process.env);
    
    // For portable Python, don't set PYTHONHOME for venv - it can break things
    delete env.PYTHONHOME;
    delete env.PYTHONPATH;
    
    console.log('[PYTHON SETUP]', { 
        isDev,
        isMac,
        isAppleSilicon,
        isIntelMac,
        platform: process.platform,
        arch: process.arch,
        pythonExe, 
        pythonPath,
        pythonPathExists: require('fs').existsSync(pythonPath),
        resourcesPath: process.resourcesPath,
        dirname: __dirname,
        execPath: process.execPath
    });
    
    pyProc = spawn(pythonExe, [pythonPath], { env });

    pyProc.stdout.on('data', (chunk) => {
        const lines = chunk.toString().split(/\r?\n/).filter(Boolean);
        lines.forEach((line) => {
            let payload;
            try { payload = JSON.parse(line); } catch { 
                console.log('[PYTHON STDOUT]', line);
                return; 
            }
            const next = pending.shift();
            if (!next) return;
            if (payload.ok) next.resolve(payload.result);
            else next.reject(new Error(payload.error || 'Python error'));
        });
    });

    let stderrBuffer = '';
    
    pyProc.stderr.on('data', (chunk) => {
        const msg = chunk.toString();
        stderrBuffer += msg;
        console.error('[PYTHON STDERR]', msg);
    });

    pyProc.on('exit', (code) => {
        console.log('[PYTHON EXIT] Code:', code);
        if (stderrBuffer) {
            console.error('[PYTHON STDERR FULL]', stderrBuffer);
        }
        pyProc = null;
        const errorMsg = code !== 0 
            ? `Python process exited with code ${code}${stderrBuffer ? ': ' + stderrBuffer : ''}`
            : 'Python process exited normally';
        while (pending.length) {
            pending.shift().reject(new Error(errorMsg));
        }
    });

    pyProc.on('error', (err) => {
        console.error('[PYTHON ERROR]', err);
        while (pending.length) {
            pending.shift().reject(err);
        }
    });
}

function callPyFunc(funcName, args = [], options = {}) {
    return new Promise((resolve, reject) => {
        const safeArgs = Array.isArray(args) ? args : [args];
        ensurePyProc();
        const timeoutMs = typeof options.timeoutMs === 'number' ? options.timeoutMs : 60000;

        const timeoutId = setTimeout(() => {
            const idx = pending.indexOf(handler);
            if (idx > -1) pending.splice(idx, 1);
            reject(new Error(`Timeout waiting for Python response: ${funcName}(${JSON.stringify(safeArgs)})`));
        }, timeoutMs);
        
        const handler = {
            resolve: (v) => { clearTimeout(timeoutId); resolve(v); },
            reject:  (e) => { clearTimeout(timeoutId); reject(e); }
        };
        pending.push(handler);
        
        const req = JSON.stringify({ cmd: funcName, args: safeArgs });
        console.log('[JS -> PYTHON]', req);
        try {
            pyProc.stdin.write(req + "\n");
        } catch (err) {
            const idx = pending.indexOf(handler);
            if (idx > -1) pending.splice(idx, 1);
            clearTimeout(timeoutId);
            reject(err);
        }
    });
}
console.log(__dirname);

module.exports = { callPyFunc };

// const x = await callPyFunc('add', [5, 10]);
// console.log(x); // Outputs: 15