const fs = require('fs');
const path = require('path');
const pathDep = require('./pathDep');
const queue = require('./queue.js');
const config = require('./config.js');

const VIEW_FILE_EXTENSION = '.netseadfview';

let allData = [];
const fileContent = fs.readFileSync(pathDep.jsonPath, 'utf-8');
if (isSimpleDataEmpty()) {
    allData = [];
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

        if (doesFileAlreadyExist(destPath) && !config.get('IO', 'enableImportOverWritting')) {
            return {
                success: true,
                skipped: true,
            };
        }

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

        if (doesFileAlreadyExist(destPath) && !config.get('IO', 'enableImportOverWritting')) {
            return {
                success: true,
                skipped: true,
            };
        }

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
    try {

        // GET THIS COMPLIANT WITH SRP SOON (move to diff func)
        // if (!fs.existsSync(pathDep.jsonPath)) {
        //     return true;
        // }

        const fileContent = fs.readFileSync(pathDep.jsonPath, 'utf-8');

        // Empty text file
        if (!fileContent || !fileContent.trim()) {
            return true;
        }

        // Treat [] and {} as empty JSON payloads
        const parsed = JSON.parse(fileContent);
        if (Array.isArray(parsed)) {
            return parsed.length === 0;
        }
        if (parsed && typeof parsed === 'object') {
            return Object.keys(parsed).length === 0;
        }

        return false;
    } catch (error) {
        console.error("Error checking if simpleData.json is empty:", error);
        return true;
    }
}

/**
 * Checks if an entry with the specified fileName exists in simpleData.json.
 * @param {Object} fileName - The name of the file to check for in simpleData.json.
 * @returns {boolean} - True if an entry with the specified fileName exists in simpleData.json, false otherwise.
 */
function doesEntryExistInSimpleData(fileName, logIfMissing = true) {
    if (!Array.isArray(allData) || allData.length === 0) {
        return false;
    }

    if (!(allData.find(item => item.fileName === fileName))) {
        if (logIfMissing) {
            console.error("Dataset not found:", fileName);
        }
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
            allData = [];
            console.warn("simpleData.json is empty, resetting in-memory data.");
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
    const { DOM, integrations, basicFunctions } = dep;
    let dimensions = overview.dimensions;
    let variables = overview.variables;
    let attributes = overview.attributes;
    let coords = overview.coordinates;
    let timestamps = overview.timestamps;
    let lastPressureValue = overview.lastPressureValue || null;
    
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
                "lastPressureValue": lastPressureValue !== null ? Math.round(lastPressureValue * 100) / 100 : null, // Round to 2 decimal places
                "timestamps":timestamps,
                "attributes": attributes
            };
            
            // Replace any existing entry for this file instead of creating duplicates
            const existingEntryIndex = existingJSONData.findIndex(item => item.fileName === fileName);
            if (existingEntryIndex !== -1) {
                existingJSONData[existingEntryIndex] = newEntry;
            } else {
                existingJSONData.push(newEntry);
            }
            await fs.promises.writeFile(jsonPath, JSON.stringify(existingJSONData, null, 2));
            reparseSimpleData(); // Update in-memory data after writing to file
            console.log("Data saved to simpleData.json");
            //DOM.hideLoadingScreen(); // Hide loading screen after data is saved

        } catch (error) {
            console.error("Error saving to simpleData.json:", error);
            DOM.hideLoadingScreen(); // Hide loading screen on error
        }
    }

/**
 * Reads the import queue file and processes each entry one-by-one.
 * For each entry: opens in Python, gets overview, saves to JSON, creates map marker, then removes from queue.
 * @param {Object} appState - The application state object.
 * @param {Object} DOM - The DOM utility object.
 * @param {Object} integrations - The integrations utility object.
 * @param {Object} ModuleDependencies - The module dependencies object.
 */
