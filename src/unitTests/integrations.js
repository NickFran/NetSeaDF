const { execFile, spawn } = require('node:child_process');
const path = require('node:path');
const { fromHereToRoot } = require('../../src/common/pathDep.js');
const fs = require('node:fs');
const os = require('node:os');

let pyProc = null;
let pending = [];

function ensurePyProc() {
    if (pyProc) return;
    const pythonPath = path.join(fromHereToRoot(__dirname), 'src', 'unitTests', 'pythonTest.py');
    pyProc = spawn('python', [pythonPath]);

    pyProc.stdout.on('data', (chunk) => {
        const lines = chunk.toString().split(/\r?\n/).filter(Boolean);
        lines.forEach((line) => {
            let payload;
            try { payload = JSON.parse(line); } catch { return; }
            const next = pending.shift();
            if (!next) return;
            if (payload.ok) next.resolve(payload.result);
            else next.reject(new Error(payload.error || 'Python error'));
        });
    });

    pyProc.on('exit', () => {
        pyProc = null;
        while (pending.length) {
            pending.shift().reject(new Error('Python process exited'));
        }
    });
}

function callPyFunc(funcName, args = []) {
    return new Promise((resolve, reject) => {
        const pythonPath = path.join(fromHereToRoot(__dirname), 'src', 'unitTests', 'pythonTest.py');

        const safeArgs = Array.isArray(args) ? args : [args];
        ensurePyProc();
        pending.push({ resolve, reject });
        pyProc.stdin.write(JSON.stringify({ cmd: funcName, args: safeArgs }) + "\n");
    });
}
console.log(__dirname);

module.exports = { callPyFunc };

// const x = await callPyFunc('add', [5, 10]);
// console.log(x); // Outputs: 15