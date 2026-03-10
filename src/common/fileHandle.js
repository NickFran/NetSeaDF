const fs = require('fs');
const path = require('path');
const pathDep = require('./pathDep');

let allData = null;
const fileContent = fs.readFileSync(pathDep.jsonPath, 'utf-8');
if (isSimpleDataEmpty()) {
} else {
    console.log("simpleData.json ia not empty, loading data...");
    allData = JSON.parse(fileContent);
}
global .allData = allData;

/**
 * Returns true if the file already exists at the specified path.
 * @param {Object} pathToFile - The full path to the file we want to check.
 * @returns {boolean} - True if the file exists, false otherwise.
 */
function doesFileAlreadyExist(pathToFile) {
    /**
     * Checks if a file already exists at the specified path.
     * 
     * @param {string} pathToFile - The full path to the file we want to check.
     * @returns {boolean} - True if the file exists, false otherwise.
     */
    return fs.existsSync(pathToFile);
}

/**
 * Copies a file from the source path to the destination directory.
 * @param {Object} sourceFilePath - The full path to the file we want to copy.
 * @param {Object} destDir - The directory where we want to copy the file to.
 * @returns {Object} - Object with result status.
 */
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

/**
 * Saves a buffer as a file in the savedData directory.
 * @param {Buffer} buffer - The file contents as a buffer.
 * @param {string} fileName - The name for the new file.
 * @param {string} destDir - The directory to save the file in.
 * @returns {Object} - Object with result status.
 */
