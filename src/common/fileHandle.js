const fs = require('fs');
const path = require('path');
const pathDep = require('./pathDep');

const fileContent = fs.readFileSync(pathDep.jsonPath, 'utf-8');
let allData = JSON.parse(fileContent);
global .allData = allData;

function doesFileAlreadyExist(pathToFile) {
    /**
     * Checks if a file already exists at the specified path.
     * 
     * @param {string} pathToFile - The full path to the file we want to check.
     * @returns {boolean} - True if the file exists, false otherwise.
     */
    return fs.existsSync(pathToFile);
}

// Copy file to savedData directory
function copyFileToSavedData(sourceFilePath, destDir) {
    try {
        const fileName = path.basename(sourceFilePath);
        const destPath = path.join(destDir, fileName);
        fs.copyFileSync(sourceFilePath, destPath);
        return { success: true, destPath, fileName };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// This currently only has support for one file type (extension), make this into an array later on to support .nc and .csv
function listSavedDataFiles(savedDataPath, extensionFilter = '-1') {
    
    const files = fs.readdirSync(savedDataPath);
    let providedArray = [];

    if (extensionFilter != '-1') {
        files.forEach(file => {
            if (file.endsWith(extensionFilter)) {
                // console.log(file); DEBUG
                providedArray.push(file);
            }
        });
    } else {
        files.forEach(file => {
                providedArray.push(file);
        });
    }


    return providedArray;
}

function getKeysOfEntryInSimpleData(fileName) {
    const keys = Object.keys(getEntryInSimpleData(fileName));
    return keys;
}

function getEntryKeyInSimpleData(fileName, key) {
    const entry = getEntryInSimpleData(fileName);
    if (key in entry) {
        return entry[key];
    } else {
        console.error(`Key "${key}" not found in dataset for file "${fileName}".`);
        return null;
    }
}

function getEntryInSimpleData(fileName) {
    if(doesEntryExistInSimpleData(fileName)){
        const entry = allData.find(item => item.fileName === fileName);
        return entry;
    } else {
        throw new Error("File doesnt exist in simpleData.json!");
    }
}

function isSimpleDataEmpty() {
    const fileContent = fs.readFileSync(pathDep.jsonPath, 'utf-8');
    if (!fileContent.trim()) {
        //console.error("simpleData.json is empty");
        return true;
    } else {
        return false;
    }
}

function doesEntryExistInSimpleData(fileName) {
    if (!(allData.find(item => item.fileName === fileName))) {
        console.error("Dataset not found:", fileName);
        return false;
    }else {
        return true;
    }
}

function reparseSimpleData() {
    const newFileContent = fs.readFileSync(pathDep.jsonPath, 'utf-8');
    allData = JSON.parse(newFileContent);
}

module.exports = { 
    doesFileAlreadyExist, 
    listSavedDataFiles, 
    copyFileToSavedData, 
    isSimpleDataEmpty, 
    getKeysOfEntryInSimpleData,
    getEntryInSimpleData,
    getEntryKeyInSimpleData,
    reparseSimpleData
};