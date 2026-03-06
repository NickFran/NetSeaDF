# macOS Build Fixes

## Issues Resolved

### 1. Python Permission Error (EACCES)
**Error:** `spawn /Applications/SavV.app/Contents/Resources/PythonPortableMac_arm64/python/bin/python3.10 EACCES`

**Cause:** The Python executable didn't have execute permissions after being packaged by electron-builder.

**Fix:** Added `build/afterPack.js` hook that sets executable permissions (chmod 755) on Python binaries during the build process.

### 2. Python Script Path Error  
**Error:** `can't open file '/Applications/SavV.app/Contents/Frameworks/SavV Helper (Renderer).app/Contents/MacOS/resources/app.asar.unpacked/src/common/pythonProcess.py'`

**Cause:** Used `process.execPath` to construct the path, which points to the Electron helper process on macOS instead of the app's Resources folder.

**Fix:** Changed to use `process.resourcesPath` directly in `src/common/integrations.js`.

### 3. Numpy Binary Incompatibility
**Error:** `numpy.dtype size changed, may indicate binary incompatibility. Expected 96 from C header, got 88 from PyObject`

**Cause:** Version mismatch between `requirements.txt` and the actual wheel files in the Mac packages folders. Packages with C extensions (netCDF4, pandas, cftime, gsw) were compiled against numpy 2.2.6, but requirements.txt specified numpy 2.4.1.

**Fix:** 
- Updated `requirements.txt` to match the wheel versions in `PythonPortableMac_*/packages/`
- Created `setup-mac-python.sh` script to properly reinstall packages in the correct order

## Files Changed

1. **build/afterPack.js** (new) - Sets Python executable permissions
2. **electron-builder.yml** - Added `afterPack` hook
3. **src/common/integrations.js** - Fixed pythonProcess.py path for macOS
4. **requirements.txt** - Updated to match wheel versions
5. **setup-mac-python.sh** (new) - Script to rebuild Mac Python environments

## How to Rebuild for macOS

### On macOS:

1. **Rebuild the Python environments** (recommended for complete fix):
   ```bash
   chmod +x setup-mac-python.sh
   ./setup-mac-python.sh
   ```
   This will reinstall all Python packages in the correct order to ensure binary compatibility.

2. **Build the app:**
   ```bash
   npm run build:mac
   ```

3. **Test the built app:**
   - Install the DMG from `output/` folder
   - Try importing a .nc file
   - Check for any Python errors in Console

### If you can't run the shell script:

The Python environments should still work with the updated `requirements.txt`, but if you continue to see numpy errors, you may need to:

1. Download fresh wheel files matching the versions in `requirements.txt`
2. Manually install them using pip in the portable Python environments
3. Or use the pre-packaged wheels that are already compatible (as the setup script does)

## Version Reference

These versions are confirmed compatible (all wheels compiled together):

- numpy==2.2.6
- pandas==2.3.3  
- netCDF4==1.6.5
- xarray==2025.6.1
- cftime==1.6.5
- gsw==3.6.20
- packaging==26.0
- python-dateutil==2.9.0.post0
- fs==2.4.16

## Testing Checklist

After rebuilding, verify:
- [ ] App launches without errors
- [ ] Can add new .nc files
- [ ] Data displays correctly in cards
- [ ] Map markers appear for datasets
- [ ] No Python errors in Console
- [ ] Delete file functionality works

## Future Prevention

To avoid similar issues in the future:

1. Keep `requirements.txt` in sync with wheel files in `PythonPortableMac_*/packages/`
2. When upgrading packages, rebuild ALL packages together to ensure ABI compatibility
3. Test on both ARM64 and x64 architectures if possible
4. Always run the setup script after updating Python packages