function copyFileToSavedDataViaBuffer(buffer, fileName, destDir) {
    try {
        const destPath = path.join(destDir, fileName);
        fs.writeFileSync(destPath, buffer);
        return { success: true, destPath, fileName };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Returns a list of files in the savedData directory, optionally filtered by extension.
 * @param {Object} savedDataPath - The path to the savedData directory.
 * @param {Object} extensionFilter - Optional file extension to filter by (e.g. ".nc"). Use '-1' for no filter.
 * @returns {Object} - Array of file names in the savedData directory, filtered by extension if specified.
 * @param {Object} 
 */
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

/**
 * Returns the keys of the entry in simpleData.json for the specified fileName.
 * @param {Object} fileName - The name of the file whose entry we want to get keys for.
 * @returns {Object} - Array of keys for the entry in simpleData.json corresponding to the specified fileName.
 */
function getKeysOfEntryInSimpleData(fileName) {
    const keys = Object.keys(getEntryInSimpleData(fileName));
    return keys;
}

/**
 * Returns the value of a specific key in the entry in simpleData.json for the specified fileName.
 * @param {Object} fileName - The name of the file whose entry we want to get the key from.
 * @param {Object} key - The specific key we want to get the value of.
 * @returns {Object} - The value of the specified key in the entry in simpleData.json corresponding to the specified fileName, or null if the key is not found.
 */
function getEntryKeyInSimpleData(fileName, key) {
    const entry = getEntryInSimpleData(fileName);
    if (key in entry) {
        return entry[key];
    } else {
        console.error(`Key "${key}" not found in dataset for file "${fileName}".`);
        return null;
    }
}

/**
 * Returns the full entry in simpleData.json for the specified fileName.
 * @param {Object} fileName - The name of the file whose entry we want to get.
 * @returns {Object} - The entry in simpleData.json corresponding to the specified fileName, or throws an error if the entry is not found.
 */
function getEntryInSimpleData(fileName) {
    if(doesEntryExistInSimpleData(fileName)){
        const entry = allData.find(item => item.fileName === fileName);
        return entry;
    } else {
        throw new Error("File doesnt exist in simpleData.json!");
    }
}

/**
 * Returns true if simpleData.json is empty (contains no data), false otherwise.
 * @returns {boolean} - True if simpleData.json is empty, false otherwise.
 */
function isSimpleDataEmpty() {
    const fileContent = fs.readFileSync(pathDep.jsonPath, 'utf-8');
    if (!fileContent.trim()) {
        //console.error("simpleData.json is empty");
        return true;
    } else {
        return false;
    }
}

/**
 * Checks if an entry with the specified fileName exists in simpleData.json.
 * @param {Object} fileName - The name of the file to check for in simpleData.json.
 * @returns {boolean} - True if an entry with the specified fileName exists in simpleData.json, false otherwise.
 */
function doesEntryExistInSimpleData(fileName) {
    if (!(allData.find(item => item.fileName === fileName))) {
        console.error("Dataset not found:", fileName);
        return false;
    }else {
        return true;
    }
}

/**
 * Re-reads simpleData.json from disk and updates the in-memory allData variable with the latest content. 
 * 
 * Should be called after any changes are made to simpleData.json to ensure in-memory data is up-to-date.
 * 
 */
function reparseSimpleData() {
    try {
        const newFileContent = fs.readFileSync(pathDep.jsonPath, 'utf-8');
        if (!newFileContent.trim()) {
            console.warn("simpleData.json is empty, not updating allData.");
            return;
        }
        allData = JSON.parse(newFileContent);
    } catch (error) {
        console.error("Error reparsing simpleData.json:", error);
        // Optionally: leave allData unchanged or set to null
    }
}

/**
 * 
 * @returns - returns JSON object of all simple data
 */
function getAllSimpleData() {
    return JSON.stringify(allData);
}

/**
 * deletes a file from the savedData directory based on the provided fileName, 
 * and also removes its corresponding entry from simpleData.json.
 * @param {*} fileName - The name of the file to delete from savedData and simpleData.json.
 * @returns - Object with result status.
 */
function deleteDataFile(fileName) {
    try {
        const filePath = path.join(pathDep.savedDataPath, fileName);
        
        // Check if file exists before attempting deletion
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${fileName}`);
            return { success: false, error: "File not found" };
        }
        
        // Delete the file
        fs.unlinkSync(filePath);
        console.log(`File deleted: ${fileName}`);
        return { success: true };
        
    } catch (error) {
        console.error(`Error deleting file ${fileName}:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Deletes an entry from simpleData.json based on fileName.
 * 
 * @param {string} fileName - The name of the file whose entry should be removed.
 * @returns {object} - Object with result status.
 */
function deleteEntryInSimpleData(fileName) {
    try {
        // Check if entry exists
        if (!doesEntryExistInSimpleData(fileName)) {
            console.error(`Entry not found in simpleData.json: ${fileName}`);
            return { success: false, error: "Entry not found" };
        }
        
        // Filter out the entry with matching fileName
        allData = allData.filter(item => item.fileName !== fileName);
        
        // Write updated data back to simpleData.json
        fs.writeFileSync(pathDep.jsonPath, JSON.stringify(allData, null, 2));
        
        console.log(`Entry deleted from simpleData.json: ${fileName}`);
        return { success: true };
        
    } catch (error) {
        console.error(`Error deleting entry for ${fileName}:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Takes a dataset and its associated metadata, and saves it as a new entry in simpleData.json.
 * Also handles the coordinates by pairing latitudes and longitudes together.
 * @param {*} dep - dependencies
 * @param {*} fileName - file name of entry
 * @param {*} dimensions  - dimensions of entry
 * @param {*} variables -variables of entry
 * @param {*} overview - overview of entry
 * @param {*} coords - coordinates of entry
 * @param {*} attributes - attributes of entry
 */
async function saveDatasetToJSON(dep, fileName, overview) {
    const { DOM } = dep;
    let dimensions = overview.dimensions;
    let variables = overview.variables;
    let attributes = overview.attributes;
    let coords = overview.coordinates;
    let timestamps = overview.timestamps;
    
    console.log([dimensions, variables, attributes, coords, timestamps]);
    
    const jsonPath = pathDep.jsonPath;
        let coordPairs = [];

        // For each lat instance in lats array,
        for (i = 0; i < coords[0].length; i++) {
            // init let & lon, and set to value of index.
            // but if the value is undefined, default to N/A
            const lat = coords[0][i] !== undefined ? coords[0][i] : 'N/A';
            const lon = coords[1][i] !== undefined ? coords[1][i] : 'N/A';

            // append coord pair to coordPairs array
            coordPairs.push({ lat, lon });
        }
        
        // try to do the rest,
        try {
            let existingJSONData = [];
            // Does JSON file exist?
            if (doesFileAlreadyExist(jsonPath)) {
                const fileContent = fs.readFileSync(jsonPath, 'utf-8');
                if (fileContent.trim()) {  // Only parse if file is not empty
                    existingJSONData = JSON.parse(fileContent);
                }
            }
            
            const newEntry = {
                "id": Date.now().toString(),
                "fileName": fileName,
                "summary": attributes?.platform_name || "No Overview available",
                "dims": dimensions,
                "vars": variables,
                "coords": coordPairs,
                "timestamps":timestamps,
                "attributes": attributes
            };
            
            // add new entry to existing data, and write to JSON file asynchronously
            existingJSONData.push(newEntry);
            await fs.promises.writeFile(jsonPath, JSON.stringify(existingJSONData, null, 2));
            reparseSimpleData(); // Update in-memory data after writing to file
            console.log("Data saved to simpleData.json");
            DOM.hideLoadingScreen(); // Hide loading screen after data is saved

        } catch (error) {
            console.error("Error saving to simpleData.json:", error);
            DOM.hideLoadingScreen(); // Hide loading screen on error
        }
    }


/**
 * Reads the import queue from disk.
 * @returns {Array} - Array of queue entries, or empty array if file is empty/missing.
 */
function readImportQeue() {
    try {
        const content = fs.readFileSync(pathDep.importQeuePath, 'utf-8');
        if (!content.trim()) return [];
        return JSON.parse(content);
    } catch (error) {
        return [];
    }
}

/**
 * Writes the import queue to disk.
 * @param {Array} queue - The queue array to write.
 */
function writeImportQeue(queue) {
    fs.writeFileSync(pathDep.importQeuePath, JSON.stringify(queue, null, 2));
}

/**
 * Adds multiple file entries to the import queue.
 * @param {Array} entries - Array of { fileName, destPath } objects.
 */
function addToImportQeue(entries) {
    const queue = readImportQeue();
    entries.forEach(entry => {
        queue.push({ fileName: entry.fileName, destPath: entry.destPath, status: 'pending' });
    });
    writeImportQeue(queue);
}

/**
 * Marks a queue entry as done and writes the updated queue to disk.
 * @param {string} fileName - The fileName to mark as done.
 */
function markQeueEntryDone(fileName) {
    let queue = readImportQeue();
    queue = queue.filter(entry => entry.fileName !== fileName);
    writeImportQeue(queue);
}

/**
 * Clears the import queue file.
 */
function clearImportQeue() {
    writeImportQeue([]);
}

module.exports = { 
    doesFileAlreadyExist, 
    listSavedDataFiles, 
    copyFileToSavedData,
    copyFileToSavedDataViaBuffer,
    isSimpleDataEmpty, 
    getKeysOfEntryInSimpleData,
    getEntryInSimpleData,
    getEntryKeyInSimpleData,
    reparseSimpleData,
    getAllSimpleData,
    deleteDataFile,
    deleteEntryInSimpleData,
    saveDatasetToJSON,
    readImportQeue,
    writeImportQeue,
    addToImportQeue,
    markQeueEntryDone,
    clearImportQeue
};