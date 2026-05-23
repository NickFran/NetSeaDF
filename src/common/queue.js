const fs = require('fs');
const pathDep = require('./pathDep');

function readImportQeue() {
    try {
        const content = fs.readFileSync(pathDep.importQeuePath, 'utf-8');
        if (!content.trim()) return [];
        console.log(`Import queue content read: ${content}`);
        return JSON.parse(content);
    } catch (error) {
        return error;
    }
}

function writeImportQeue(queue) {
    fs.writeFileSync(pathDep.importQeuePath, JSON.stringify(queue, null, 2));
}

function addToImportQeue(entries) {
    const queue = readImportQeue();
    entries.forEach(entry => {
        queue.push({
            fileName: entry.fileName,
            destPath: entry.destPath,
            status: 'pending',
            allowOverwriteExistingEntry: Boolean(entry.allowOverwriteExistingEntry)
        });
    });
    writeImportQeue(queue);
}

function markQeueEntryDone(fileName) {
    let queue = readImportQeue();
    queue = queue.filter(entry => entry.fileName !== fileName);
    writeImportQeue(queue);
}

function clearImportQeue() {
    writeImportQeue([]);
}

function readRemoveQeue() {
    try {
        const content = fs.readFileSync(pathDep.removeQeuePath, 'utf-8');
        if (!content.trim()) return [];
        return JSON.parse(content);
    } catch (error) {
        return [];
    }
}

function writeRemoveQeue(queue) {
    fs.writeFileSync(pathDep.removeQeuePath, JSON.stringify(queue, null, 2));
}

function addToRemoveQeue(fileNames) {
    const queue = readRemoveQeue();
    fileNames.forEach(fileName => {
        queue.push({ fileName: fileName, status: 'pending' });
    });
    writeRemoveQeue(queue);
}

function markRemoveQeueEntryDone(fileName) {
    let queue = readRemoveQeue();
    queue = queue.filter(entry => entry.fileName !== fileName);
    writeRemoveQeue(queue);
}

function clearRemoveQeue() {
    writeRemoveQeue([]);
}

module.exports = {
    readImportQeue,
    writeImportQeue,
    addToImportQeue,
    markQeueEntryDone,
    clearImportQeue,
    readRemoveQeue,
    writeRemoveQeue,
    addToRemoveQeue,
    markRemoveQeueEntryDone,
    clearRemoveQeue
};
