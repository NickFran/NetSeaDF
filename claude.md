The following file is included in this project for the purpose of providing context to everything about the project.

The following context will be provided,
* What This project is and its purpose
* The Features and functionality the app allows users to perform
* The technology / tech stack this application relies on
* additional tech notes
* Simple overview of the code base (file structure)
* Advanced overview of the code base (file structure of the source code (src) folder)
* Technical source code overview (purpose of each source code file within src/common)




### Project and its purpose
This project is a cross-platform electron-based desktop application called NetSeaDF. As you can tell due to the slight play-on-words, this project is designed around NetCDF files. 

The purpose of this application is to provide an application for scientists to visualize NetCDF data on a map as well as plot their data on custom graphs.

The following expectation can be constructed, "Visualizing locations of NetCDF files on a map, filtering our available files and plotting graphs of the data that include Depth, Temp, Psal and SSP". If this application can allow scientists to do this, then this application has served its purpose.

Through the use of this application, there is a hope that users of this app will be able to acheive better data visualization and data discovery by interfacing with what this application offers.


### Features and Functionality
The following is a list of the (current) features that have been implemented within the application,
* Importing NetCDF Files.
* Viewing a "Virtual File System" of all currently imported files.
* Clicking on a imported file and viewing its Vars, Dims, Coords as well as Attrs.
* Viewing markers on a map once a file is imported.
* Clicking on a map marker (which resembles a dataset) to view that datasets information (especially coords).
* Viewing the timeline of a current map marker to view all timestamps and their coord locations.
* Being informed of the possibility of UnderIce loss of transmission through the feature of adding a map marker, informing the user of such a possibility if a marker includes a suspicious amount of time between timestamps.
* Filtering map markers by timestamp via the use of a timeline range.
* The ability to instead filter by a different type of timeline range using manual datetime-locl inputs.
* The ability to convert time displays to 12 or 24 hour variants.
* Focusing on a map markers location by pressing the Focus button
* Multi-selecting more than one file and cylcing through the current set of selected files, in-turn, allowing you to view the data and focus on a desiered file that happens to be selected.


### Technology / Tech Stack
The following is a list of the languages used in the project and what they are used for.
* Languages
  * Python (most used on the backend for working with the NetCDF Data)
  * JavaScript (Makes up the majority of the code including the backend with file handling and also is fully responsible for the frontend.)
  * C/C++ (only present due to the Python virtual enviroments)

* Libraries
  * Python
    * GSW (handles the sound speed and other scientific equations)
    * xarray (main library for handling NetCDF files)
    * numpy (dependency for xarray)
    * sys, json, os, math, datetime (basic stuff / generic functionality)

  * JavaScript
    * apacheEcharts (responsible for all of the apps charts and graphs)
    * Electron (responsible for providing the enviroment within which the app exists)
    * Leaflet.js (the main mapping library handling all maps and markers)
    * path, fs (node modules for basic file handling)


### Additional tech notes
* Electron is being used with node integration turned on. Despite the security concerns, this decision was made due to the fact that this application is meant for offline local use and does not need to conern itself with malicious network requests that would demand node be turned off. Plus its much easier to make local resource requests directly so node integration is turned on.

* THere are 3 Python virtual enviroments within the file system, they are as follows,
    * PythonProtable (Windows enviroment)
    * PythonPortableMac_arm64 (Mac (apple) enviroment)
    * PythonPortableMac_x86 (Mac (intel) enviroment)

The reason these 3 enviroments exist and are not ignored by the ignore file is so that the github actions script can bundle each executable with a compatible version of python and each libarary.

* THe entire project has one main python file (pythonProcess.py). This file is holding all of the functions to perform actions on NetCDF files for the whole application. If you see a python file within the projects file system, it has another use that direct integration with the JS backend and frontend.

* Within the projects file system, there is a logs, config and savedData folder. These loose folder at the root level are the main folders for their use case, but only in development. In production, these 3 folders are still used, but the production builds reference the dist folder instead.
Therefore, 
in dev, getting data would involde .savedData/
in prod, getting data would involve .dist/savedData/ 

* This applications features are made possible due to Python and JS working together. JS provides the application while python provides the data retreival abilities for NetCDF files, facilitaed through xarray.
The way this application parses NetCDF files is by allowing JS files to call the callPyFunc() function from integrations, allowing the ability to pass the python function name as a string argument to integrations.js which then interfaces with teh python process, inturn, making python call the function, returning its data to integrations, inturn, allowing the original JS file to receive the python return through the integrations return.


### Simple overview of the codebase
The following is a simplified list of the projects file structure and all its main folders.
* (root)
    * .github (holds the build.yml)
        * associated with github commits

    * build (holds the afterPack.js)
        * afterPack hook for electron-builder
        * Sets executable permissions on Python binaries for macOS builds

    * config (holds config files)

    * dist (holds the directories for distribution)
        * This gets bundled with the app and is a folder exposed in the file system due to it holding the cofig and logs.
        In other words, in a production build, all storage, config and logs go here
        * This folder hods the config, logs and savedData folders.

    * logs (holds the development build version of dist/logs)

    * node_modules (holds JS dependencies)

    * output (output folder from manual electon builds)

    * PythonProtable (Windows enviroment)

    * PythonPortableMac_arm64 (Mac (apple) enviroment)

    * PythonPortableMac_x86 (Mac (intel) enviroment)

    * qeues (holds the code files for the qeue functionality, both import and removal)

    * savedData (holds the development build of dist/savedData)
        * this folder acts as the storage of the app, all imported files, including json data of file information is sotred in savedData (both dev and prod builds)

    * src (main directory of all source code)

    * tooling (directory holding various code files which act as tools for debugging / testing)


### Advanced overview of the codebase
The follwing gives context to each subfolder of the src folder
* src
    * common (all primary source code files that run the application)
    * debug (files for debugging / testing)
    * lib (external third-party libraries)
    * media (holds all media like pictures and gifs)
    * style (holds every main css file for the frontend of the app)
    * unitTests (holds all previous unit tests of the app)
    * map.html (The entire application, main.js calls this upon "npm start")


### Technical source code overview
The following gives context to each primary source code file that runs the application.
These files exist in src/common.
It is very, very important to understand the context of the applications code, and the overwhelming majority of the code that manages the frontend and backend is within the src/common folder.

*   basicFunctions.js (provides basic math and array functionality that any application might need)
*   charts.js (holds all code for charts, you can think of this as the "echarts file")
*   DOM.js (holds the majority of the code for manipluating the DOM)
*   fileHandle.js (holds functions for fundumental file handling operations)
*   integrations.js (the file responsible to allowing JavaScript to communicate with python via childProcess)
*   logging.js (provides functions for logging data to log files)
*   objects.js (provides fundumental objects the app relies upon and bases its data around)
*   pathDep.js (provides fundumental functionality for path traversal in the file system)
*   preload.js (a file to confirm that preloading works upon starting the app)
*   pythonProcess.py (the python file responsible to retreiving NetCDF data and sending it back to integrations.js)
*   qeue.js (provides functions for import and remove qeues)
*   templates.js (provides objects for the DOM, (this might soon be marged into objects.js))
*   unitTest.js (provides a small framework for performing unitTests)
*   userInterations.js (provides functions for when users interact with DOM elements)