async function processImportQeue(appState, ModuleDependencies) {
    const {DOM, integrations, basicFunctions} = ModuleDependencies["queue"];
    const queueEntries = queue.readImportQeue();
    console.log(`Processing ${queueEntries.length} items in import queue...`);
    for (let i = 0; i < queueEntries.length; i++) {
        const entry = queueEntries[i];
        console.log(`Processing queue item ${i + 1}/${queueEntries.length}: ${entry.fileName}`);
        DOM.setLoadingText(`Importing file ${i + 1} of ${queueEntries.length}: ${entry.fileName}`);
        try {
            if (doesEntryExistInSimpleData(entry.fileName, false) && !config.get('IO', 'enableImportOverWritting')) {
                console.log(`Skipping import for ${entry.fileName} because overwrite is disabled and dataset already exists.`);
                queue.markQeueEntryDone(entry.fileName);
                continue;
            }

            await integrations.callPyFunc('open', [entry.destPath], { timeoutMs: 120000 });
            console.log(`File loaded into memory: ${entry.fileName}`);
            const overview = await integrations.callPyFunc('getOverview');
            const pressureVariableName = basicFunctions.getMatchingVariableName(overview.variables, 'pressure', ['PRES_ADJUSTED', 'PRES']);
            if (pressureVariableName) {
                const pressureResult = await integrations.callPyFunc('getLastNonNanValueInFirstProfile', [pressureVariableName]);
                if (!(pressureResult && typeof pressureResult === 'object' && 'error' in pressureResult)) {
                    overview.lastPressureValue = pressureResult;
                }
            }

            await saveDatasetToJSON(ModuleDependencies["FileHandle"], entry.fileName, overview);
            const datasetEntry = getEntryInSimpleData(entry.fileName);
            const coords = datasetEntry.coords;
            if (coords && coords.length > 0 && coords[0].lat !== undefined && coords[0].lon !== undefined) {
                const lat = coords[0].lat;
                const lon = coords[0].lon;
                console.log(`Creating marker for ${entry.fileName} at lat: ${lat}, lon: ${lon}`);
                const popupContent = DOM.leaf_buildPopupContent(datasetEntry, instance=false);
                DOM.leaf_insertDataMarker(appState, ModuleDependencies["DOM"], lat, lon, popupContent, {}, entry.fileName);
                console.log(`Marker created for: ${entry.fileName}`);
            } else {
                console.warn(`No valid coordinates found for ${entry.fileName}, marker not created.`);
            }
            queue.markQeueEntryDone(entry.fileName);
            console.log(`Queue entry done: ${entry.fileName}`);
        } catch (error) {
            console.error(`Error processing ${entry.fileName}:`, error);
            queue.markQeueEntryDone(entry.fileName);
        }
    }
}

/**
 * Reads the remove queue file and processes each entry one-by-one.
 * For each entry: closes dataset in Python, removes marker, sidebar entry, simpleData entry, and data file.
 */
async function processRemoveQeue(appState, dep) {
    const { DOM,integrations } = dep;
    const queueEntries = queue.readRemoveQeue();
    for (let i = 0; i < queueEntries.length; i++) {
        const entry = queueEntries[i];
        console.log(`Processing remove queue item ${i + 1}/${queueEntries.length}: ${entry.fileName}`);
        DOM.setLoadingText(`Removing file ${i + 1} of ${queueEntries.length}: ${entry.fileName}`);
        try {
            await integrations.callPyFunc('close');
            console.log(`Dataset closed in Python: ${entry.fileName}`);
        } catch (error) {
            console.error(`Error closing dataset ${entry.fileName}:`, error);
        }
        DOM.leaf_removeMapMarker(appState, entry.fileName);
        DOM.dom_removeSidebarEntry(entry.fileName);
        deleteEntryInSimpleData(entry.fileName);
        deleteDataFile(entry.fileName);
        appState.selectedFiles.delete(entry.fileName);
        delete appState.markers[entry.fileName];
        queue.markRemoveQeueEntryDone(entry.fileName);
        console.log(`Remove queue entry done: ${entry.fileName}`);
    }
}

