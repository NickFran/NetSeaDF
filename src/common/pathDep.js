const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const APP_DATA_FOLDER_NAME = 'NetSeaDF';

function reportPathDepError(message) {
    console.error(message);
}

function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function copyPathContentsIfMissing(sourcePath, targetPath) {
    if (!fs.existsSync(sourcePath)) {
        return;
    }

    const sourceStats = fs.statSync(sourcePath);

    if (sourceStats.isDirectory()) {
        ensureDirectoryExists(targetPath);

        const childNames = fs.readdirSync(sourcePath);
        childNames.forEach((childName) => {
            copyPathContentsIfMissing(
                path.join(sourcePath, childName),
                path.join(targetPath, childName)
            );
        });

        return;
    }

    if (!fs.existsSync(targetPath)) {
        ensureDirectoryExists(path.dirname(targetPath));
        fs.copyFileSync(sourcePath, targetPath);
    }
}

function isDevelopmentMode() {
    return !process.resourcesPath || process.resourcesPath.includes('node_modules');
}

function getWritableAppDataRoot() {
    if (process.platform === 'darwin') {
        return path.join(os.homedir(), 'Library', 'Application Support', APP_DATA_FOLDER_NAME);
    }

    if (process.platform === 'win32') {
        return path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), APP_DATA_FOLDER_NAME);
    }

    return path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), APP_DATA_FOLDER_NAME);
}

function getBundledProductionDataPath(folderName) {
    return path.join(process.resourcesPath, 'dist', folderName);
}

function getWritableProductionDataPath(folderName) {
    return path.join(getWritableAppDataRoot(), 'dist', folderName);
}

function ensureProductionDataPath(folderName) {
    const bundledPath = getBundledProductionDataPath(folderName);
    const writablePath = getWritableProductionDataPath(folderName);

    ensureDirectoryExists(writablePath);
    copyPathContentsIfMissing(bundledPath, writablePath);

    return writablePath;
}

// Takes folder names and converts to hardset ints of the number of sublevels from root.
const folderSublevelFromRootMap = {
    'dist': 1,
    'logs': 1,
    'savedData' : 1,
    'src' : 1,
    'common' : 2,
    'debug' : 2,
    'mdeia' : 2
}

const savedDataPath = resolveToProperDataPath(__dirname, 'savedData');
const jsonPath = path.join(savedDataPath, 'simpleData.json');
const configPath = resolveToProperDataPath(__dirname, 'config');
const filteredVarsPath = path.join(configPath, 'filteredVars.json');
const qeuesPath = resolveToProperDataPath(__dirname, 'qeues');
const importQeuePath = path.join(qeuesPath, 'importQeue.json');
const removeQeuePath = path.join(qeuesPath, 'removeQeue.json');

// takes the __dirname and returns the current folder name
function getCurrentFolderName(dirname) {
    //.split(path.sep) splits the path into an array based on the system's path separator
    //pop() returns the last element of the array (last folder name in the path)
    return dirname.split(path.sep).pop();
}

// takes the __dirname and returns the current folder path
function getCurrentFolderPath(dirname) {
    return dirname;
}

// Expects Folder as input, uses it to find its corresponding sublevel.
function fromHereToRoot(dirname) {
    /**
     * How many .. do we need to get from the current folder to root?
     * Using the current directory, go backwards in the directory the exact amount to get the root.
     * 
     * @param {string} dirname - The __dirname variable from the file calling this function.
     * @returns {string} - The path from the current folder to root (e.g. "../../..").
     */

    // One of these per level from root
    let localPathObject = '..'

    // use both our functions to locally store the bame and path of the folder.
    let folderName = getCurrentFolderName(dirname);
    let folderPath = getCurrentFolderPath(dirname);

    // take the pathObject, and repeat it i times, where i is the value that the folder name maps to in the folderSublevelFromRootMap 
    // (its a string of n amounts of .., match will array it into groups of two using RE.
    let builtDotsArray = localPathObject.repeat(folderSublevelFromRootMap[folderName]).match(/.{1,2}/g);

    // as long as the folder name is in the map, return our new map using the current full path and appending on to it the proper number of ".."'s
    if (folderName in folderSublevelFromRootMap) {
        return path.join(folderPath, ...builtDotsArray); // 3 ... is the spread operator
    } else {
        reportPathDepError("NotFoundError, (foldername not found in sublevel Map)");
        return 'NotFoundError';
    }
}

function resolveToProperDataPath(dirname, folderName) {
    /**
     * Using the current directory, and the folder name we want,
     * This function will build the proper path to the folder,
     * automatically resolving the path based on whether we're in development or production mode.
     * 
     * @param {string} dirname - The __dirname variable from the file calling this function.
     * @param {string} folderName - The name of the folder we want to resolve to (e.g. "logs" or "savedData").
     * @returns {string} - The resolved path to the specified folder (adjusted for dev/prod mode).
     */

    let isSpecifiedFolderValid = ["logs", "savedData", "config", "qeues"].includes(folderName)

    if (isSpecifiedFolderValid) { 
        return isDevelopmentMode()
        // If Development Mode
            ? path.join(path.join(fromHereToRoot(dirname) , `${folderName}`))
        // If Production Mode - use a writable user data directory and seed it from bundled defaults.
            : ensureProductionDataPath(folderName);
    } else {
        reportPathDepError("InvalidFolderNameError, (folder name must be 'logs', 'savedData', 'config', or 'qeues')");
        return 'InvalidFolderNameError';
    }
}



    module.exports = { getCurrentFolderName, getCurrentFolderPath, fromHereToRoot, resolveToProperDataPath, jsonPath, savedDataPath, configPath, filteredVarsPath, qeuesPath, importQeuePath, removeQeuePath };