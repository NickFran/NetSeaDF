const { execFile, spawn } = require('node:child_process');
const path = require('node:path');
const { fromHereToRoot } = require('./pathDep.js');
const fs = require('node:fs');
const os = require('node:os');

let pyProc = null;
let pending = [];
const pythonExe = path.join(fromHereToRoot(__dirname), 'PythonPortable', 'Scripts', 'python.exe');

function ensurePyProc() {
    if (pyProc) return;
    const pythonPath = path.join(fromHereToRoot(__dirname), 'src', 'common', 'pythonProcess.py');
    pyProc = spawn(pythonExe, [pythonPath]);

    pyProc.stdout.on('data', (chunk) => {
        const lines = chunk.toString().split(/\r?\n/).filter(Boolean);
        lines.forEach((line) => {
            let payload;
            try { payload = JSON.parse(line); } catch { 
                //console.log('[PYTHON STDOUT]', line);
                return; 
            }
            const next = pending.shift();
            if (!next) return;
            if (payload.ok) next.resolve(payload.result);
            else next.reject(new Error(payload.error || 'Python error'));
        });
    });

    pyProc.on('exit', (code) => {
        console.log('[PYTHON EXIT] Code:', code);
        pyProc = null;
        while (pending.length) {
            pending.shift().reject(new Error('Python process exited with code ' + code));
        }
    });

    pyProc.on('error', (err) => {
        console.log('[PYTHON ERROR]', err);
        while (pending.length) {
            pending.shift().reject(err);
        }
    });

    pyProc.stderr.on('data', (chunk) => {
        const msg = chunk.toString();
        //console.log('[PYTHON STDERR]', msg);
    });
}

function callPyFunc(funcName, args = [], options = {}) {
    return new Promise((resolve, reject) => {
        const pythonPath = path.join(fromHereToRoot(__dirname), 'src', 'common', 'pythonProcess.py');

        const safeArgs = Array.isArray(args) ? args : [args];
        ensurePyProc();
        const timeoutMs = typeof options.timeoutMs === 'number' ? options.timeoutMs : 10000;

        const timeoutId = setTimeout(() => {
            const idx = pending.indexOf(handler);
            if (idx > -1) pending.splice(idx, 1);
            reject(new Error(`Timeout waiting for Python response: ${funcName}(${JSON.stringify(safeArgs)})`));
        }, timeoutMs);
        
        const handler = { resolve, reject };
        pending.push(handler);
        
        const req = JSON.stringify({ cmd: funcName, args: safeArgs });
        //console.log('[JS -> PYTHON]', req);
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