function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function sanitizeViewFileName(viewName) {
    const safeName = String(viewName || 'Untitled View')
        .trim()
        .replace(/[<>:"/\\|?*]+/g, '_')
        .replace(/\s+/g, ' ');

    return safeName.length > 0 ? safeName : 'Untitled View';
}

function serializeAxis(axis = {}) {
    return {
        AxisSide: axis.AxisSide || 'X',
        Data: axis.Data ?? null
    };
}

function serializeChartInstance(chartInstance = {}, index = 0) {
    return {
        general: {
            Name: chartInstance?.general?.Name || `Chart ${index + 1}`,
            EnableZoom: chartInstance?.general?.EnableZoom ?? true,
            EnableDataPoints: chartInstance?.general?.EnableDataPoints ?? true,
            EnableAxisPointers: chartInstance?.general?.EnableAxisPointers ?? true
        },
        axis: Array.isArray(chartInstance?.axis)
            ? chartInstance.axis.map(serializeAxis)
            : []
    };
}

function serializeView(currentView = {}, options = {}) {
    const includePlotData = options.includePlotData ?? currentView.includePlotData ?? false;
    const viewName = options.name || currentView.name || 'Untitled View';
    const savedView = {
        meta: {
            schema: 'netseadf-view',
            version: 1,
            savedAt: new Date().toISOString()
        },
        view: {
            name: viewName,
            type: currentView.type || null,
            dataSelection: currentView.dataSelection || null,
            vars: Array.isArray(currentView.vars) ? [...currentView.vars] : [],
            viewVars: Array.isArray(currentView.viewVars)
                ? [...currentView.viewVars]
                : Array.from(currentView.viewVars || []),
            isViewGenerated: Boolean(currentView.isViewGenerated),
            includePlotData: Boolean(includePlotData),
            data: Array.isArray(currentView.data) ? [...currentView.data] : [],
            targetDim: currentView.targetDim || null,
            OnlyUseFirstTimestamps: Boolean(currentView.OnlyUseFirstTimestamps),
            useOnlyFilesWithPPTInput: Boolean(currentView.useOnlyFilesWithPPTInput),
            chartInstances: Array.isArray(currentView.chartInstances)
                ? currentView.chartInstances.map(serializeChartInstance)
                : []
        }
    };

    if (includePlotData) {
        savedView.cache = {
            dataMap: currentView.dataMap || {}
        };
    }

    return savedView;
}

function deserializeView(savedView = {}) {
    const viewPayload = savedView.view || savedView;
    const chartInstances = Array.isArray(viewPayload.chartInstances)
        ? viewPayload.chartInstances.map((chartInstance, index) => ({
            general: {
                Name: chartInstance?.general?.Name || `Chart ${index + 1}`,
                EnableZoom: chartInstance?.general?.EnableZoom ?? true,
                EnableDataPoints: chartInstance?.general?.EnableDataPoints ?? true,
                EnableAxisPointers: chartInstance?.general?.EnableAxisPointers ?? true
            },
            obj: null,
            axis: Array.isArray(chartInstance?.axis)
                ? chartInstance.axis.map(serializeAxis)
                : []
        }))
        : [];

    return {
        name: viewPayload.name || 'Untitled View',
        type: viewPayload.type || null,
        dataSelection: viewPayload.dataSelection || null,
        vars: Array.isArray(viewPayload.vars) ? [...viewPayload.vars] : [],
        viewVars: new Set(Array.isArray(viewPayload.viewVars) ? viewPayload.viewVars : []),
        isViewGenerated: Boolean(viewPayload.isViewGenerated),
        includePlotData: Boolean(viewPayload.includePlotData),
        data: Array.isArray(viewPayload.data) ? [...viewPayload.data] : [],
        targetDim: viewPayload.targetDim || null,
        OnlyUseFirstTimestamps: Boolean(viewPayload.OnlyUseFirstTimestamps),
        useOnlyFilesWithPPTInput: Boolean(viewPayload.useOnlyFilesWithPPTInput),
        chartInstances,
        dataMap: savedView?.cache?.dataMap || {}
    };
}

function listSavedViewFiles(extensionFilter = VIEW_FILE_EXTENSION) {
    ensureDirectoryExists(pathDep.savedDataPath);
    return listSavedDataFiles(pathDep.savedDataPath, extensionFilter);
}

async function saveViewToFile(currentView, options = {}) {
    try {
        ensureDirectoryExists(pathDep.savedDataPath);
        const serializedView = serializeView(currentView, options);
        const desiredName = sanitizeViewFileName(options.fileName || serializedView.view.name);
        const fileName = desiredName.endsWith(VIEW_FILE_EXTENSION)
            ? desiredName
            : `${desiredName}${VIEW_FILE_EXTENSION}`;
        const filePath = path.join(pathDep.savedDataPath, fileName);

        if (doesFileAlreadyExist(filePath) && !config.get('IO', 'enableImportOverWritting_ForViews')) {
            return {
                success: true,
                skipped: true,
                fileName,
                filePath,
                reason: 'View file already exists and overwrite is disabled.'
            };
        }

        await fs.promises.writeFile(filePath, JSON.stringify(serializedView, null, 2), 'utf-8');

        return {
            success: true,
            fileName,
            filePath,
            data: serializedView
        };
    } catch (error) {
        console.error('Error saving view file:', error);
        return { success: false, error: error.message };
    }
}

function loadViewFromFile(fileName) {
    try {
        ensureDirectoryExists(pathDep.savedDataPath);
        const targetPath = path.isAbsolute(fileName)
            ? fileName
            : path.join(pathDep.savedDataPath, fileName);

        const rawContent = fs.readFileSync(targetPath, 'utf-8');
        const parsed = JSON.parse(rawContent);

        return {
            success: true,
            fileName: path.basename(targetPath),
            filePath: targetPath,
            data: parsed,
            view: deserializeView(parsed)
        };
    } catch (error) {
        console.error('Error loading view file:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    doesFileAlreadyExist,
    listSavedDataFiles,
    listSavedViewFiles,
    copyFileToSavedData,
    processImportQeue,
    processRemoveQeue,
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
    serializeView,
    deserializeView,
    saveViewToFile,
    loadViewFromFile,
    sanitizeViewFileName,
    VIEW_FILE_EXTENSION
};