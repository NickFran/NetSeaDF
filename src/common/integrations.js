const { execFile } = require('node:child_process');
const path = require('node:path');
const { fromHereToRoot } = require('./pathDep.js');
const fs = require('node:fs');
const os = require('node:os');

function callPyFunc(funcName, args) {
    return new Promise((resolve, reject) => {
        const pythonPath = path.join(fromHereToRoot(__dirname), 'src', 'unitTests', 'echartsTesting', 'pythonTest.py');

        // Special handling for large payloads
        if (funcName === 'bulkSSP' && Array.isArray(args?.[0]) && Array.isArray(args?.[1])) {
            const tmp = path.join(os.tmpdir(), `ssp-${Date.now()}.json`);
            fs.writeFileSync(tmp, JSON.stringify({ temps: args[0], presses: args[1] }));
            execFile('python', [pythonPath, 'bulkSSPFile', tmp], (error, stdout) => {
                try { fs.unlinkSync(tmp); } catch {}
                if (error) return reject(error);
                try { resolve(JSON.parse(stdout)); } catch (e) { reject(e); }
            });
            return;
        }

        execFile('python', [pythonPath, funcName, ...args],
            (error, stdout) => {
                if (error) reject(error);
                else resolve(JSON.parse(stdout));
            }
        );
    });
}
console.log(__dirname);

module.exports = { callPyFunc };

// const x = await callPyFunc('add', [5, 10]);
// console.log(x); // Outputs: 15