import numpy
import xarray as xr

path = "C:/Arctic_MidDecember"

# Writing a string to a file (overwrites if exists)
nc = xr.open_dataset(path)
print(nc)

#
