/**
 * afterPack hook for electron-builder
 * Sets executable permissions on Python binaries for macOS builds
 */

const fs = require('fs');
const path = require('path');

exports.default = async function(context) {
    // Only run for macOS builds
    if (context.electronPlatformName !== 'darwin') {
        console.log('Not a macOS build, skipping Python permission fix');
        return;
    }

    console.log('Running afterPack hook for macOS...');
    
    const appOutDir = context.appOutDir;
    const appName = context.packager.appInfo.productFilename;
    
    // Path to the app bundle
    const appPath = path.join(appOutDir, `${appName}.app`);
    const resourcesPath = path.join(appPath, 'Contents', 'Resources');
    
    // Set executable permissions for both Mac Python variants
    const pythonPaths = [
        path.join(resourcesPath, 'PythonPortableMac_arm64', 'python', 'bin', 'python3.10'),
        path.join(resourcesPath, 'PythonPortableMac_x64', 'python', 'bin', 'python3.10')
    ];
    
    for (const pythonPath of pythonPaths) {
        if (fs.existsSync(pythonPath)) {
            try {
                // Set executable permissions (755 = rwxr-xr-x)
                fs.chmodSync(pythonPath, 0o755);
                console.log(`✓ Set executable permissions on: ${pythonPath}`);
            } catch (error) {
                console.error(`✗ Failed to set permissions on ${pythonPath}:`, error);
            }
        } else {
            console.log(`- Python binary not found (expected for single-arch build): ${pythonPath}`);
        }
    }
    
    console.log('afterPack hook completed');
};
