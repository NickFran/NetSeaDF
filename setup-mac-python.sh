#!/bin/bash
# Script to set up Python portable environments for macOS
# Run this on a Mac to rebuild the Python environments with correct package versions

set -e  # Exit on error

echo "Setting up macOS Portable Python environments..."

# Function to setup a Python environment
setup_python_env() {
    local arch=$1
    local python_dir=$2
    local packages_dir=$3
    
    echo ""
    echo "=== Setting up Python for $arch ==="
    
    # Verify Python executable exists
    if [ ! -f "$python_dir/bin/python3.10" ]; then
        echo "ERROR: Python executable not found at $python_dir/bin/python3.10"
        exit 1
    fi
    
    # Make Python executable
    chmod +x "$python_dir/bin/python3.10"
    
    # Verify packages directory exists
    if [ ! -d "$packages_dir" ]; then
        echo "ERROR: Packages directory not found at $packages_dir"
        exit 1
    fi
    
    echo "Python executable: $python_dir/bin/python3.10"
    echo "Packages directory: $packages_dir"
    
    # Uninstall existing packages to avoid conflicts (except pip and setuptools)
    echo "Uninstalling old packages..."
    "$python_dir/bin/python3.10" -m pip uninstall -y numpy pandas xarray netCDF4 cftime gsw fs || true
    
    # Install packages from wheels in correct order
    echo "Installing packages from wheels..."
    
    # Install numpy first (all other packages depend on it)
    "$python_dir/bin/python3.10" -m pip install --no-index --find-links="$packages_dir" numpy==2.2.6
    
    # Install other dependencies
    "$python_dir/bin/python3.10" -m pip install --no-index --find-links="$packages_dir" \
        packaging==26.0 \
        six==1.17.0 \
        python-dateutil==2.9.0.post0 \
        pytz==2026.1.post1 \
        tzdata==2025.3 \
        certifi==2026.2.25 \
        appdirs==1.4.4
    
    # Install scientific packages (these depend on numpy)
    "$python_dir/bin/python3.10" -m pip install --no-index --find-links="$packages_dir" \
        cftime==1.6.5 \
        gsw==3.6.20 \
        netCDF4==1.6.5
    
    # Install pandas and xarray (depend on numpy and other packages)
    "$python_dir/bin/python3.10" -m pip install --no-index --find-links="$packages_dir" \
        pandas==2.3.3 \
        xarray==2025.6.1
    
    # Install fs
    "$python_dir/bin/python3.10" -m pip install --no-index --find-links="$packages_dir" \
        fs==2.4.16
    
    # Verify installations
    echo ""
    echo "Verifying installations..."
    "$python_dir/bin/python3.10" -c "import numpy; print(f'numpy {numpy.__version__}')"
    "$python_dir/bin/python3.10" -c "import pandas; print(f'pandas {pandas.__version__}')"
    "$python_dir/bin/python3.10" -c "import xarray; print(f'xarray {xarray.__version__}')"
    "$python_dir/bin/python3.10" -c "import netCDF4; print(f'netCDF4 {netCDF4.__version__}')"
    "$python_dir/bin/python3.10" -c "import cftime; print(f'cftime {cftime.__version__}')"
    "$python_dir/bin/python3.10" -c "import gsw; print(f'gsw {gsw.__version__}')"
    
    echo "✓ $arch setup complete!"
}

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Setup ARM64 environment
if [ -d "$SCRIPT_DIR/PythonPortableMac_arm64" ]; then
    setup_python_env \
        "ARM64 (Apple Silicon)" \
        "$SCRIPT_DIR/PythonPortableMac_arm64/python" \
        "$SCRIPT_DIR/PythonPortableMac_arm64/packages"
else
    echo "WARNING: PythonPortableMac_arm64 directory not found, skipping..."
fi

# Setup x64 environment
if [ -d "$SCRIPT_DIR/PythonPortableMac_x64" ]; then
    setup_python_env \
        "x64 (Intel)" \
        "$SCRIPT_DIR/PythonPortableMac_x64/python" \
        "$SCRIPT_DIR/PythonPortableMac_x64/packages"
else
    echo "WARNING: PythonPortableMac_x64 directory not found, skipping..."
fi

echo ""
echo "=== All Python environments configured successfully! ==="
echo "You can now build the macOS app with: npm run build:mac"
