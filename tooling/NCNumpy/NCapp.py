import xarray as xr
import numpy as np
import os
import ncnumpy as ncnp
import json
import gsw

RUN: bool = True
MODE: str = 'single'
__dirname__: str = os.path.abspath(os.path.dirname(__file__))
choosenPath: str = os.path.abspath(os.path.join(__dirname__, '..', '..', 'savedData'))
choosenPath: str = os.path.abspath(os.path.join(__dirname__, '..','..','..','..','..','..', 'Arctic_MidDecember'))

global ds 
ds = None
global targetFiles
targetFiles = []

def getResponse_strToIndex(questionMessage: str, allowedResponses: list = None):
	"""
	Ask the user for input, with the intention of converting their input into an index
	"""
	while True: #Loop until error or return
		userInput = input(questionMessage)

		try:# Try to convert to input to int
			val = int(userInput)
			if val in allowedResponses:
				return val
			else:
				print("Invalid Input!, needs to be " + str(allowedResponses))
		except ValueError:
			print("Incorrect Input!")

def getMultiResponse_strToIndex(questionMessage: str, allowedResponses: list = None):
		"""
		Ask the user for multiple inputs, with the intention of converting each input into an index
		"""
		allSelectedIndexes: list = [] # Init for holding all selected indexes
		allowedResponses.append(-1) # add -1 (close) as an option that is accepted

		while True: #Loop until error or return
			print("(Type -1 to stop multi selecting)")
			userInput = input(questionMessage) # Ask question

			try: # Try to convert to input to int
				val = int(userInput)
				if val in allowedResponses:
					if val == -1:
						return allSelectedIndexes
					else:
						allSelectedIndexes.append(val)
						pass
				else:
					print("Invalid Input!, needs to be " + str(allowedResponses))
			except ValueError:
				print("Incorrect Input!")

def exitProgram():
	print("Exiting...")
	global RUN
	RUN = False

def list_files_in_dir(path='.'):
	"""Return a list (array) of all files in `path` (non-recursive).

	Directories are excluded; only regular files are returned.
	"""
	try:
		entries = os.listdir(path)
	except Exception:
		return []

	files = [e for e in entries if os.path.isfile(os.path.join(path, e))]
	return files

def chooseOperation():
	choiceIndex = getResponse_strToIndex("Choose an Index: ", range(0, len( list(operations.keys()) ) ))
	chosenOperation = operations.get(choiceIndex)
	print("["+chosenOperation["Description"]+"]")
	runOperation(chosenOperation)

def listOperations():
	visualList = []
	for i in range(0, len(operations)):
		visualList.append(str(i) + "| ")
		visualList.append(operations[i]["Name"]+"\n\t"+operations[i]["Description"])
		visualList.append("\n\n")
	msg = ''.join(visualList)
	print(("\n"*4)+"Operations\n---------------")
	print(msg)

def displayDataFiles():
	visualList = []
	for i in range(0, len(allFiles)):
		visualList.append(str(i) + "| ")
		visualList.append(allFiles[i])
		visualList.append("\n")
	msg = ''.join(visualList)
	print("["+__dirname__+"]"+" Files To View\n---------------")
	print(msg)
	
def chooseMode():
	print("Select Mode\n" 
	"0| Sinlge File Mode\n" 
	"1| Multiple File Mode\n\n")

	modeChoice: int = getResponse_strToIndex("Choose a Mode: ", [0,1])
	global MODE
	if modeChoice == 0:
		MODE = 'single'
	elif modeChoice == 1:
		MODE = 'multi'
	else:
		print("ERROR, THIS SHOULD NOT BE POSSIBLE TO RUN")

	selectFile()

def selectFile():
	global ds
	global targetFiles
	displayDataFiles()

	if MODE == 'single':
		userInput = getResponse_strToIndex("Choose an Index: ", list(range(0, len(allFiles))))
		targetFiles = [allFiles[userInput]]
		ds = xr.open_dataset(os.path.join(choosenPath, targetFiles[0]))
		print("\n" * 2)
		print(targetFiles)
		
	if MODE == 'multi':
		targetFiles = []
		userInput = getMultiResponse_strToIndex("Choose one Index at a time: ", list(range(0, len(allFiles))))
		for index in userInput:
			targetFiles.append(allFiles[index])
		print("\n" * 2)
		print(targetFiles)

def runOperation(Operation):
	global MODE
	operationImplementsPossibleMultiMode = Operation.get("SupportsMulti") is not None

	if MODE == 'single':
		if Operation["Params"] == 0:
			Operation["Function"]()
			
		elif Operation["Params"] == 1:
			print(Operation["Function"](ds))
			
		else:
			print("Functions that have more than 1 param not supported yet")
	elif MODE == 'multi':
		if operationImplementsPossibleMultiMode:
			if Operation["SupportsMulti"] == True:

				if Operation["Params"] == 0:
					Operation["Function"]()
					
				elif Operation["Params"] == 1:
					print(Operation["Function"](ds))
					
				else:
					print("Functions that have more than 1 param not supported yet")
			elif Operation["SupportsMulti"] == False:
				print("Sorry, this operation doesnt support Mutli-Mode")
			else:
				print("THIS SHOULD NOT BE POSSIBLE TO RUN!")
		else:
			print("Sorry, this operation doesnt support Mutli-Mode")

		
		
	else:
		print("THIS SHOULD NOT BE POSSIBLE TO RUN!")

