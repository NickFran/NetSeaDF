import sys, json, os, math
import numpy as np
import xarray as xr
from datetime import datetime

ds = None

def selectDataset():
    pass

def clean(v):
    if isinstance(v, np.floating): return None if not np.isfinite(v) else float(v)
    if isinstance(v, np.integer): return int(v)
    if isinstance(v, (float,)): return None if not math.isfinite(v) else v
    if isinstance(v, (list, tuple, np.ndarray)): return [clean(x) for x in list(v)]
    if isinstance(v, (np.datetime64, datetime)): return str(v)
    return v

def open_ds(path):  # "open"
    global ds; ds = xr.open_dataset(path); return "OK"

def getDimensions():
    return {k: int(v) for k, v in ds.sizes.items()}

def getVariables():
    return list(ds.data_vars)

def getVariable(varName):
    if varName not in ds.data_vars: return {"error": f"Variable '{varName}' not found"}
    return clean(ds[varName].values.tolist())

def getDimensionData(dimName):
    if dimName not in ds.dims: return {"error": f"Dimension '{dimName}' not found"}
    size = int(ds.sizes[dimName])
    coords = ds.coords[dimName].values.tolist() if dimName in ds.coords else None
    if coords is not None: coords = clean(coords)
    vars_with_dim = {}
    for vname, var in ds.data_vars.items():
        if dimName in var.dims:
            sel = {d: 0 for d in var.dims if d != dimName}
            vars_with_dim[vname] = clean(var.isel(**sel).values.tolist())
    return {"dimension": dimName, "size": size, "coords": coords, "variables": vars_with_dim}

functions = {
    "open": open_ds,
    "getDimensions": getDimensions,
    "getVariables": getVariables,
    "getVariable": getVariable,
    "getDimensionData": getDimensionData
}

# Persistent loop
for line in sys.stdin:
    line = line.strip()
    if not line: continue

    try:
        req = json.loads(line)
        fn = functions.get(req.get("cmd"))
        if not fn: raise ValueError(f"Unknown cmd: {req.get('cmd')}")
        data = fn(*req.get("args", []))
        sys.stdout.write(json.dumps({"ok": True, "result": data}) + "\n")
        sys.stdout.flush()

    except Exception as e:
        sys.stdout.write(json.dumps({"ok": False, "error": str(e)}) + "\n")
        sys.stdout.flush()