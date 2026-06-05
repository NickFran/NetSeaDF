
<img width="1302" height="578" alt="NetSeaDFLogo_normal-Picsart-AiImageEnhancer" src="https://github.com/user-attachments/assets/4fa2887d-ea19-46f6-9559-fe5356ece896" />


<img width="1904" height="1071" alt="NetSeaDF1" src="https://github.com/user-attachments/assets/40385650-ec46-420e-9bc4-5a34447f34c1" />
<img width="1292" height="659" alt="Screenshot 2026-06-05 140034" src="https://github.com/user-attachments/assets/88f47d88-8515-4c8c-816c-91dd84edd92d" />


NetSeaDF, a cross-platform desktop application for mapping and data visualization of ARGO float datasets.
## Additional information
This application is made in accordance with research needs of the Opera Lab at University Of Rhode Island's Graduate School Of Oceanography.

Developed during URI GSO's OECI B2OE Program.

## Features
* Importing multiple datasets
* Displaying datasets on a map
* Filtering platforms by time & location
* Visualizing Float Profile Timelines
* Viewing graphs of multiple datasets
* SSP and TEMP contrasting plots
* Simple SSP plotting across a time range



## User Installation / Setup
### Step 1, browse the releases page
<img width="1452" height="1011" alt="step1" src="https://github.com/user-attachments/assets/9d9aaef4-4b95-48c9-927b-e42900f53ee9" />

## Step 2, click on the desired version
<img width="1428" height="1072" alt="image" src="https://github.com/user-attachments/assets/4402b0a4-9871-431e-879d-7b1392b72198" />

## Step 3, click on the desired file
<img width="1081" height="611" alt="step3" src="https://github.com/user-attachments/assets/a235522e-d7b6-4466-a78f-eb5682761fb3" />
.exe for Windows, .dmg for Mac, (Source Code is available as well if desired)


## Done!
By this point, when you install the software, it should be good to go!

## Potential issues
NOTICE: Mac users might have issues running the software and might see an error called "Read-Only" upon using the software after installation.
- This error means the software was not installed properly.
- Here is what to do if you see that error,
* Open the INTEL.dmg. (It should show a popup with the apps icon and an arrow instructing you to install the app to the Applications folder).
* In the popup, drag the NetSeaDF app icon into the Applications folder icon.
* Wait for the copy to finish.
* Open Applications and launch NetSeaDF from there.
* Do not launch NetSeaDF from the mounted .dmg.
* After confirming it opens from Applications, eject the mounted .dmg.
* (So to sum it all up: do not run the app from the mounted .dmg; copy it into Applications first.)


## Development Installation / Setup
### Prerequisites
- Node.js and npm
- Git

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd NetSeaDF
```

2. Install dependencies:
```bash
npm install
```

3. Run in development mode:
```bash
npm start
```

## Building Installers

This app bundles Python for each platform. You need to set up platform-specific Python distributions before building.

### Setting Up Python Distributions

#### For Windows Builds

The `PythonPortable` folder should already exist in your project. If not:

1. Create a Python virtual environment:
```powershell
python -m venv PythonPortable
```

2. Activate and install dependencies:
```powershell
.\PythonPortable\Scripts\Activate.ps1
pip install -r requirements.txt
```

#### For macOS Builds (Apple Silicon)

1. Download Python for macOS ARM64:
   - Go to: https://github.com/indygreg/python-build-standalone/releases
   - Download: `cpython-3.10.X-aarch64-apple-darwin-install_only.tar.gz`

2. Extract to your project:
```powershell
# On Windows
New-Item -ItemType Directory -Path "PythonPortableMac" -Force
tar -xzf path\to\cpython-3.10.X-aarch64-apple-darwin-install_only.tar.gz -C PythonPortableMac
```

3. Download macOS packages:
```powershell
pip download --platform macosx_11_0_arm64 --only-binary=:all: --python-version 3.10 --dest PythonPortableMac\packages numpy pandas xarray gsw netCDF4 fs python-dateutil
```

4. Install packages:
```powershell
Add-Type -Assembly System.IO.Compression.FileSystem
$sitePackages = "PythonPortableMac\python\lib\python3.10\site-packages"
Get-ChildItem "PythonPortableMac\packages\*.whl" | ForEach-Object {
    Write-Host "Installing $($_.Name)..."
    [System.IO.Compression.ZipFile]::ExtractToDirectory($_.FullName, $sitePackages)
}
```

#### For macOS Builds (Intel)

Follow the same steps as Apple Silicon, but download the x86_64 version:
- File: `cpython-3.10.X-x86_64-apple-darwin-install_only.tar.gz`
- Use `--platform macosx_10_9_x86_64` when downloading packages

### Build Commands

```bash
# Build for Windows only
npm run build

# Build for macOS only
npm run build:mac

# Build for both platforms
npm run build:all
```

### Build Outputs

Built installers will be in the `output/` folder:
- Windows: `NetSeaDF Setup X.X.X.exe`
- macOS: `NetSeaDF-X.X.X.dmg`

### Notes

- **macOS builds from Windows**: You can build macOS installers on Windows, but they won't be code-signed
- **First-time macOS users**: Will need to right-click the app and select "Open" to bypass Gatekeeper
- **Architecture support**: Separate Python distributions are required for Intel vs Apple Silicon Macs