def plotGraph():
	global MODE
	global ds

	if MODE == "single":
		specificChoiceX = input("(X) Type Variable Name: ")
		specificChoiceY = input("(Y) Type Variable Name: ")
		combinedTitle = f'graph: {specificChoiceX} & {specificChoiceY}'

		XArrayData = ncnp.getAllVarValues(ds, manualInput=True, manualVarName=specificChoiceX)
		YArrayData = ncnp.getAllVarValues(ds, manualInput=True, manualVarName=specificChoiceY)
		ncnp.XYPlot(XArrayData, YArrayData, invert_yaxis=True, title=combinedTitle, XYLabel=[specificChoiceX, specificChoiceY])

	elif MODE == "multi":
		specificChoiceX = input("(X) Type Variable Name: ")
		specificChoiceY = input("(Y) Type Variable Name: ")
		combinedTitle = f'graph: {specificChoiceX} & {specificChoiceY}'

		dsArr = []
		XYPairArr = []

		for fileName in targetFiles:
			dsArr.append(xr.open_dataset(os.path.join(choosenPath, fileName), engine='netcdf4'))
			if len(dsArr) > 10:
				print("Multi-Plot has a current max of 10 datasets, you have hit the limit")
				break
        
		for ds in dsArr:
			XYPairArr.append(
                [
                    ncnp.getAllVarValues(ds, True, specificChoiceX),
                    ncnp.getAllVarValues(ds, True, specificChoiceY)
                ]
            )

		ncnp.XYPlot_Multi(XYPairArr, xlabel=specificChoiceX, ylabel=specificChoiceY, title=combinedTitle, invert_yaxis=True)

	else:
		print("THIS SHOULD NOT BE POSSIBLE TO RUN!")

def SSPPlot():
	global MODE
	if MODE == "multi":
		SSPPlot_Multi()
	else: 
		#this will also require coords
		combinedTitle = f'graph: {"SSP"} & {"Z"}'

		#Get values
		TEMP_ArrayData = ncnp.getAllVarValues(ds, manualInput=True, manualVarName="TEMP")
		PSAL_ArrayData = ncnp.getAllVarValues(ds, manualInput=True, manualVarName="PSAL")
		PRES_ArrayData = ncnp.getAllVarValues(ds, manualInput=True, manualVarName="PRES")
		SA_ArrayData = []
		SSPArrayData = []
		CT_ArrayData = []
		Z_ArrayData = []

		Coords_ArrayData = ncnp.getCoords(ds)
		coordPairs = [Coords_ArrayData[0][0], Coords_ArrayData[1][0]]

		YArrayData = ncnp.getAllVarValues(ds, manualInput=True, manualVarName="PRES")

		for i in range(0, len(YArrayData)):
			SA_ArrayData.append(
				gsw.SA_from_SP(
					PSAL_ArrayData[i],
					PRES_ArrayData[i],
					coordPairs[0],
					coordPairs[1]
					))
			CT_ArrayData.append(
				gsw.CT_from_t(
					SA_ArrayData[i],
					TEMP_ArrayData[i],
					PRES_ArrayData[i]
					))
			SSPArrayData.append(
				gsw.sound_speed(
					SA_ArrayData[i],
					CT_ArrayData[i],
					PRES_ArrayData[i]
					))
			Z_ArrayData.append(
				gsw.z_from_p(
					PRES_ArrayData[i],
					coordPairs[0]
					))

		ncnp.XYPlot(SSPArrayData, Z_ArrayData, invert_yaxis=False, title=combinedTitle, XYLabel=["SSP", "Z"])

def SSPPlot_Multi():
	print("WIP")

operations = {
	0:{"Name": "Exit", 
        "Description": "Closes the program.",
        "Function": exitProgram,
        "Params":0,
		"SupportsMulti":True},
	 
	1: {"Name": "Attributes",
	    "Description": "Show all attributes of the dataset.",
	    "Function": ncnp.getNCAttributes,
	    "Params":1},

	2: {"Name": "Variables",
	    "Description": "Show all data variables in the dataset",
	    "Function": ncnp.getNCVariables,
	    "Params":1},

	3: {"Name": "Dimensions",
	    "Description": "Show all dimensions of the dataset.",
	    "Function": ncnp.getNCDimensions,
	    "Params":1},
		
    4: {"Name": "Get Values Of Variable",
        "Description": "Get all the values stored in a specific variable",
        "Function": ncnp.getAllVarValues,
        "Params":1},

	5: {"Name": "Change Mode",
		"Description": "Change the mode of the app",
		"Function": chooseMode,
		"Params":0,
		"SupportsMulti":True},

	6: {"Name": "Select File",
		"Description": "Select a file to perform an operation on",
		"Function": selectFile,
		"Params":0},

	7: {"Name": "Plot",
		"Description": "Plot data on a graph",
		"Function": plotGraph,
		"Params":0,
		"SupportsMulti":True},

	8: {"Name": "SSP Plot",
		"Description": "Plot SSP data on a graph",
		"Function": SSPPlot,
		"Params":0,
		"SupportsMulti":True}
}

def runTest():
	pass

runTest()

allFiles = list_files_in_dir(choosenPath)

chooseMode()
#selectFile() file selection is now required by default when changing modes
while RUN == True:
	listOperations()
	chooseOperation()