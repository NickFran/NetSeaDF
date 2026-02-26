const fs = require('fs');
const path = require('path');
const pathDep = require('./pathDep');

const savedDataPath = pathDep.resolveToProperDataPath(__dirname, 'savedData');

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

module.exports = { doesFileAlreadyExist, listSavedDataFiles, copyFileToSavedData };