const fs = require('fs');
const os = require('os');
const path = require('path');
const pathDep = require('./pathDep');
const fileHandle = require('./fileHandle');

const TRANSFER_SCHEMA = 'netseadf-transfer';
const TRANSFER_VERSION = 1;
const TRANSFER_PACKAGE_EXTENSION = '.zip';

let archiverModulePromise = null;
let admZipModulePromise = null;

async function createZipArchive(options = {}) {
    if (!archiverModulePromise) {
        archiverModulePromise = import('archiver');
    }

    const archiverModule = await archiverModulePromise;
    return new archiverModule.ZipArchive(options);
}

async function getAdmZip() {
    if (!admZipModulePromise) {
        admZipModulePromise = Promise.resolve(require('adm-zip'));
    }

    return admZipModulePromise;
}

function formatTimestampForFileName(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

function normalizeTransferOptions(options = {}) {
    return {
        includePlatforms: Boolean(options.includePlatforms),
        includeViews: Boolean(options.includeViews),
        includeSettings: Boolean(options.includeSettings),
        includeFilteredVars: Boolean(options.includeFilteredVars)
    };
}

function collectTransferFiles(options = {}) {
    const normalizedOptions = normalizeTransferOptions(options);
    const selectedEntries = [];

    if (normalizedOptions.includePlatforms) {
        const platformFiles = fileHandle.listSavedDataFiles(pathDep.savedDataPath, '.nc');
        platformFiles.forEach((fileName) => {
            selectedEntries.push({
                category: 'platforms',
                fileName,
                sourcePath: path.join(pathDep.savedDataPath, fileName),
                archivePath: path.posix.join('savedData', fileName)
            });
        });
    }

    if (normalizedOptions.includeViews) {
        const viewFiles = fileHandle.listSavedViewFiles();
        viewFiles.forEach((fileName) => {
            selectedEntries.push({
                category: 'views',
                fileName,
                sourcePath: path.join(pathDep.savedDataPath, fileName),
                archivePath: path.posix.join('savedData', fileName)
            });
        });
    }

    if (normalizedOptions.includeSettings) {
        const configPath = pathDep.resolveToProperDataPath(__dirname, 'config');
        const configFiles = fileHandle.listSavedDataFiles(configPath, '.yaml');
        configFiles.forEach((fileName) => {
            selectedEntries.push({
                category: 'settings',
                fileName,
                sourcePath: path.join(configPath, fileName),
                archivePath: path.posix.join('config', fileName)
            });
        });
    }

    if (normalizedOptions.includeFilteredVars) {
        const filteredVarsPath = pathDep.filteredVarsPath;

        if (!fileHandle.doesFileAlreadyExist(filteredVarsPath)) {
            fs.mkdirSync(path.dirname(filteredVarsPath), { recursive: true });
            fs.writeFileSync(filteredVarsPath, JSON.stringify({ vars: [] }, null, 2), 'utf-8');
        }

        selectedEntries.push({
            category: 'filteredVars',
            fileName: 'filteredVars.json',
            sourcePath: filteredVarsPath,
            archivePath: path.posix.join('config', 'filteredVars.json')
        });
    }

    return selectedEntries.filter((entry) => fileHandle.doesFileAlreadyExist(entry.sourcePath));
}

function createTransferMetadata(options = {}, selectedEntries = [], appVersion = 'unknown') {
    const normalizedOptions = normalizeTransferOptions(options);
    const groupedFiles = selectedEntries.reduce((acc, entry) => {
        if (!acc[entry.category]) {
            acc[entry.category] = [];
        }
        acc[entry.category].push(entry.fileName);
        return acc;
    }, {
        platforms: [],
        views: [],
        settings: [],
        filteredVars: []
    });

    return {
        meta: {
            schema: TRANSFER_SCHEMA,
            version: TRANSFER_VERSION,
            createdAt: new Date().toISOString(),
            appVersion
        },
        selection: normalizedOptions,
        counts: {
            totalFiles: selectedEntries.length,
            platforms: groupedFiles.platforms.length,
            views: groupedFiles.views.length,
            settings: groupedFiles.settings.length,
            filteredVars: groupedFiles.filteredVars.length
        },
        files: groupedFiles
    };
}

function ensureTransferMetadataShape(metadata) {
    if (!metadata || typeof metadata !== 'object') {
        throw new Error('Transfer metadata is missing or invalid.');
    }

    if (metadata?.meta?.schema !== TRANSFER_SCHEMA) {
        throw new Error('Transfer package schema is not recognized.');
    }

    if (typeof metadata?.meta?.version !== 'number' || metadata.meta.version > TRANSFER_VERSION) {
        throw new Error('Transfer package version is not supported by this app version.');
    }

    if (!metadata.files || typeof metadata.files !== 'object') {
        throw new Error('Transfer package file manifest is missing.');
    }
}

function buildImportedFileManifest(tempDir, metadata) {
    const savedDataTempDir = path.join(tempDir, 'savedData');
    const configTempDir = path.join(tempDir, 'config');

    return {
        platforms: Array.isArray(metadata?.files?.platforms)
            ? metadata.files.platforms.map((fileName) => ({
                fileName,
                sourcePath: path.join(savedDataTempDir, fileName),
                destPath: path.join(pathDep.savedDataPath, fileName)
            }))
            : [],
        views: Array.isArray(metadata?.files?.views)
            ? metadata.files.views.map((fileName) => ({
                fileName,
                sourcePath: path.join(savedDataTempDir, fileName),
                destPath: path.join(pathDep.savedDataPath, fileName)
            }))
            : [],
        settings: Array.isArray(metadata?.files?.settings)
            ? metadata.files.settings.map((fileName) => ({
                fileName,
                sourcePath: path.join(configTempDir, fileName),
                destPath: path.join(pathDep.resolveToProperDataPath(__dirname, 'config'), fileName)
            }))
            : [],
        filteredVars: Array.isArray(metadata?.files?.filteredVars)
            ? metadata.files.filteredVars.map((fileName) => ({
                fileName,
                sourcePath: path.join(configTempDir, fileName),
                destPath: path.join(pathDep.resolveToProperDataPath(__dirname, 'config'), fileName)
            }))
            : []
    };
}

function validateImportedFileManifest(fileManifest) {
    const missingFiles = [];

    Object.values(fileManifest).forEach((entries) => {
        entries.forEach((entry) => {
            if (!fileHandle.doesFileAlreadyExist(entry.sourcePath)) {
                missingFiles.push(entry.fileName);
            }
        });
    });

    if (missingFiles.length > 0) {
        throw new Error(`Transfer package is missing required files: ${missingFiles.join(', ')}`);
    }
}

async function extractTransferArchive(archivePath) {
    if (!archivePath || !fileHandle.doesFileAlreadyExist(archivePath)) {
        return {
            success: false,
            error: 'The selected transfer package could not be found.'
        };
    }

    try {
        const AdmZip = await getAdmZip();
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'netseadf-transfer-'));
        const archive = new AdmZip(archivePath);
        archive.extractAllTo(tempDir, true);

        const metadataPath = path.join(tempDir, 'transferMetaData.json');
        if (!fileHandle.doesFileAlreadyExist(metadataPath)) {
            throw new Error('transferMetaData.json was not found in the transfer package.');
        }

        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
        ensureTransferMetadataShape(metadata);

        const fileManifest = buildImportedFileManifest(tempDir, metadata);
        validateImportedFileManifest(fileManifest);

        return {
            success: true,
            archivePath,
            tempDir,
            metadata,
            fileManifest
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

function cleanupTransferExtraction(tempDir) {
    if (!tempDir || !fs.existsSync(tempDir)) {
        return;
    }

    fs.rmSync(tempDir, { recursive: true, force: true });
}

async function createTransferArchive(options = {}, destinationDir, appVersion = 'unknown') {
    const normalizedOptions = normalizeTransferOptions(options);
    if (!normalizedOptions.includePlatforms && !normalizedOptions.includeViews && !normalizedOptions.includeSettings && !normalizedOptions.includeFilteredVars) {
        return {
            success: false,
            error: 'No transfer options were selected.'
        };
    }

    const selectedEntries = collectTransferFiles(normalizedOptions);
    if (selectedEntries.length === 0) {
        return {
            success: false,
            error: 'No files were found for the selected transfer options.'
        };
    }

    const archiveFileName = `NetSeaDF-transfer-${formatTimestampForFileName()}${TRANSFER_PACKAGE_EXTENSION}`;
    const archivePath = path.join(destinationDir, archiveFileName);
    const metadata = createTransferMetadata(normalizedOptions, selectedEntries, appVersion);

    const archive = await createZipArchive({ zlib: { level: 9 } });

    await new Promise((resolve, reject) => {
        const output = fs.createWriteStream(archivePath);

        output.on('close', resolve);
        output.on('error', reject);
        archive.on('error', reject);

        archive.pipe(output);

        selectedEntries.forEach((entry) => {
            archive.file(entry.sourcePath, { name: entry.archivePath });
        });

        archive.append(JSON.stringify(metadata, null, 2), { name: 'transferMetaData.json' });
        archive.finalize();
    });

    return {
        success: true,
        archivePath,
        archiveFileName,
        fileCount: selectedEntries.length,
        metadata
    };
}

module.exports = {
    normalizeTransferOptions,
    collectTransferFiles,
    createTransferMetadata,
    createTransferArchive,
    extractTransferArchive,
    cleanupTransferExtraction,
    TRANSFER_SCHEMA,
    TRANSFER_VERSION,
    TRANSFER_PACKAGE_EXTENSION
};
