const fs = require('fs');

function doesFileAlreadyExist() {
    return false;
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

    console.log('\nFiles in savedData:');


    return providedArray;
}

module.exports = { doesFileAlreadyExist, listSavedDataFiles };