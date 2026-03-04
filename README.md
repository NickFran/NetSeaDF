# SavV

Savannah's View, a cross-platform desktop application for mapping and data visualization for acoustic datasets.

## Features
* Importing datasets
* Displaying multiple datasets on a map
* Viewing graphs of a dataset and its results

## Development Setup

### Prerequisites
- Node.js and npm
- Git

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd SavV
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
- Windows: `SavV Setup X.X.X.exe`
- macOS: `SavV-X.X.X.dmg`

### Notes

- **macOS builds from Windows**: You can build macOS installers on Windows, but they won't be code-signed
- **First-time macOS users**: Will need to right-click the app and select "Open" to bypass Gatekeeper
- **Architecture support**: Separate Python distributions are required for Intel vs Apple Silicon Macs