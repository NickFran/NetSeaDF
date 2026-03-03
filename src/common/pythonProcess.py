import sys, json, os, math
import numpy as np
import xarray as xr
from datetime import datetime

ds = None

def selectDataset():
    pass

def clean(v):
    if isinstance(v, np.ndarray):
        if np.issubdtype(v.dtype, np.floating):
            arr = v.astype(object)
            mask = ~np.isfinite(v)
            if mask.any():
                arr[mask] = None
            return arr.tolist()
        if np.issubdtype(v.dtype, np.integer):
            return v.astype(int).tolist()
        return [clean(x) for x in v.tolist()]
    if isinstance(v, bytes): return v.decode('utf-8', errors='replace')
    if isinstance(v, np.floating): return None if not np.isfinite(v) else float(v)
    if isinstance(v, np.integer): return int(v)
    if isinstance(v, (float,)): return None if not math.isfinite(v) else v
    if isinstance(v, dict): return {k: clean(val) for k, val in v.items()}
    if isinstance(v, (list, tuple)): return [clean(x) for x in list(v)]
    if isinstance(v, (np.datetime64, datetime)): return str(v)
    return v

def open_ds(path):  # "open"
    global ds; 
    ds = xr.open_dataset(path, engine="netcdf4"); 
    return "Loaded"

def close_ds():
    """Close the currently open dataset"""
    global ds
    if ds is not None:
        ds.close()
        ds = None
        return "Closed"
    return "No dataset to close"

def getDimensions():
    return {k: int(v) for k, v in ds.dims.items()}

def getAttributes():
    return clean(dict(ds.attrs))

def getSummary():
    return ds.attrs['summary'] if 'summary' in ds.attrs else "No summary available"

def getCoords():
    coordPossibilities = [
        'lat', 'latitude', 'LATITUDE', 'LAT',
        'long', 'longitude', 'LONGITUDE', 'LONG', 'LON'
        ]

    latpossibilities = ['lat', 'latitude', 'LATITUDE', 'LAT']
    foundLats = []
    longpossibilities = ['long', 'longitude', 'LONGITUDE', 'LONG', 'LON', 'lon']
    foundLongs = []

    for coordName in coordPossibilities:

        if (coordName in ds.coords) and (coordName in latpossibilities): 
            foundLats = clean(ds.coords[coordName].values.tolist())

        if (coordName in ds.coords) and (coordName in longpossibilities):
            foundLongs = clean(ds.coords[coordName].values.tolist())

    try:
        return foundLats, foundLongs
    except Exception as e:
        return {"error": f"getCoords failed: {str(e)}"}

def getOverview():
    try:
        return {
            "dimensions": getDimensions(),
            "variables": getVariables(),
            "attributes": getAttributes(),
            "coordinates": getCoords() # Just return coordinate names, not values
        }
    except Exception as e:
        return {"error": f"getOverview failed: {str(e)}"}

def getVariables():
    return list(ds.data_vars)

def getVariable(varName):
    if varName not in ds.data_vars: return {"error": f"Variable '{varName}' not found"}
    return clean(ds[varName].values.tolist())

# eventually convert this to options like in integratinos.js (if its allows with child process)
def getVariableByDimension(varName, dimName, compact=False, reduceOtherDims=False, start=None, end=None, reduceDims=None):
    """Get all values of a variable for each value of a dimension.
    Returns a dict with dimension values as keys and variable data as values."""
    try:
        if varName not in ds.data_vars:
            return {"error": f"Variable '{varName}' not found"}
        
        if dimName not in ds.dims:
            return {"error": f"Dimension '{dimName}' not found"}
        
        var = ds[varName]
        
        # Check if the variable has this dimension
        if dimName not in var.dims:
            return {"error": f"Variable '{varName}' does not have dimension '{dimName}'"}
        
        # Get the dimension coordinate values
        dim_values = ds.coords[dimName].values

        if start is not None or end is not None:
            s = int(start) if start is not None else None
            e = int(end) if end is not None else None
            var = var.isel({dimName: slice(s, e)})
            dim_values = dim_values[s:e]

        if reduceOtherDims:
            other_dims = [d for d in var.dims if d != dimName]
            if other_dims:
                var = var.mean(dim=other_dims, skipna=True)
        elif reduceDims:
            dims_to_reduce = [d for d in reduceDims if d in var.dims and d != dimName]
            if dims_to_reduce:
                var = var.mean(dim=dims_to_reduce, skipna=True)

        # Move the target dimension to the first axis to avoid repeated isel calls
        var_reordered = var.transpose(dimName, ...)
        data = var_reordered.values

        if compact:
            return {
                dimName: clean(dim_values),
                varName: clean(data)
            }

        result = {}
        for i, dim_val in enumerate(dim_values):
            result[clean(dim_val)] = clean(data[i])

        return result
        
    except Exception as e:
        return {"error": f"getVariableByDimension failed: {str(e)}"}

functions = {
    "open": open_ds,
    "close": close_ds,
    "getOverview": getOverview,
    "getAttributes": getAttributes,
    "getSummary": getSummary,
    "getCoords": getCoords,
    "getDimensions": getDimensions,
    "getVariables": getVariables,
    "getVariable": getVariable,
    "getVariableByDimension": getVariableByDimension  # Add this line
}

# One-shot mode when called with argv (e.g., execFile)
if len(sys.argv) > 1:
    cmd = sys.argv[1]
    args = sys.argv[2:]
    fn = functions.get(cmd)
    try:
        if not fn:
            raise ValueError(f"Unknown cmd: {cmd}")
        data = fn(*args)
        sys.stdout.write(json.dumps({"ok": True, "result": data}))
    except Exception as e:
        sys.stdout.write(json.dumps({"ok": False, "error": str(e)}))
    sys.stdout.flush()
    sys.exit(0)

# Persistent loop
for line in sys.stdin:
    line = line.strip()
    if not line: continue

    try:
        req = json.loads(line)
        fn = functions.get(req.get("cmd"))
        if not fn: raise ValueError(f"Unknown cmd: {req.get('cmd')}")
        data = fn(*req.get("args", []))
        response = json.dumps({"ok": True, "result": data}) + "\n"
        sys.stdout.write(response)
        sys.stdout.flush()

    except Exception as e:
        response = json.dumps({"ok": False, "error": str(e)}) + "\n"
        sys.stdout.write(response)
        sys.stdout.flush()