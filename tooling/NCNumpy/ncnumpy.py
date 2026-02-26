import xarray as xr
import numpy as np
import matplotlib.pyplot as plt
import json
import os
from typing import Mapping, Any
__dirname__: str = os.path.abspath(os.path.dirname(__file__))
choosenPath: str = os.path.abspath(os.path.join(__dirname__, '..','..','..','..','..','..', 'Arctic_MidDecember'))
# os.path.abspath(os.path.join(__dirname__, '..', '..', 'savedData'))

def getNCAttributes(ds: xr.Dataset) -> Mapping[str, Any]:
    """Return the attributes of an xarray Dataset.

    Raises TypeError if `ds` is not an `xarray.Dataset`.
    """
    if not isinstance(ds, xr.Dataset):
        raise TypeError(f"getNCAttributes expects an xarray.Dataset, got {type(ds)!r}")
    return json.dumps(dict(ds.attrs), indent=2, default=str)

def getNCVariables(ds: xr.Dataset) -> Mapping[str, Any]:
    """Return the variables of an xarray Dataset.

    Raises TypeError if `ds` is not an `xarray.Dataset`.
    """
    if not isinstance(ds, xr.Dataset):
        raise TypeError(f"getNCVariables expects an xarray.Dataset, got {type(ds)!r}")
    return json.dumps(json.dumps(dict(ds.data_vars),indent=2, default=str), indent=2, default=str)

def getNCDimensions(ds: xr.Dataset) -> Mapping[str, Any]:
    """Return the dimensions of an xarray Dataset.

    Raises TypeError if `ds` is not an `xarray.Dataset`.
    """
    if not isinstance(ds, xr.Dataset):
        raise TypeError(f"getNCDimensions expects an xarray.Dataset, got {type(ds)!r}")
    return json.dumps(dict(ds.sizes), indent=2, default=str)

def getAllVarValues(ds: xr.Dataset, manualInput=False, manualVarName="DEPTH") -> Mapping[str, Any]:
    """
    Return all the values of a particular variable
    """
    if not manualInput:
        specificChoice = input("Type Variable Name: ")
    else:
        specificChoice = manualVarName

    if not isinstance(ds, xr.Dataset):
        raise TypeError(f"getAllVarValues expects an xarray.Dataset, got {type(ds)!r}")
    
    # Check if variable exists in dataset 
    #(THIS DOES NOT WORK YET)
    if specificChoice not in ds:
        print(f"Variable '{specificChoice}' not found in dataset")
        return [0, 0]
    
    var = ds[specificChoice]
    print(f"{specificChoice} dims: {var.dims}, shape: {var.shape}")
    arr = var.isel({var.dims[0]: 0}).values if len(var.dims) > 1 else var.values
    return arr.flatten()

def simplePlot(ds: xr.Dataset, varname: str) -> None:
    """Plot `varname` from `ds` and show the figure.

    Raises KeyError if the variable is not present in the dataset.
    """
    if varname not in ds:
        raise KeyError(f"Variable {varname!r} not found in dataset")
    ds[varname].plot()
    plt.show()

def advancedPlot(x, y, **kwargs):
    return XYPlot(x, y, **kwargs)
    
def XYPlot(x, y, invert_yaxis=False, title=False, XYLabel=False):
    """Plot `y` versus `x` using matplotlib.

    Both `x` and `y` are expected to be 1-D numeric sequences (lists, numpy
    arrays or xarray DataArray). The function converts inputs to NumPy arrays,
    validates length and dimensionality, creates a simple line plot and
    returns the `(fig, ax)` tuple. By default the figure is shown.
    """
    x_arr = np.asarray(x).flatten()
    y_arr = np.asarray(y).flatten()

    if x_arr.ndim != 1 or y_arr.ndim != 1:
        raise ValueError("XYPlot expects 1-D numeric arrays for x and y")
    if x_arr.shape[0] != y_arr.shape[0]:
        raise ValueError("x and y must have the same length")

    fig, ax = plt.subplots()

    if title:
        ax.set_title(title)
    
    ax.plot(x_arr, y_arr)

    if XYLabel:
        ax.set_xlabel(XYLabel[0])
        ax.set_ylabel(XYLabel[1])
    else:
        ax.set_xlabel('x')
        ax.set_ylabel('y')

    if invert_yaxis:
        ax.invert_yaxis()
    ax.grid(True)
    plt.tight_layout()
    plt.show()
    return fig, ax

