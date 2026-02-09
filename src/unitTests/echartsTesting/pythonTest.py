import sys, json, xarray as xr
import os
import xarray as xr
import json
from datetime import datetime
import numpy as np
import gsw


dirname = os.path.dirname(os.path.abspath(__file__))

dynamicPathBlock = "../../../../savedData/"


def json_serializer(obj):
    """Custom JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, (datetime, np.datetime64)):
        return obj.isoformat() if isinstance(obj, datetime) else str(obj)
    if isinstance(obj, np.integer):
        return int(obj)
    if isinstance(obj, np.floating):
        if np.isnan(obj) or np.isinf(obj):
            return '-'
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, bytes):
        return obj.decode('utf-8', errors='replace')
    if isinstance(obj, float):
        if np.isnan(obj) or np.isinf(obj):
            return '-'
        return obj
    raise TypeError(f"Type {type(obj)} not serializable")

def replace_nan_inf(obj):
    """Recursively replace NaN and Inf values with '-' in nested structures"""
    if isinstance(obj, float):
        if np.isnan(obj) or np.isinf(obj):
            return '-'
        return obj
    elif isinstance(obj, list):
        return [replace_nan_inf(item) for item in obj]
    elif isinstance(obj, dict):
        return {key: replace_nan_inf(value) for key, value in obj.items()}
    else:
        return obj

def my_function(a, b):
    return int(a) + int(b)

def other_function(x):
    return x.upper()

def getDataFile(path, fileName):
    ds = xr.open_dataset(dirname+dynamicPathBlock+fileName)
    data_dict = ds.to_dict()

    json_str = json.dumps(data_dict, default=json_serializer)
    return json_str
    #this is returning meaningful stuff, but its not parsing?

def getVariables(path, fileName):
    """Get all variable names from the dataset"""
    ds = xr.open_dataset(dirname+dynamicPathBlock+fileName)
    variables = list(ds.data_vars.keys())
    return variables

def getDimensions(path, fileName):
    """Get all dimension names and their sizes from the dataset"""
    ds = xr.open_dataset(dirname+dynamicPathBlock+fileName)
    dimensions = dict(ds.dims)
    return dimensions

def getVariable(fileName, varName):
    """Get all values for a specific variable"""
    ds = xr.open_dataset(dirname+dynamicPathBlock+fileName)
    if varName in ds.data_vars:
        data = ds[varName].values.tolist()
        # Recursively replace NaN and Inf with '-'
        data = replace_nan_inf(data)
        return data
    else:
        raise ValueError(f"Variable '{varName}' not found in dataset")

def getDepthValues(fileName):
    """Get the depth/pressure values for the DEPTH dimension"""
    ds = xr.open_dataset(dirname+dynamicPathBlock+fileName)
    if 'PRES_ADJUSTED' in ds.data_vars:
        # Get the first time step's pressure values (should be same for all times)
        depths = ds['PRES_ADJUSTED'].values[0].tolist()
    elif 'PRES' in ds.data_vars:
        depths = ds['PRES'].values[0].tolist()
    else:
        raise ValueError("No pressure variable found")
    
    # Replace NaN/Inf with '-'
    depths = replace_nan_inf(depths)
    return depths

def getTempAtDepth(fileName, timeIndex, depthIndex):
    """Get TEMP value at a specific time and depth index"""
    ds = xr.open_dataset(dirname+dynamicPathBlock+"GL_PR_PF_1902604.nc")
    if 'TEMP' in ds.data_vars:
        temp_value = ds['TEMP'].values[int(timeIndex)][int(depthIndex)]
        # Replace NaN/Inf with '-'
        if isinstance(temp_value, float) and (np.isnan(temp_value) or np.isinf(temp_value)):
            return '-'
        return float(temp_value)
    else:
        raise ValueError("TEMP variable not found")

def getDimensionData(fileName, dimName):
    """Return size, coordinate values (if any), and example 1D slices for variables using dimName."""
    ds = xr.open_dataset(dirname + dynamicPathBlock + fileName)
    if dimName not in ds.dims:
        raise ValueError(f"Dimension '{dimName}' not found")
    size = ds.dims[dimName]
    coords = ds.coords[dimName].values.tolist() if dimName in ds.coords else None
    if coords is not None:
        coords = replace_nan_inf(coords)

    vars_with_dim = {}
    for vname, var in ds.data_vars.items():
        if dimName in var.dims:
            # select index 0 for all other dims so we return a 1D array along dimName
            sel = {d: 0 for d in var.dims if d != dimName}
            data_slice = var.isel(**sel).values.tolist()
            vars_with_dim[vname] = replace_nan_inf(data_slice)

    return {"dimension": dimName, "size": size, "coords": coords, "variables": vars_with_dim}

def getValuesAtDimIndex(fileName, dimName, index):
    """Return all variables sliced at a specific dimension index."""
    ds = xr.open_dataset(dirname + dynamicPathBlock + fileName)
    if dimName not in ds.dims:
        raise ValueError(f"Dimension '{dimName}' not found")

    idx = int(index)
    out = {}
    for vname, var in ds.data_vars.items():
        if dimName in var.dims:
            try:
                sel = var.isel({dimName: idx})
                val = sel.values
                if isinstance(val, np.ndarray):
                    out[vname] = replace_nan_inf(val.tolist())
                elif isinstance(val, (np.floating, float, np.integer, int)):
                    out[vname] = replace_nan_inf(float(val))
                else:
                    out[vname] = replace_nan_inf(val)
            except Exception as e:
                out[vname] = f"error: {e}"

    coord_val = None
    if dimName in ds.coords:
        try:
            cv = ds.coords[dimName].values[idx]
            coord_val = json_serializer(cv) if not isinstance(cv, (int, float, str)) else cv
        except Exception:
            coord_val = None

    return {"dimension": dimName, "index": idx, "coord": coord_val, "values": out}

def SSP(t, p):
    return gsw.ice.sound_speed_ice(t, p)

def bulkSSP(t, p):
    for i in range(len(t)):
        t[i] = gsw.ice.sound_speed_ice(t[i], p[i])
    return t

def bulkSSPFile(payloadPath):
    with open(payloadPath, 'r') as f:
        payload = json.load(f)
    temps = payload.get('temps', [])
    presses = payload.get('presses', [])
    out = []
    for i in range(min(len(temps), len(presses))):
        try:
            t = float(temps[i]) if temps[i] not in (None, '-', '') else float('nan')
            p = float(presses[i]) if presses[i] not in (None, '-', '') else float('nan')
            if np.isnan(t) or np.isnan(p) or np.isinf(t) or np.isinf(p):
                out.append(None)
            else:
                out.append(float(gsw.ice.sound_speed_ice(t, p)))
        except Exception:
            out.append(None)
    return out

def getVarsGroupedByDepth(fileName, include_qc=True):
    ds = xr.open_dataset(dirname + dynamicPathBlock + fileName)

    vars2d = [v for v, da in ds.data_vars.items()
              if 'DEPTH' in da.dims and (include_qc or not v.endswith('_QC'))]

    depth_size = int(ds.sizes['DEPTH'])
    time_vals = ds['TIME'].values.tolist() if 'TIME' in ds.coords else list(range(int(ds.sizes.get('TIME', 0))))

    rows = []
    for d in range(depth_size):
        row = {'depthIndex': d}
        try:
            row['depthCoord'] = json_serializer(ds.coords['DEPTH'].values[d]) if 'DEPTH' in ds.coords else None
        except Exception:
            row['depthCoord'] = None
        for vname in vars2d:
            vals = ds[vname].isel(DEPTH=d).values.tolist()  # usually length == TIME
            row[vname] = replace_nan_inf(vals)
        rows.append(row)

    return {'variables': vars2d, 'time': replace_nan_inf(time_vals), 'rows': rows}

def getVarsGroupedByTime(fileName, include_qc=True):
    ds = xr.open_dataset(dirname + dynamicPathBlock + fileName)

    vars_time = [v for v, da in ds.data_vars.items()
                 if 'TIME' in da.dims and (include_qc or not v.endswith('_QC'))]

    time_size = int(ds.sizes.get('TIME', 0))
    depth_vals = ds['DEPTH'].values.tolist() if 'DEPTH' in ds.coords else list(range(int(ds.sizes.get('DEPTH', 0))))

    rows = []
    for t in range(time_size):
        row = {'timeIndex': t}
        try:
            row['timeCoord'] = json_serializer(ds['TIME'].values[t]) if 'TIME' in ds.coords else None
        except Exception:
            row['timeCoord'] = None
        for vname in vars_time:
            vals = ds[vname].isel(TIME=t).values.tolist()  # 1D for (TIME), 2D->1D over DEPTH for (TIME,DEPTH)
            row[vname] = replace_nan_inf(vals)
        rows.append(row)

    return {'variables': vars_time, 'depth': replace_nan_inf(depth_vals), 'rows': rows}

functions = {
    "my_function": my_function,
    "other_function": other_function,
    "getDataFile": getDataFile,
    "getVariables": getVariables,
    "getDimensions": getDimensions,
    "getVariable": getVariable,
    "getDepthValues": getDepthValues,
    "getTempAtDepth": getTempAtDepth,
    "getDimensionData": getDimensionData,
    "SSP": SSP,
    "bulkSSP": bulkSSP,
    "bulkSSPFile": bulkSSPFile,
    "getValuesAtDimIndex": getValuesAtDimIndex,
    "getVarsGroupedByDepth": getVarsGroupedByDepth,
}

functions.update({
    "getVarsGroupedByTime": getVarsGroupedByTime,
})

#"""
if __name__ == "__main__":
    func_name = sys.argv[1]
    args = sys.argv[2:]

    result = functions[func_name](*args)
    print(json.dumps(result, default=json_serializer))
#"""

"""
ds = xr.open_dataset(dirname+"../../../../savedData/GL_PR_PF_1902604.nc")
#print(ds)

#DIMS
print(list(ds.dims)) # Array
print(ds.sizes) #JSON
print("\n")

#VARS
print(list(ds.data_vars)) # Array
print(ds.data_vars.values.tolist()[1]) # JSON
print("\n")

print(list(ds.data_vars['TEMP'])) # JSON


#print(ds['TEMP'].values.tolist()[1]) # Array


#import gsw
#depth = -gsw.z_from_p(5.9, ds['LATITUDE'][0])
"""



def makeAveragedArrayOfTEMPValues(allTimeInstances_TEMPArrays):
    firstTimeTEMPArray = allTimeInstances_TEMPValues[0]
    secondTimeTEMPArray = allTimeInstances_TEMPValues[1]
    thirdTimeTEMPArray = allTimeInstances_TEMPValues[2]