def XYPlot_Multi(data_pairs, labels=None, xlabel='x', ylabel='y', title=None, invert_yaxis=False, colors=None):
    """Plot multiple lines on the same graph.
    
    Parameters:
    - data_pairs: list of (x, y) tuples, e.g. [(x1, y1), (x2, y2), ...]
    - labels: list of labels for each line (for legend)
    - xlabel, ylabel, title: axis labels and title
    - invert_yaxis: flip y-axis (useful for depth plots)
    - colors: list of colors for each line (optional)
    
    Returns (fig, ax).
    """
    fig, ax = plt.subplots()
    
    #(x and y here are the x&y ArrayData pairs for each ds) 
    for i, (x, y) in enumerate(data_pairs):
        x_arr = np.asarray(x).flatten()
        y_arr = np.asarray(y).flatten()
        
        if x_arr.shape[0] != y_arr.shape[0]:
            raise ValueError(f"Line {i}: x and y must have the same length")
        
        plot_kwargs = {}
        if labels and i < len(labels):
            plot_kwargs['label'] = labels[i]
        if colors and i < len(colors):
            plot_kwargs['color'] = colors[i]
            
        ax.plot(x_arr, y_arr, **plot_kwargs)
    
    ax.set_xlabel(xlabel)
    ax.set_ylabel(ylabel)
    if title:
        ax.set_title(title)
    if invert_yaxis:
        ax.invert_yaxis()
    ax.grid(True)
    
    if labels:
        ax.legend()
    
    plt.tight_layout()
    plt.show()
    return fig, ax

def getCoords(ds: xr.Dataset):
    """Return latitude and longitude coordinate pairs from an xarray Dataset.

    Raises TypeError if `ds` is not an `xarray.Dataset`.
    """
    if not isinstance(ds, xr.Dataset):
        raise TypeError(f"getCoords expects an xarray.Dataset, got {type(ds)!r}")
    
    lat_possibilities = ['lat', 'latitude', 'LATITUDE', 'LAT']
    lon_possibilities = ['long', 'longitude', 'LONGITUDE', 'LONG', 'LON', 'lon']
    
    lats = None
    lons = None
    
    for coord_name in ds.coords:
        if coord_name in lat_possibilities:
            lats = ds.coords[coord_name].values.tolist()
        if coord_name in lon_possibilities:
            lons = ds.coords[coord_name].values.tolist()
    
    return (lats, lons)

def hasPSAL(ds: xr.Dataset) -> bool:
    """Check if an xarray Dataset has a PSAL variable.

    Returns True if the dataset contains a PSAL variable, False otherwise.
    Raises TypeError if `ds` is not an `xarray.Dataset`.
    """
    if not isinstance(ds, xr.Dataset):
        raise TypeError(f"hasPSAL expects an xarray.Dataset, got {type(ds)!r}")
    
    return 'PSAL' in ds.data_vars or 'PSAL' in ds

if __name__ == '__main__':
    testNumber = 3

    if testNumber == 0: # SINGLE
        # use the proper filename extension so xarray can auto-detect the backend
        path = os.path.join(choosenPath, "GL_PR_PF_1902579.nc")
        # explicitly select the netCDF4 engine (requires the `netCDF4` package)
        ds = xr.open_dataset(path, engine='netcdf4')
        TEMP = getAllVarValues(ds)
        print(f"TEMP shape: {TEMP.shape}")
        DEPTH = getAllVarValues(ds)
        print(f"DEPTH shape: {DEPTH.shape}")
        XYPlot(TEMP, DEPTH, invert_yaxis=True)

    elif testNumber == 1: #MUTLI (manual)
        pathArr = [
            os.path.join(choosenPath, "GL_PR_PF_1902579.nc"),
            os.path.join(choosenPath, "GL_PR_PF_4903674.nc")
        ]

        dsArr = [
            xr.open_dataset(pathArr[0], engine='netcdf4'),
            xr.open_dataset(pathArr[1], engine='netcdf4')
        ]

        XYPairArr = [
            [getAllVarValues(dsArr[0], True, "PSAL"),
             getAllVarValues(dsArr[0], True, "DEPTH")
            ],
            [getAllVarValues(dsArr[1], True, "PSAL"),
             getAllVarValues(dsArr[1], True, "DEPTH")
            ],
        ]

        XYPlot_Multi(XYPairArr, xlabel='x', ylabel='y', title="PSAL & DEPTH", invert_yaxis=True)
    
    elif testNumber == 2: #MULTI (auto)
        pathArr = [os.path.join(choosenPath, f) for f in os.listdir(choosenPath) if f.endswith('.nc')]
        dsArr = []
        XYPairArr = []

        for fileName in pathArr:
            dsArr.append(xr.open_dataset(os.path.join(choosenPath, fileName), engine='netcdf4'))
            if len(dsArr) > 12:
                break
        
        for ds in dsArr:
            XYPairArr.append(
                [
                    getAllVarValues(ds, True, "TEMP"),
                    getAllVarValues(ds, True, "DEPTH")
                ]
            )

        XYPlot_Multi(XYPairArr, xlabel='x', ylabel='y', title="TEMP & DEPTH", invert_yaxis=True)

    elif testNumber == 3:
        path = os.path.join(choosenPath, "GL_PR_PF_1902579.nc")
        # explicitly select the netCDF4 engine (requires the `netCDF4` package)
        ds = xr.open_dataset(path, engine='netcdf4')

        print(getCoords(ds))