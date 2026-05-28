// DOM manipulation functions
const { time } = require('console');
const { dependencies, util } = require('echarts');
const { app } = require('electron');
const path = require('path');
const { config } = require('process');



document.addEventListener('DOMContentLoaded', () => {
    const tabVars = document.getElementById("dataTab-Vars");
    const tabDimsCoords = document.getElementById("dataTab-DimsCoords");
    const tabAttrs = document.getElementById("dataTab-Attrs");
    if (tabVars && tabDimsCoords && tabAttrs) {
        const parent = tabVars.parentElement;

        tabDimsCoords.addEventListener("click", (event) => {
            parent.querySelectorAll('.dataTab').forEach(tab => tab.classList.remove('tabActive'));
            tabDimsCoords.classList.add('tabActive');
            document.getElementById('datasetVarsCardWrapper').style.display = 'none';
            document.getElementById('datasetAttrCardWrapper').style.display = 'none';
            document.getElementById('datasetInfoCardWrapper').style.display = 'block';
            console.log('dataTab-DimsCoords clicked');
        });
        tabAttrs.addEventListener("click", (event) => {
            parent.querySelectorAll('.dataTab').forEach(tab => tab.classList.remove('tabActive'));
            tabAttrs.classList.add('tabActive');
            document.getElementById('datasetVarsCardWrapper').style.display = 'none';
            document.getElementById('datasetAttrCardWrapper').style.display = 'block';
            document.getElementById('datasetInfoCardWrapper').style.display = 'none';
            console.log('dataTab-Attrs clicked');
        });
        tabVars.addEventListener("click", (event) => {
            parent.querySelectorAll('.dataTab').forEach(tab => tab.classList.remove('tabActive'));
            tabVars.classList.add('tabActive');
            document.getElementById('datasetVarsCardWrapper').style.display = 'block';
            document.getElementById('datasetAttrCardWrapper').style.display = 'none';
            document.getElementById('datasetInfoCardWrapper').style.display = 'none';
            console.log('dataTab-Vars clicked');
        });
    }
});

/**
 * Displays detailed information about a dataset in the info cards section of the UI.
 * @param {*} state - App state object 
 * @param {*} deps - Module dependencies
 * @param {*} fileName - The name of the file whose dataset info should be displayed in the info cards.
 * @returns 
 */
function displayDatasetInfo(state, deps, fileName) {
    const { pathDep, fileHandle } = deps;

    document.getElementById('titleTargetFile').textContent = `${fileName}`;
    
    try {
        const fileContent = fs.readFileSync(pathDep.jsonPath, 'utf-8');
        if (fileHandle.isSimpleDataEmpty()) {
            console.error("simpleData.json is empty");
            return;
        }

        const dataset = fileHandle.getEntryInSimpleData(fileName);
        
        // Clear existing content
        const cardWrapper = document.getElementById('datasetInfoCardWrapper');
        const AttrCardWrapper = document.getElementById('datasetAttrCardWrapper');
        const VarCardWrapper = document.getElementById('datasetVarsCardWrapper');
        DOM.dom_clearElementInnerHTML_UsingObject(cardWrapper);
        DOM.dom_clearElementInnerHTML_UsingObject(AttrCardWrapper);
        DOM.dom_clearElementInnerHTML_UsingObject(VarCardWrapper);
        
        // Create separate lists for each card wrapper
        const ulInfo = document.createElement('ul');
        const ulAttr = document.createElement('ul');
        const ulVars = document.createElement('ul');
        
        // Helper function to format coordinate values (DMS or decimal)
        function toDMS(val, isLat) {
            if (val === 'N/A' || val === undefined || val === null || isNaN(val)) return val;
            const abs = Math.abs(val);
            const deg = Math.floor(abs);
            const minFloat = (abs - deg) * 60;
            const min = Math.floor(minFloat);
            const sec = ((minFloat - min) * 60).toFixed(2);
            const dir = isLat
                ? (val >= 0 ? 'N' : 'S')
                : (val >= 0 ? 'E' : 'W');
            return `${deg}°${min}'${sec}" ${dir}`;
        }
        function formatCoord(value, isLat) {
            // Check for DMS setting
            let useDMS = false;
            try {
                useDMS = deps && deps.config && typeof deps.config.get === 'function' && deps.config.get('basics', 'useDMSFormatForTimestamps');
            } catch (e) { useDMS = false; }
            if (useDMS) {
                return toDMS(Number(value), isLat);
            }
            if (value === 'N/A') return value;
            let maxDecimals = 4;
            try {
                if (deps && deps.config && typeof deps.config.get === 'function') {
                    const setting = deps.config.get('basics', 'MaxCoordDecimals');
                    if (typeof setting === 'number' && setting >= 1 && setting <= 10) {
                        maxDecimals = setting;
                    }
                }
            } catch (e) { maxDecimals = 4; }
            return Number(value).toFixed(maxDecimals);
        }

        // Helper to check if DisplayCoordsOnOneLine is enabled
        function isDisplayCoordsOnOneLine() {
            try {
                return deps && deps.config && typeof deps.config.get === 'function' && deps.config.get('basics', 'DisplayCoordsOnOneLine');
            } catch (e) { return false; }
        }
        
        // Helper function to create nested list items
        function addToList(parent, key, value, timestamps = null) {
            const li = document.createElement('li');
            // Change 'dims' to 'Dimensions' for display
            let displayKey = key === 'dims' ? 'Dimensions' : key;
            li.textContent = displayKey;
            li.style.wordWrap = 'break-word';
            const safeTimestamps = Array.isArray(timestamps) ? timestamps : [];
            
            // If the value is an array, create a nested list for its items
            if (Array.isArray(value)) {
                // Create nested list for array items (even if empty)
                const subUl = document.createElement('ul');
                if (value.length > 0) {
                    // Special handling for coords
                    if (key === 'coords' && value.length > 0) {
                        const displayOneLine = isDisplayCoordsOnOneLine();
                        const first = value[0];
                        if (first && typeof first === 'object' && ('lat' in first || 'lon' in first)) {
                            value.forEach((coord, index) => {
                                const indexLi = document.createElement('li');
                                const label = safeTimestamps[index] !== undefined ? safeTimestamps[index] : 'N/A';
                                indexLi.textContent = `[${index}]: ${label}`;

                                const lat = coord?.lat !== undefined ? coord.lat : 'N/A';
                                const lon = coord?.lon !== undefined ? coord.lon : 'N/A';
                                if (displayOneLine) {
                                    const coordLi = document.createElement('li');
                                    coordLi.textContent = `${formatCoord(lat, true)}, ${formatCoord(lon, false)}`;
                                    const coordUl = document.createElement('ul');
                                    coordUl.appendChild(coordLi);
                                    indexLi.appendChild(coordUl);
                                } else {
                                    const coordUl = document.createElement('ul');
                                    const coordLi_Lat = document.createElement('li');
                                    const coordLi_Lon = document.createElement('li');
                                    coordLi_Lat.textContent = `Lat: ${formatCoord(lat, true)}`;
                                    coordLi_Lon.textContent = `Lon: ${formatCoord(lon, false)}`;
                                    coordUl.appendChild(coordLi_Lat);
                                    coordUl.appendChild(coordLi_Lon);
                                    indexLi.appendChild(coordUl);
                                }
                                subUl.appendChild(indexLi);
                            });
                        } else {
                            const midpoint = Math.ceil(value.length / 2);
                            const lats = value.slice(0, midpoint);
                            const lons = value.slice(midpoint);
                            // Handle case where lats and lons have different lengths
                            const maxLen = Math.max(lats.length, lons.length);
                            for (let i = 0; i < maxLen; i++) {
                                const indexLi = document.createElement('li');
                                indexLi.textContent = `[${i}]`;
                                const lat = lats[i] !== undefined ? lats[i] : 'N/A';
                                const lon = lons[i] !== undefined ? lons[i] : 'N/A';
                                const coordUl = document.createElement('ul');
                                const coordLi = document.createElement('li');
                                if (displayOneLine) {
                                    coordLi.textContent = `${formatCoord(lat, true)}, ${formatCoord(lon, false)}`;
                                } else {
                                    coordLi.textContent = `Lat: ${formatCoord(lat, true)}, Lon: ${formatCoord(lon, false)}`;
                                }
                                coordUl.appendChild(coordLi);
                                indexLi.appendChild(coordUl);
                                subUl.appendChild(indexLi);
                            }
                        }
                    } else {
                        value.forEach((item, index) => {
                            const subLi = document.createElement('li');
                            subLi.textContent = `${item}`;
                            subUl.appendChild(subLi);
                        });
                    }
                } else {
                    const subLi = document.createElement('li');
                    subLi.textContent = '(empty)';
                    subUl.appendChild(subLi);
                }
                li.appendChild(subUl);
            } else if (typeof value === 'object' && value !== null) {
                // Create nested list for objects
                const subUl = document.createElement('ul');
                Object.entries(value).forEach(([objKey, objValue]) => {
                    const subLi = document.createElement('li');
                    subLi.textContent = `${objKey}: ${objValue}`;
                    subUl.appendChild(subLi);
                });
                li.appendChild(subUl);
                
            // If its not an array or object, just display the value
            } else {
                // Create nested list for simple values
                const subUl = document.createElement('ul');
                const subLi = document.createElement('li');
                subLi.textContent = value;
                subUl.appendChild(subLi);
                li.appendChild(subUl);
            }
            
            parent.appendChild(li);
        }
        
        // Populate with dataset info, routing to appropriate wrapper
        Object.entries(dataset).forEach(([key, value]) => {
            const formattedTimestamps = dataset?.timestamps?.formatted ?? [];
            if (key === 'dims' || key === 'coords') {
                // Pass 'Dimensions' as key for dims, otherwise use key
                addToList(ulInfo, key === 'dims' ? 'Dimensions' : key, value, formattedTimestamps);
            } else if (key === 'attributes') {
                addToList(ulAttr, key, value);
            } else if (key === 'vars') {
                addToList(ulVars, key, value);
            }
            // Skip other keys (id, fileName, summary)
        });
        
        cardWrapper.appendChild(ulInfo);
        AttrCardWrapper.appendChild(ulAttr);
        VarCardWrapper.appendChild(ulVars);
        console.log("Dataset info displayed:", dataset);
    } catch (error) {
        console.error("Error displaying dataset info:", error);
    }
}

/**
 * Loads the list of glider files in the sidebar.
 * @param {Object} state - App State Object
 * @param {Object} deps - Module Dependencies
 * @param {Function} onFileSelect - Callback when a file is selected (receives fileName)
 */
function loadSideBar_Glider(state, deps, onFileSelect) {
    const { pathDep, fileHandle, integrations } = deps;
    state.currentFileIndexTarget = 0;
    
    // get the folder that the data is in
    const savedDataPath = pathDep.resolveToProperDataPath(__dirname, 'savedData');
    
    // get the gliderList element
    const Element_gliderList = document.getElementById('GliderList');
    
    // get all files
    state.allFiles = fileHandle.listSavedDataFiles(savedDataPath, '.nc');
    
    // default to nothing
    Element_gliderList.innerHTML = '';
    
    // for each file, add it to the list
    state.allFiles.forEach(file => {
        let newElm = dom_createElm_GliderListItem(state, deps, file, onFileSelect);
        Element_gliderList.appendChild(newElm);
    });
}

function applySidebarEntryFontSizeToElement(element, deps) {
    if (!element || !deps?.config) {
        return;
    }

    const configuredFontSize = Number(deps.config.get('basics', 'sidebarListFontSize'));
    if (!Number.isNaN(configuredFontSize) && configuredFontSize > 0) {
        element.style.fontSize = `${configuredFontSize}px`;
    }
}

function applySidebarEntryFontSize(deps) {
    if (!deps?.config) {
        return;
    }

    document.querySelectorAll('.GliderList li, .ViewsList li').forEach((item) => {
        applySidebarEntryFontSizeToElement(item, deps);
    });
}

/**
 * Loads the list of saved view files in the sidebar.
 * @param {Object} state - App State Object
 * @param {Object} deps - Module Dependencies
 * @param {Function} onViewSelect - Optional callback when a view is selected
 */
function loadSideBar_Views(state, deps, onViewSelect = null) {
    const { fileHandle } = deps;
    const element_viewsList = document.getElementById('ViewsList');

    if (!element_viewsList) {
        console.warn('ViewsList element not found');
        return;
    }

    // Clear the list before repopulating
    element_viewsList.innerHTML = '';

    const savedViews = fileHandle.listSavedViewFiles();
    savedViews.forEach((fileName) => {
        let newElm = dom_createElm_ViewListItem(state, deps, fileName, onViewSelect);
        element_viewsList.appendChild(newElm);
    });
}

/**
 * Creates a list item element for a glider file, with click handling for selection and opening.
 * @param {*} state App State Object  
 * @param {*} deps Module Dependencies
 * @param {*} file File name (title of the list item)
 * @param {*} onFileSelect Callback function that gets called when the file is selected (receives file name as argument)
 * @returns li element to be appended and displayed in the sidebar list
 */
function dom_createElm_GliderListItem(state, deps, file, onFileSelect) {
    const { pathDep, fileHandle, integrations, basicFunctions} = deps;

    const li = document.createElement('li'); // create a new element
        li.textContent = file; // set its name to the file name
        applySidebarEntryFontSizeToElement(li, deps);
        li.addEventListener('click', (event) => {  // Use event parameter instead of global
            console.log(`Click Tunnel = `, JSON.stringify(fileHandle.getEntryKeyInSimpleData(file, "dims"), null, 2));
            
            if (event.shiftKey){
                console.log("Shift key was held during click - multi-select not implemented yet")
                state.isMultiSelect = true;
                state.selectedFiles.add(file);
                appState.currentFileIndexTarget = Array.from(appState.selectedFiles).indexOf(file);
            } else {
                console.log("Shift key was not held during click - opening file normally")
                state.isMultiSelect = false;
                state.selectedFiles = new Set([file]);
                appState.currentFileIndexTarget = 0;
            }

            // console.log("Selected files:", Array.from(state.selectedFiles));
            // if (state.isMultiSelect){
            //     console.log("Multi-select mode is on");
            //     // SHOW POPUP FOR MULTI-VIEWING
            // }else{
            //     // SHOW NORMALLY
            // }

            // Reset all li backgrounds first
            document.querySelectorAll('.GliderList li').forEach(item => {
                item.style.backgroundColor = '';
            });

            // Highlight the platform-specific delete button
            const deletePlatformsButton = document.getElementById('deletePlatformsSummaryButton');
            if (deletePlatformsButton) {
                deletePlatformsButton.style.backgroundColor = '#de5d5d';
            }
            
            // Set clicked li background
            li.style.backgroundColor = '#4a90e2';

            const gliderList = document.getElementById('GliderList');
            if (!gliderList) {
                console.error('GliderList element not found');
                return false;
            }

            // Find all list items in the GliderList
            const listItems = gliderList.querySelectorAll('li');

            // Find the item with matching textContent and remove it
            for (const item of listItems) {
                if (state.selectedFiles.has(item.textContent)) {
                    item.style.backgroundColor = '#4a90e2';
                }
            }
            
            // const thisFilePath = path.join(savedDataPath, file);
            // console.log("Activating file:", thisFilePath);
            
            // Trigger the callback with the selected file
            if (onFileSelect) {
                onFileSelect(state, deps, file);
            }

            
        })

        if (!fileHandle.doesEntryExistInSimpleData(file, false)) {
            li.style.color = '#de5d5d';
        }

        // append it as a child to the element
        return li;
        
}

/**
 * Creates a list item element for a saved view file.
 * @param {*} state App State Object
 * @param {*} deps Module Dependencies
 * @param {*} fileName Saved view file name
 * @param {*} onViewSelect Optional callback that receives the file name
 * @returns li element to be appended to the views sidebar list
 */
function dom_createElm_ViewListItem(state, deps, fileName, onViewSelect = null) {
    const { fileHandle } = deps;
    const li = document.createElement('li');
    const displayName = fileName.endsWith(fileHandle.VIEW_FILE_EXTENSION)
        ? fileName.slice(0, -fileHandle.VIEW_FILE_EXTENSION.length)
        : fileName;

    li.textContent = displayName;
    li.dataset.viewFileName = fileName;
    applySidebarEntryFontSizeToElement(li, deps);

    li.addEventListener('click', function() {
        document.querySelectorAll('#ViewsList li').forEach(item => {
            item.style.backgroundColor = '';
        });

        const deleteViewsButton = document.getElementById('deleteViewsSummaryButton');
        if (deleteViewsButton) {
            deleteViewsButton.style.backgroundColor = '#de5d5d';
        }

        state.selectedViewFile = fileName;
        li.style.backgroundColor = '#4a90e2';

        if (onViewSelect) {
            onViewSelect(state, deps, fileName);
        }
    });

    return li;
}

/**
 * Using an element's ID string, clears its innerHTML content.
 * @param {*} elementIdString - The ID of the element whose innerHTML should be cleared.
 */
function dom_clearElementInnerHTML_UsingString(elementIdString) {
    const element = document.getElementById(elementIdString);
    element.innerHTML = '';
}
/**
 * Given an element object, clears its innerHTML content.
 * @param {*} elementObject - The DOM element object whose innerHTML should be cleared.
 */
function dom_clearElementInnerHTML_UsingObject(elementObject) {
    elementObject.innerHTML = '';
}
/**
 * Given an element ID string and content, sets the innerHTML of the specified element to the provided content.
 * @param {*} elementIdString - The ID of the element whose innerHTML should be set.
 * @param {*} content - The HTML content to set as the innerHTML of the specified element.
 */
function dom_SetElementInnerHTML_UsingString(elementIdString, content) {
    const element = document.getElementById(elementIdString);
    element.innerHTML = content;
}
/**
 * Given an element object and content, sets the innerHTML of the specified element to the provided content.
 * @param {*} elementObject - The DOM element object whose innerHTML should be set.
 * @param {*} contnet - The HTML content to set as the innerHTML of the specified element.
 */
function dom_SetElementInnerHTML_UsingObject(elementObject, contnet) {
    elementObject.innerHTML = contnet;
}

/**
 * Functions to show and hide the loading screen overlay. The showLoadingScreen function makes the overlay visible and fully opaque, while the hideLoadingScreen function fades it out and then hides it after the fade-out animation completes.
 * These functions can be called before and after long-running operations (like loading a dataset) to provide visual feedback to the user that something is happening.
 */
function showLoadingScreen() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = 'flex';
    loadingOverlay.style.opacity = '1';
    loadingOverlay.style.pointerEvents = 'auto';
}

/**
 * Updates the loading screen text to show current progress.
 * @param {string} text - The text to display on the loading screen.
 */
function setLoadingText(text) {
    const loadingText = document.getElementById('loadingText');
    if (loadingText) loadingText.textContent = text;
}
/**
 * Functions to show and hide the loading screen overlay. The showLoadingScreen function makes the overlay visible and fully opaque, while the hideLoadingScreen function fades it out and then hides it after the fade-out animation completes.
 * These functions can be called before and after long-running operations (like loading a dataset) to provide visual feedback to the user that something is happening.
 */
function hideLoadingScreen() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.opacity = '0';
    loadingOverlay.style.pointerEvents = 'none';
    setTimeout(function() {
        loadingOverlay.style.display = 'none';
        // Reset loading text back to default
        const loadingText = document.getElementById('loadingText');
        if (loadingText) loadingText.textContent = 'Loading...';
    }, 300); // Wait for fade out animation
}

/**
 * Inserts a marker onto the Leaflet map at the specified latitude and longitude, with optional popup text and marker options. 
 * 
 * If a fileName is provided, it also stores a reference to the marker in the application state for later retrieval or removal.
 * @param {*} state - app state object
 * @param {*} lat - latitude coordinate for marker placement
 * @param {*} lon - longitude coordinate for marker placement
 * @param {*} popupText - optional text to display in a popup when the marker is clicked
 * @param {*} markerOptions - optional Leaflet marker options (e.g. custom icon)
 * @param {*} fileName - optional file name to associate with the marker for state management (e.g. for later removal)
 * @returns Marker object that was created and added to the map, or null if coordinates were invalid
 */
function leaf_insertDataMarker(state, dep, lat, lon, popupText = null, markerOptions = {}, fileName = null, instance=null, customImage=null) {
    const {pathDep} = dep;
    console.log(`
        Lat: ${lat},
        Lon: ${lon},
        PopupText: ${popupText},
        MarkerOptions: ${JSON.stringify(markerOptions)},
        FileName: ${fileName},
        Instance: ${instance},
        CustomImage: ${customImage}
        `);
    
    // Validate coordinates
    if (lat === undefined || lon === undefined || lat === 'N/A' || lon === 'N/A') {
        console.warn('Invalid coordinates provided to insertDataMarker:', { lat, lon });
        return null;
    }

    // Create marker with optional custom options

    // Platform icon style dictionary (numbers 1-4)
    const PlatformIconStyleDict = {
        1: ["GliderIcon.png", 40],
        2: ["ArgoFloatIcon.png", 60],
        3: ["FloatSplashIconRedoScaledDone.png", 60],
        4: ["altFloatIcon.png", 38]
    };

    // Get the current PlatformIconStyle setting (default to 1 if not set)
    let platformIconStyle = 1;
    let platformIconSize = 60;
    try {
        if (dep && dep.config && typeof dep.config.get === 'function') {
            const val = dep.config.get('basics', 'PlatformIconStyle');
            if (typeof val === 'number' && val >= 1 && val <= 4) {
                platformIconStyle = val;
                platformIconSize = PlatformIconStyleDict[platformIconStyle][1] || 60; // Get size from dict or default to 60
            }
        }
    } catch (e) { platformIconStyle = 1; }

    // Use the value from the dictionary (first element of the array for now)
    let platformIconFile = PlatformIconStyleDict[platformIconStyle][0];
    // Fallback if blank
    if (!platformIconFile) platformIconFile = "FloatSplashIconRedoScaledDone.png";

    let gliderIcon = null;
    if (instance) {
        gliderIcon = L.icon({
            iconUrl: path.join(pathDep.fromHereToRoot(__dirname), "src", "media", "bullseye.png"),
            iconSize: [35, 35],
            // iconAnchor: [16, 32],
            // popupAnchor: [0, -32]
        });
    } else {
        gliderIcon = L.icon({
            iconUrl: path.join(pathDep.fromHereToRoot(__dirname), "src", "media", platformIconFile),
            iconSize: [platformIconSize, platformIconSize],
            // iconAnchor: [16, 32],
            // popupAnchor: [0, -32]
        });
    }
    if (customImage) {
        gliderIcon = L.icon({
            iconUrl: path.join(pathDep.fromHereToRoot(__dirname), "src", "media", customImage),
            iconSize: [40, 40]
        });
    }
    
    const marker = L.marker([lat, lon], { ...markerOptions, icon: gliderIcon }).addTo(state.map);

    // Add popup if text is provided
    if (popupText) {
        marker.bindPopup(popupText);
    }

    // Store marker reference by fileName if provided
    if (fileName) {
        leaf_storeStateOfMapMarker(state, fileName, marker, instance);
    }

    return marker;
}

/**
 * Given dataset information such as name, latitude, longitude, and dimensions, builds an HTML string to be used as popup content for a Leaflet marker. The popup content includes the dataset name, coordinates (formatted with truncated decimals), dimensions, and a button to view the data. This function can be called when creating markers for datasets to provide informative popups that users can interact with on the map.
 * @param {*} name - The name of the dataset (e.g. file name) to display in the popup.
 * @param {*} lat - The latitude coordinate of the dataset, to be displayed in the popup (formatted with truncated decimals).
 * @param {*} lon - The longitude coordinate of the dataset, to be displayed in the popup (formatted with truncated decimals).
 * @param {*} dims - The dimensions of the dataset, to be displayed in the popup.
 * @returns popupContent - An HTML string containing the structured content for the Leaflet marker popup, including dataset information and a button for viewing the data.
 */
function leaf_buildPopupContent(entry, instance=null, buttonText=null, manualInput=false, config=null){
        // Helper to format dims object for display, replacing 'TIME' with 'Profiles'
        function formatDims(dims) {
            if (!dims || typeof dims !== 'object') return '';
            return '<ul class="marker-popup-dims-list" style="padding-left:0;list-style:none;margin:0;">' +
                Object.entries(dims)
                    .map(([key, value]) => `<li class="marker-popup-dims-item" style="text-align:center;">${key === 'TIME' ? 'Profiles' : key}: <span class='popup-value'>${value}</span></li>`)
                    .join('') +
                '</ul>';
        }
    let popupContent = '';
    if (manualInput){
        popupContent = manualInput;
    } else {
        // Use the same coordinate formatting as the info card
        // We need to access config for settings, so assume window.ModuleDependencies?.config is available
        if (!config && typeof window !== 'undefined' && window.ModuleDependencies && window.ModuleDependencies.config) {
            config = window.ModuleDependencies.config;
        }
        function toDMS(val, isLat) {
            if (val === 'N/A' || val === undefined || val === null || isNaN(val)) return val;
            const abs = Math.abs(val);
            const deg = Math.floor(abs);
            const minFloat = (abs - deg) * 60;
            const min = Math.floor(minFloat);
            const sec = ((minFloat - min) * 60).toFixed(2);
            const dir = isLat
                ? (val >= 0 ? 'N' : 'S')
                : (val >= 0 ? 'E' : 'W');
            return `${deg}°${min}'${sec}" ${dir}`;
        }
        function formatCoord(value, isLat) {
            let useDMS = false;
            let configVal = null;
            try {
                configVal = config && typeof config.get === 'function' && config.get('basics', 'useDMSFormatForTimestamps');
                useDMS = configVal;
            } catch (e) { useDMS = false; }
            if (useDMS) {
                return toDMS(Number(value), isLat);
            }
            if (value === 'N/A') return value;
            let maxDecimals = 4;
            try {
                if (config && typeof config.get === 'function') {
                    const setting = config.get('basics', 'MaxCoordDecimals');
                    if (typeof setting === 'number' && setting >= 1 && setting <= 10) {
                        maxDecimals = setting;
                    }
                }
            } catch (e) { maxDecimals = 4; }
            return Number(value).toFixed(maxDecimals);
        }
        function isDisplayCoordsOnOneLine() {
            try {
                return config && typeof config.get === 'function' && config.get('basics', 'DisplayCoordsOnOneLine');
            } catch (e) { return false; }
        }
        const displayOneLine = isDisplayCoordsOnOneLine();
        if (instance == false) {
            const lat = entry.coords[0]["lat"];
            const lon = entry.coords[0]["lon"];
            let coordLine;
            // Add Max Depth (lastPressureValue) if present
            const maxDepth = (typeof entry.lastPressureValue !== 'undefined' && entry.lastPressureValue !== null) ? Math.round(entry.lastPressureValue) + ' m' : 'N/A';
            if (displayOneLine) {
                // One-line, no labels, no parentheses
                coordLine = `${formatCoord(lat, true)}, ${formatCoord(lon, false)}`;
                popupContent = `
                    <div class="marker-popup-filename-floating" style="text-align:center;font-weight:bold;font-size:1.1em;margin-bottom:-12px;position:relative;z-index:2;background:#f8fafc;border:2px solid #8f8f8f;border-radius:6px;padding:4px 14px;display:inline-block;left:50%;transform:translateX(-50%);box-shadow:0 2px 8px rgba(0,0,0,0.10);">${entry.fileName}</div>
                    <div class="popup-box marker-popup-box" style="margin-top:18px;">
                        <div class="marker-popup-coords-centered" style="text-align:center;font-size:0.98em;margin-bottom:12px;">${coordLine}</div>
                        <ul class="popup-list marker-popup-list" style="padding:0;list-style:none;">
                            <li style="height:8px;"></li>
                            <li class="popup-list-item marker-popup-date" style="margin-bottom:4px;text-align:center;"><span class="popup-label">Date:</span> <span class="popup-value">${entry.timestamps["formatted"][0]}</span></li>
                            <li class="popup-list-item marker-popup-depth" style="margin-bottom:12px;text-align:center;"><span class="popup-label">Max Depth:</span> <span class="popup-value">${maxDepth}</span></li>
                            <li style="height:8px;"></li>
                            <li class="popup-list-item marker-popup-dims" style="margin-top:8px;text-align:center;">
                                <span class="popup-label">Dimensions:</span>
                                ${formatDims(entry.dims)}
                            </li>
                        </ul>
                        <button class="mapPopupButton marker-popup-button" style="margin-top:10px;display:block;margin-left:auto;margin-right:auto;" data-marker-data-file="${entry.fileName}">${buttonText ? buttonText : "View Profile Timeline"}</button>
                    </div>`;
            } else {
                // Multi-line, with labels, now with button
                popupContent = `
                    <div class="marker-popup-filename-floating" style="text-align:center;font-weight:bold;font-size:1.1em;margin-bottom:-12px;position:relative;z-index:2;background:#f8fafc;border:2px solid #8f8f8f;border-radius:6px;padding:4px 14px;display:inline-block;left:50%;transform:translateX(-50%);box-shadow:0 2px 8px rgba(0,0,0,0.10);">${entry.fileName}</div>
                    <div class="popup-box marker-popup-box" style="margin-top:18px;">
                        <div class="marker-popup-coords-centered" style="text-align:center;font-size:0.98em;margin-bottom:12px;">${formatCoord(lat, true)}, ${formatCoord(lon, false)}</div>
                        <ul class="popup-list marker-popup-list" style="padding:0;list-style:none;">
                            <li style="height:8px;"></li>
                            <li class="popup-list-item marker-popup-date" style="margin-bottom:4px;text-align:center;"><span class="popup-label">Date:</span> <span class="popup-value">${entry.timestamps["formatted"][0]}</span></li>
                            <li class="popup-list-item marker-popup-depth" style="margin-bottom:12px;text-align:center;"><span class="popup-label">Max Depth:</span> <span class="popup-value">${maxDepth}</span></li>
                            <li style="height:8px;"></li>
                            <li class="popup-list-item marker-popup-dims" style="margin-top:8px;text-align:center;"><span class="popup-label">Dimensions:</span> <span class="popup-value">${formatDims(entry.dims)}</span></li>
                        </ul>
                        <button class="mapPopupButton marker-popup-button" style="margin-top:10px;display:block;margin-left:auto;margin-right:auto;" data-marker-data-file="${entry.fileName}">${buttonText ? buttonText : "View Profile Timeline"}</button>
                    </div>`;
            }
        } else {
            const lat = entry.coords[instance]["lat"];
            const lon = entry.coords[instance]["lon"];
            let coordLine = `${formatCoord(lat, true)}, ${formatCoord(lon, false)}`;
            const timestamp = entry.timestamps && entry.timestamps["formatted"] && entry.timestamps["formatted"][instance] ? entry.timestamps["formatted"][instance] : "N/A";
            // Use same styled layout as main marker popup
                        popupContent = `
                                <div class="marker-popup-filename-floating" style="text-align:center;font-weight:bold;font-size:1.1em;margin-bottom:-12px;position:relative;z-index:2;background:#f8fafc;border:2px solid #8f8f8f;border-radius:6px;padding:4px 14px;display:inline-block;left:50%;transform:translateX(-50%);box-shadow:0 2px 8px rgba(0,0,0,0.10);">${entry.fileName}</div>
                                <div class="popup-box marker-popup-box" style="margin-top:18px;">
                                    <div class="marker-popup-coords-centered" style="text-align:center;font-size:0.98em;margin-bottom:12px;">${coordLine}</div>
                                    <ul class="popup-list marker-popup-list" style="padding:0;list-style:none;">
                                        <li style="height:8px;"></li>
                                        <li class="popup-list-item marker-popup-date" style="margin-bottom:4px;text-align:center;"><span class="popup-label">Timestamp:</span> <span class="popup-value">${timestamp}</span></li>
                                        <li style="height:8px;"></li>
                                    </ul>
                                </div>`;
        }
    }
    return popupContent;
}

/**
 * Stores a reference to a Leaflet marker in the application state, associated with a specific file name. This allows for easy retrieval and management of markers on the map based on the dataset they represent. When a marker is created for a dataset, this function can be called to save the marker reference in the state, enabling features like later removal or updating of the marker when the corresponding dataset is interacted with in the UI.
 * @param {*} state - The application state object where marker references are stored.
 * @param {*} fileName - The name of the file (or dataset) that the marker is associated with, used as a key to store the marker reference in the state.
 * @param {*} marker - The Leaflet marker object that should be stored in the state for later retrieval or management.
 */
function leaf_storeStateOfMapMarker(state, fileName, marker, instance=null, type=null) {
    if (!state.markers) {
        state.markers = {};
    }

    if (instance){
        if (type == "additional"){
            state.markers[fileName]["additionalInstances"].push(marker);
        } else{
            state.markers[fileName]["expandedInstances"].push(marker);
        }
    } else {
        state.markers[fileName] = {
            marker: marker, 
            isExpanded: false, 
            expandedInstances:[], 
            TimestampFlags: {
                TimestampFlagDifferences: [],
            }, // we should look to get rid of this. (or make this into the timestamp flag array)
            isLocFiltered: false,
            isFiltered: false, 
            additionalInstances: {
                polyLines:[], 
                Numbers:[],
                UnderIceFlags: []
            }};
    }
}

/**
 * Removes a marker from the Leaflet map based on the provided file name. This function looks up the marker associated with the given file name in the application state, removes it from the map, and deletes the reference from the state. It also logs the process for debugging purposes. This is useful for managing markers when datasets are removed or updated, ensuring that the map reflects the current state of the data being visualized.
 * @param {*} state - The application state object where marker references are stored.
 * @param {*} fileName - The name of the file (or dataset) whose associated marker should be removed from the map and state.
 * @returns boolean - Returns true if the marker was found and removed, false if no marker was found for the given file name.
 */
function leaf_removeMapMarker(state, fileName, instance=null) {
    /**
     * Removes a marker from the map based on fileName.
     * 
     * @param {Object} state - App state object containing markers map.
     * @param {string} fileName - The name of the file whose marker should be removed.
     * @returns {boolean} - True if marker was found and removed, false otherwise.
     */
    console.log('Attempting to remove marker for:', fileName);
    
    if (!state.markers || !state.markers[fileName]) {
        console.warn(`No marker found for file: ${fileName}`);
        return false;
    }

    // Remove marker from map (use removeFrom for compatibility)
    const marker = state.markers[fileName];
    if (instance){
        for (let instanceMarker of marker["expandedInstances"]){
            state.map.removeLayer(instanceMarker);

        }
        for (let instanceMarker of marker.additionalInstances["polyLines"]){
            state.map.removeLayer(instanceMarker);

        }
        for (let instanceMarker of marker["additionalInstances"].Numbers){
            state.map.removeLayer(instanceMarker);

        }
        // for (let instanceMarker of marker["additionalInstances"].UnderIceFlags){
        //     state.map.removeLayer(instanceMarker);

        // }
        // for (let instanceMarker of marker["TimestampFlags"].UnderIceFlags){
        //     state.map.removeLayer(instanceMarker);
        // }
    } else {
        if (state.map) {
            state.map.removeLayer(marker["marker"]);
        }
        if (marker["isExpanded"]){
                    for (let instanceMarker of marker["expandedInstances"]){
            state.map.removeLayer(instanceMarker);

        }
        for (let instanceMarker of marker.additionalInstances["polyLines"]){
            state.map.removeLayer(instanceMarker);

        }
        for (let instanceMarker of marker["additionalInstances"].Numbers){
            state.map.removeLayer(instanceMarker);
        }
        // Delete reference from state
        
    }
}
    
    return true;
}

function leaf_OpaqueMapMarker(state, fileName, opaque, index, isInstance=false) {
    //console.log('Attempting to obscure marker for:', fileName, index);
    state.markers[fileName].marker.setOpacity(opaque);
}

/**
 * Removes a sidebar list item based on fileName.
 * @param {*} fileName - The name of the file whose sidebar entry should be removed.
 * @returns boolean - True if entry was found and removed, false otherwise.
 */
function dom_removeSidebarEntry(fileName) {
    /**
     * Removes a sidebar list item based on fileName.
     * 
     * @param {string} fileName - The name of the file whose sidebar entry should be removed.
     * @returns {boolean} - True if entry was found and removed, false otherwise.
     */
    const gliderList = document.getElementById('GliderList');
    if (!gliderList) {
        console.error('GliderList element not found');
        return false;
    }

    // Find all list items in the GliderList
    const listItems = gliderList.querySelectorAll('li');
    
    // Find the item with matching textContent and remove it
    for (const item of listItems) {
        if (item.textContent === fileName) {
            item.remove();
            console.log(`Sidebar entry removed for: ${fileName}`);
            return true;
        }
    }

    console.warn(`No sidebar entry found for: ${fileName}`);
    return false;
}

// not tested yet
function getSidebarEntryObjectFromFileName(fileName) {
        // Find all list items in the GliderList
    const gliderList = document.getElementById('GliderList');
    const listItems = gliderList.querySelectorAll('li');
    foundSidebarEntryObject = null;
    
    // Find the item with matching textContent and remove it
    for (const item of listItems) {
        if (item.textContent === fileName) {
            return foundSidebarEntryObject;
        }
    }
    return "NotFoundError";
    
}

function leaf_filterPlatformsByTimeRange(state, dep, startTime, endTime) {
    const fileHandle = dep && dep.fileHandle;
    if (!fileHandle || typeof fileHandle.getAllSimpleData !== 'function') {
        console.error('leaf_filterPlatformsByTimeRange: fileHandle is undefined or invalid');
        handleMarkerFiltering(state);
        return;
    }
    let data;
    try {
        data = fileHandle.getAllSimpleData();
    } catch (e) {
        console.error('leaf_filterPlatformsByTimeRange: error getting data:', e);
        handleMarkerFiltering(state);
        return;
    }
    for (const entry of JSON.parse(data)) {
        let currentEvalTimestamp = entry.timestamps["formatted"][0];
        // Convert all to Date objects for robust comparison
        let evalDate = new Date(currentEvalTimestamp);
        let startDate = new Date(startTime);
        let endDate = new Date(endTime);
        if (evalDate > startDate && evalDate < endDate) {
            if (state.markers[entry.fileName]) state.markers[entry.fileName].isFiltered = false;
        } else {
            if (state.markers[entry.fileName]) state.markers[entry.fileName].isFiltered = true;
        }

        if (state.markers[entry.fileName]) {
            if (state.markers[entry.fileName].isFiltered || state.markers[entry.fileName].isLocFiltered){
                leaf_OpaqueMapMarker(state, entry.fileName, .2, 0, false);
            } else {
                leaf_OpaqueMapMarker(state, entry.fileName, 1, 0, false);
            }
        }
    }
    handleMarkerFiltering(state);
}

function leaf_filterPlatformsByLocation(state, dep) {
    const fileHandle = dep && dep.fileHandle;
    if (!fileHandle || typeof fileHandle.getAllSimpleData !== 'function') {
        console.error('leaf_filterPlatformsByLocation: fileHandle is undefined or invalid');
        handleMarkerFiltering(state);
        return;
    }
    let data;
    try {
        data = fileHandle.getAllSimpleData();
    } catch (e) {
        console.error('leaf_filterPlatformsByLocation: error getting data:', e);
        handleMarkerFiltering(state);
        return;
    }
    for (const entry of JSON.parse(data)) {
        let currentEvalLocation = entry.coords[0];
        if (currentEvalLocation["lat"] > state.mapLocationFiltering.latMin && currentEvalLocation["lat"] < state.mapLocationFiltering.latMax
            && 
            currentEvalLocation["lon"] > state.mapLocationFiltering.lonMin && currentEvalLocation["lon"] < state.mapLocationFiltering.lonMax) 
        {
            if (state.markers[entry.fileName]) state.markers[entry.fileName].isLocFiltered = false;
        } else {
            if (state.markers[entry.fileName]) state.markers[entry.fileName].isLocFiltered = true;
        }

        if (state.markers[entry.fileName]) {
            if (state.markers[entry.fileName].isFiltered || state.markers[entry.fileName].isLocFiltered){
                leaf_OpaqueMapMarker(state, entry.fileName, .2, 0, false);
            } else {
                leaf_OpaqueMapMarker(state, entry.fileName, 1, 0, false);
            }
        }
    }
    handleMarkerFiltering(state);
}

function handleMarkerFiltering(state){
    const totalFiltered = Object.values(state.markers).filter(marker => marker.isLocFiltered || marker.isFiltered).length;
    state.filteredMarkers = totalFiltered;
    //console.log(`Total markers filtered out: ${Object.keys(state.markers).length - totalFiltered}`);
    //console.log(state.markers);
    document.getElementById('leafletMapHeader').innerHTML = `Visible: ${Object.keys(state.markers).length - totalFiltered} out of ${Object.keys(state.markers).length} platforms`;
}

function leaf_addPolyNumberToMap(state, file, latlon, number){
    const numberIcon = L.divIcon({
                className: 'number-icon',
                html: `<div style="font-size:16px;font-weight:bold;color:#fff;border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;">${number}</div>`,
                iconSize: [1, 1],
                iconAnchor: [16, 30]
                });

                // Add number icon marker to map
                let instanceNumber = L.marker(latlon, { icon: numberIcon })
                instanceNumber.addTo(state.map);
                state.markers[file].additionalInstances.Numbers.push(instanceNumber); // store instance marker reference for later removal when collapsing
}

function leaf_addPolyLineToMap(state, file, latlon1, latlon2){
    const polyline = L.polyline([latlon1, latlon2], {
                    color: 'blue',
                    weight: 3,
                    opacity: 0.8,
                    dashArray: '10, 5',
                    lineCap: 'round',
                    lineJoin: 'round'
                });

    // poly line instances
    polyline.addTo(state.map);
    state.markers[file].additionalInstances.polyLines.push(polyline);

    return polyline;

}

function leaf_UpdateTimelineHeader(state, min, max){
    document.getElementById('MapTimelineFilterHeader').innerText = `Timeline Range: ${min} - ${max}`;
    window.updateCenterDivPosition();
}

function buildNotificationIcon(iconElement, notificationType){
    
    switch (notificationType) {
        case "info":
                iconElement.classList.add("icon", "icon-circle-notif");
                    break;
                case "warning":
                    iconElement.classList.add("icon", "icon-triangle-caution");
                    break;
                case "error":
                    iconElement.classList.add("icon", "icon-stop-caution");
                    break;
            }

        iconElement.classList.add("small-icon");
        return iconElement;
}

function buildNotificationMenuItem(state, params = {}){
    popupStateObj = state.popups.notificationsMenuPopup;
    
    let newItemWrapper = document.createElement('div');
    newItemWrapper.style.display = 'flex';
    newItemWrapper.style.alignItems = 'center';
    newItemWrapper.id = 'NewItemWrapper';
    
    let newItem = document.createElement('p');
    newItem.innerText = params.notificationLabel || "New Notification";
    newItem.id = 'MenuItemLabel';
    
    let newItemIcon = document.createElement('img');
    buildNotificationIcon(newItemIcon, params.notificationType || "info");
    newItemIcon.style.marginRight = '8px';

        newItemWrapper.appendChild(newItemIcon);
        newItemWrapper.appendChild(newItem);

        let itemBorderColor;
        let itemSeriousnessLevel;
        switch (params.notificationType) {
        case "info":
                itemBorderColor = "rgb(26, 137, 207)";
                itemSeriousnessLevel = 1;
                    break;
                case "warning":
                    itemBorderColor = "rgb(226, 143, 18)";
                    itemSeriousnessLevel = 2;
                    break;
                case "error":
                    itemBorderColor = "rgb(207, 26, 26)";
                    itemSeriousnessLevel = 3;
                    break;
            }
        newItemWrapper.style.borderColor = itemBorderColor;
        newItemWrapper.style.borderWidth = '1px';
        newItemWrapper.style.borderStyle = 'solid';
        newItemWrapper.style.padding = '5px';
        popupStateObj.addMenuItem(newItemWrapper, function(){
            popupStateObj.updateContent(`<div class="notificationsContent"><p>${params.content}</p></div>`);
        },
        providedItemData = { itemSeriousnessLevel: itemSeriousnessLevel }
        );

}

function postNotification(state, params = {}){
    buildNotificationMenuItem(state, params);

    let notificationSeriousness = null;
    let maxSeriousnessLevel = Math.max(...state.notificationsSeriousnessArray);
    switch (params.notificationType) {
        case "info":
            notificationSeriousness = 1;
            break;
        case "warning":
            notificationSeriousness = 2;
            break;
        case "error":
            notificationSeriousness = 3;
            break;
    }

    if (notificationSeriousness > maxSeriousnessLevel){
        updateNotificationIndicator(state, notificationSeriousness);
    }
    state.notificationsSeriousnessArray.push(notificationSeriousness);
    updateVisibilityOfNotificationIndicator(state);

}

function updateNotificationIndicator(state, seriousness){
    const notificationIndicator = document.getElementById('notificationIndicator');

    let newColor = '';
    switch (seriousness) {
    case 1:
        newColor = 'rgb(26, 137, 207)';
        break;
    case 2:
        newColor = 'rgb(226, 143, 18)';
        break;
    case 3:
        newColor = 'rgb(207, 26, 26)';
        break;
    }

    notificationIndicator.style.backgroundColor = newColor;
    
}

function updateVisibilityOfNotificationIndicator(state){
    const notificationIndicator = document.getElementById('notificationIndicator');
    if (state.notificationsSeriousnessArray.length > 0){
        notificationIndicator.style.display = 'block';
    } else {
        notificationIndicator.style.display = 'none';
    }
}

function dom_constructSettingsMenu(state, deps){
    const settingsMenu = state.popups.settingsMenu;
    const { config } = deps;
    settingsMenu.contentWrapper.classList.add('settingsMenuContentWrapper');

    let appSettingsPath = path.join(__dirname, 'appSettings.json');
    let appSettingsData = fs.readFileSync(appSettingsPath, 'utf-8');
    let appSettings = JSON.parse(appSettingsData);

    settingsMenu.contentWrapper.innerHTML = ''; // Clear existing content

    let settingsMenuWrapper = document.createElement('div');
    settingsMenuWrapper.classList.add('settingsMenuWrapper');

    let mainContentArea = document.createElement('div');
    mainContentArea.classList.add('mainContentArea');
    let subMenu = document.createElement('div');
    subMenu.classList.add('subMenu');

    let sectionHeader = document.createElement('h2');
    sectionHeader.classList.add('sectionHeader');
    sectionHeader.textContent = "Settings";
    let sectionContent = document.createElement('div');
    sectionContent.classList.add('sectionContent');
    let sectionFooter = document.createElement('div');
    sectionFooter.classList.add('sectionFooter');

    // // Footer Buttons
    // let fixUpDataButton = document.createElement('button');
    // fixUpDataButton.textContent = "Fix Up Data";
    // fixUpDataButton.classList.add('fixUpDataButton');
    // sectionFooter.appendChild(fixUpDataButton); 

    let saveSettingsButton = document.createElement('button');
    saveSettingsButton.textContent = "Apply";
    saveSettingsButton.classList.add('saveSettingsButton');

    
    settingsMenu.contentWrapper.appendChild(settingsMenuWrapper);

    settingsMenuWrapper.appendChild(subMenu);
    settingsMenuWrapper.appendChild(mainContentArea);

    mainContentArea.appendChild(sectionHeader);
    mainContentArea.appendChild(sectionContent);
    

    
    let arrayOfDifferentSections = [];
    let appSettingSections = appSettings[0]["settingSections"];
    let settingInstances = Object.values(appSettings[1]);
    console.log("App setting sections found:", appSettingSections);
    for (let i = 0; i < appSettingSections.length; i++){ // SECTIONS
        let sectionButtonWrapper = document.createElement('div');
        sectionButtonWrapper.classList.add('sectionButtonWrapper');
        let sectionButton = document.createElement('button');
        sectionButton.textContent = appSettingSections[i].toUpperCase();
        sectionButton.classList.add('sectionButton');
        sectionButtonWrapper.appendChild(sectionButton);
        subMenu.appendChild(sectionButtonWrapper);
        
        let newSection = document.createElement('div');
        newSection.classList.add('settingsSection');
        newSection.style.display = 'none';
        arrayOfDifferentSections.push({
            sectionName: appSettingSections[i],
            sectionElement: newSection,
            sectionChildren: [],
            isActive: false
        });
        sectionContent.appendChild(newSection);

    }
    console.log("Constructed settings menu sections:", arrayOfDifferentSections, settingInstances);

    // For each instance of a config setting
    for (settingInstance of settingInstances){ // SETTING INSTANCES
        let settingType = settingInstance.type; // instance type (e.g. "boolean", "number", "string")
        let sectionUIType = settingInstance.UIType; // UI type (e.g. "range", "select", "checkbox")
        let settingMin = settingInstance.min; // instance min
        let settingMax = settingInstance.max; // instance max
        let settingTargetName = settingInstance.TargetName; // instance name
        let settingSection = settingInstance.section; // instance section (e.g. "General", "Debug")

        // New vars
        let settingDefault = -1; // default value for the setting (to be fetched later from appSettings.json)
        let settingElms = { // each element ref for the setting instance
            wrapper: null,
            label: null,
            value: null,
            input: null
        };

        //console.log("Processing setting instance:", settingInstance);

        // create DOM elements for the setting instance
        let settingWrapperElm = document.createElement('div');
        settingWrapperElm.classList.add('settingWrapperElm');

        let settingLabelElm = document.createElement('label');
        settingLabelElm.textContent = settingInstance.TargetName;
        settingLabelElm.classList.add('settingLabelElm');

        let settingValueElm = document.createElement('h5');
        settingValueElm.textContent = settingDefault;
        settingValueElm.classList.add('settingValueElm');

        let settingInputElm = document.createElement('input');
        settingInputElm.type = sectionUIType;
        settingInputElm.classList.add('settingInputElm');
        if (sectionUIType === 'range') {
            if (settingMin !== null) settingInputElm.min = settingMin;
            if (settingMax !== null) settingInputElm.max = settingMax;
        }
        //


        // set Elms of this instance to the newly created DOM elements
        settingElms.wrapper = settingWrapperElm;
        settingElms.label = settingLabelElm;
        settingElms.value = settingValueElm;
        settingElms.input = settingInputElm;

        // attatch the DOM elements together in the correct order (label, value, input)
        settingWrapperElm.appendChild(settingLabelElm);
        settingWrapperElm.appendChild(settingInputElm);
        settingWrapperElm.appendChild(settingValueElm);

        settingValueElm.textContent = config.get(settingSection, settingTargetName);
        if (sectionUIType === 'checkbox') {
            settingInputElm.checked = config.get(settingSection, settingTargetName);
        } else {
            settingInputElm.value = config.get(settingSection, settingTargetName);
        }
        settingInputElm.addEventListener('change', function() {
            settingValueElm.textContent = sectionUIType === 'checkbox' ? settingInputElm.checked : settingInputElm.value;
            config.set(settingSection, settingTargetName, sectionUIType === 'checkbox' ? settingInputElm.checked : settingInputElm.value);

            if (settingTargetName === 'sidebarListFontSize') {
                applySidebarEntryFontSize(deps);
            }
        });

        // find the correct section for this setting instance and append the setting DOM elements to that section (via Data and DOM)
        for (let i = 0; i < arrayOfDifferentSections.length; i++){
            if (arrayOfDifferentSections[i].sectionName == settingSection){
                arrayOfDifferentSections[i].sectionChildren.push({
                    settingID: settingInstance.id,
                    settingType: settingType,
                    settingLabel: settingLabelElm,
                    settingValue: settingValueElm,
                    settingInput: settingInputElm,
                    settingMin: settingMin,
                    settingMax: settingMax,
                    settingTargetName: settingTargetName
                });
                arrayOfDifferentSections[i].sectionElement.appendChild(settingWrapperElm);
            }
        }
    }

    // add event listener to each sectionElement in arrayOfDifferentSections to handle section switching when the corresponding section button is clicked in the submenu
    for (let i = 0; i < arrayOfDifferentSections.length; i++){
        let sectionName = arrayOfDifferentSections[i].sectionName;
        let sectionElement = arrayOfDifferentSections[i].sectionElement;
        let sectionButton = subMenu.querySelector(`.sectionButtonWrapper:nth-child(${i+1}) .sectionButton`);
        sectionButton.addEventListener('click', function() {
            // Reset all section buttons to default style
            subMenu.querySelectorAll('.sectionButton').forEach(btn => {
                btn.classList.remove('sectionButtonActive');
            });
            // Set clicked button as active
            sectionButton.classList.add('sectionButtonActive');

            for (let j = 0; j < arrayOfDifferentSections.length; j++){
                arrayOfDifferentSections[j].sectionElement.style.display = 'none';
                arrayOfDifferentSections[j].isActive = false;
            }
            arrayOfDifferentSections[i].sectionElement.style.display = 'block';
            arrayOfDifferentSections[i].isActive = true;
        });
    }
    settingsMenu.contentWrapper.appendChild(sectionFooter);
    //sectionFooter.appendChild(saveSettingsButton);
    console.log("App settings loaded for settings menu:", appSettings);

    arrayOfDifferentSections[1].sectionElement.style.display = 'block';
    // Set the default section button as active
    let defaultButton = subMenu.querySelector(`.sectionButtonWrapper:nth-child(2) .sectionButton`);
    if (defaultButton) defaultButton.classList.add('sectionButtonActive');
}

function dom_toggleViewport(appState, viewportName) {
    if (viewportName == 'map') {
        appState.currentViewport = 'map';
        document.getElementById('viewModeButton').style.backgroundColor = '#ffffff00';
        document.getElementById('mapModeButton').style.backgroundColor = '#007bff';
        document.getElementById('mapModeButton').style.color = '#ffffff';
        document.getElementById('viewModeButton').style.color = '#000000';

        document.getElementById('mapPage').style.display = 'grid';
        document.getElementById('viewPage').style.display = 'none';

        
        document.getElementById('NewViewButton').style.display = 'none';
        document.getElementById('SaveViewButton').style.display = 'none';
    } else if (viewportName == 'view') {
        appState.currentViewport = 'view';
        document.getElementById('mapModeButton').style.backgroundColor = '#ffffff00';
        document.getElementById('viewModeButton').style.backgroundColor = '#007bff';
        document.getElementById('mapModeButton').style.color = '#000000';
        document.getElementById('viewModeButton').style.color = '#ffffff';

        document.getElementById('mapPage').style.display = 'none';
        document.getElementById('viewPage').style.display = 'grid';

        
        document.getElementById('NewViewButton').style.display = 'block';
        if (appState.hasViewBeenCreated) {document.getElementById('SaveViewButton').style.display = 'block';}
    }
}

function dom_toggleViewConfigColumn(appState, forceHidden = null) {
    const viewPage = document.getElementById('viewPage');
    if (!viewPage) return;

    const hideColumn = typeof forceHidden === 'boolean'
        ? forceHidden
        : !viewPage.classList.contains('vcard3-hidden');

    viewPage.classList.toggle('vcard3-hidden', hideColumn);
    appState.viewColumnVisible = !appState.viewColumnVisible;
    animatePlotResize(appState);
    schedulePlotResize(appState);
}

function requestResizeForCurrentViewPlots(appState, useResizeRequestHook = true) {
    let chartInstances = appState?.currentView?.chartInstances || [];

    chartInstances.forEach((chartInstance) => {
        if (useResizeRequestHook && typeof chartInstance.plotObject?.requestPlotResize === 'function') {
            chartInstance.plotObject.requestPlotResize();
            return;
        }

        if (chartInstance.plotObject?.chartObject && !chartInstance.plotObject.chartObject.isDisposed()) {
            chartInstance.plotObject.chartObject.resize();
        }
    });
}

function animatePlotResize(appState, duration = 320) {
    if (appState?.plotResizeAnimationFrame) {
        cancelAnimationFrame(appState.plotResizeAnimationFrame);
        appState.plotResizeAnimationFrame = null;
    }

    let animationStart = performance.now();

    function step(currentTime) {
        requestResizeForCurrentViewPlots(appState, false);

        if ((currentTime - animationStart) < duration) {
            appState.plotResizeAnimationFrame = requestAnimationFrame(step);
            return;
        }

        appState.plotResizeAnimationFrame = null;
        requestResizeForCurrentViewPlots(appState, false);
    }

    appState.plotResizeAnimationFrame = requestAnimationFrame(step);
}

function schedulePlotResize(appState) {
    requestAnimationFrame(function() {
        requestAnimationFrame(function() {
            requestResizeForCurrentViewPlots(appState);
        });
    });

    setTimeout(function() {
        requestResizeForCurrentViewPlots(appState);
    }, 120);
}

function dom_setVisibilityOfConfigColumn(appState, preferedVisibility = null){
    if (preferedVisibility == true) {
        if (appState.viewColumnVisible == false){
            dom_toggleViewConfigColumn(appState);
        }
    } else if (preferedVisibility == false) {
        if (appState.viewColumnVisible == true){
            dom_toggleViewConfigColumn(appState);
        }
    }
}

function dom_initNewView(appState, params = {}){
    let defaultVars = ["SSP"];
    params.vars = Array.isArray(params.vars)
        ? Array.from(new Set([...params.vars, ...defaultVars]))
        : [...defaultVars];
    const sanitizedParams = Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined)
    );
    let Defaults = {
                    name: params.name || 'New View',
                    type: params.type || 'XYZ',
                    dataSelection: params.dataSelection || 'XYZ',
                    vars: params.vars || [],
                    viewVars: params.viewVars || new Set(),
                    isViewGenerated: params.isViewGenerated || false,
                    includePlotData: params.includePlotData || false,
                    chartInstances: params.chartInstances || [dom_createChartInstance({
                                                                    general: {
                                                                        Name: null,
                                                                        EnableZoom: true,
                                                                        EnableDataPoints: true,
                                                                        EnableAxisPointers: true
                                                                    },
                                                                    obj:null,
                                                                    axis:[
                                                                        createAxisInstance({
                                                                            AxisSide: "Y",
                                                                            Data: "PRES_ADJUSTED"
                                                                        }),
                                                                        createAxisInstance({
                                                                            AxisSide: "X",
                                                                            Data: params.vars[0]
                                                                        })
                                                                    ]
                                                                })
                                                            ]
                };
                
    if (Object.keys(params).length === 0) {
        appState.currentView = Defaults;
    } else {        
        appState.currentView = Object.assign(Defaults, sanitizedParams);
    }

    let plotOutputWrapper = document.createElement('div');
    plotOutputWrapper.id = 'plotOutputWrapper';
    plotOutputWrapper.classList.add('plotOutputWrapper');
    document.getElementById('viewOutputMenu').appendChild(plotOutputWrapper); // we need to append a child to the menu to make sure it shows up when we click on the output option in the view config. This is a bit of a hack but it works for now. We can look to refactor this later.
}

function dom_createChartInstance(params = {}) {
    let Defaults = {
        general: {
            Name: null,
            EnableZoom: true,
            EnableDataPoints: true,
            EnableAxisPointers: true
        },
        obj:null,
        axis:[
            createAxisInstance({
                AxisSide: "Y",
                Data: null
            }),
            createAxisInstance({
                AxisSide: "X",
                Data: null
            })
        ]
    }

    if (Object.keys(params).length === 0) {
        return Defaults;
    } else {        
        return Object.assign(Defaults, params);
    }
}

function createAxisInstance(params = {}){
    let Defaults = {
        AxisSide: "X",
        Data: null,
    }

    if (Object.keys(params).length === 0) {
        return Defaults;
    } else {
        return Object.assign(Defaults, params);
    }
}

function renderView(appState, deps) {
    const shouldAutoBuildPlots = hasRenderableViewData(appState.currentView);

    if (shouldAutoBuildPlots) {
        appState.currentView.isViewGenerated = true;
    }

    renderCharts(appState, deps);

    if (shouldAutoBuildPlots) {
        buildPlots(appState, deps);
        schedulePlotResize(appState);
    }

    const viewNameElement = document.getElementById('viewName');
    if (!viewNameElement) return;
    viewNameElement.textContent = `View - ${appState.currentView?.name || 'New View'}`;
}

function hasRenderableViewData(view = {}) {
    if (!view || typeof view !== 'object' || !view.dataMap || typeof view.dataMap !== 'object') {
        return false;
    }

    return Object.values(view.dataMap).some(fileEntry => {
        if (!fileEntry || typeof fileEntry !== 'object') {
            return false;
        }

        return Object.values(fileEntry).some(value => {
            if (Array.isArray(value)) {
                return value.length > 0;
            }

            if (value && typeof value === 'object') {
                return Object.keys(value).length > 0;
            }

            return value != null;
        });
    });
}

function validateCurrentViewReferences(appState, deps) {
    const { fileHandle, pathDep } = deps;
    const dataFiles = Array.isArray(appState.currentView?.data) ? appState.currentView.data : [];
    const missingSavedDataFiles = [];
    const missingSimpleDataEntries = [];

    dataFiles.forEach((fileName) => {
        const filePath = path.join(pathDep.savedDataPath, fileName);
        if (!fileHandle.doesFileAlreadyExist(filePath)) {
            missingSavedDataFiles.push(fileName);
        }

        if (!fileHandle.doesEntryExistInSimpleData(fileName, false)) {
            missingSimpleDataEntries.push(fileName);
        }
    });

    return {
        isValid: missingSavedDataFiles.length === 0 && missingSimpleDataEntries.length === 0,
        missingSavedDataFiles,
        missingSimpleDataEntries
    };
}

function showViewGenerationBlockedWarning(appState, deps, validationResult) {
    const { logging, popup, basicFunctions, config } = deps;
    const targetViewName = appState.selectedViewFile || appState.currentView?.name || 'current view';
    const missingFileMessage = validationResult.missingSavedDataFiles.length > 0
        ? `Missing savedData files:<br>${validationResult.missingSavedDataFiles.join('<br>')}`
        : '';
    const missingMetadataMessage = validationResult.missingSimpleDataEntries.length > 0
        ? `Missing simpleData entries:<br>${validationResult.missingSimpleDataEntries.join('<br>')}`
        : '';
    const combinedMessage = [missingFileMessage, missingMetadataMessage].filter(Boolean).join('<br><br>');

    if (!logging || typeof logging.log !== 'function') {
        console.error('View generation blocked, but logging is unavailable.', validationResult);
        return;
    }

    logging.log(params={
        callerInfo: basicFunctions.getCallerInfo(),
        state: appState,
        dep: {
            popup,
            DOM: module.exports
        },
        msgLabel: 'View Generation Blocked (Broken References)',
        msg: `The saved view <b>${targetViewName}</b> cannot be generated because some files referenced by the view were not found in the app. Please import these files before generating the view.<br><br>${combinedMessage}`,
        seriousness: 'warning',
        code: '0001',
        class: 'FS',
        ignoreConsole: false,
        ignorePopup: Boolean(config.get('basics', 'HideBlockingPopupForClickedViews')),
        ignoreNotification: false,
        ignoreLogging: false
    });
}

function renderCharts (appState, deps) {
    document.getElementById('viewConfigWrapper').innerHTML = '';
    let viewConfigWrapper = document.getElementById('viewConfigWrapper');
    
    let viewChartInstanceWrapper = document.createElement('div');
    viewChartInstanceWrapper.id = 'viewChartInstanceWrapper';
    viewChartInstanceWrapper.classList.add('viewChartInstanceWrapper');
    viewConfigWrapper.appendChild(viewChartInstanceWrapper);

    let viewTitleWrapper = document.createElement('div');
    viewTitleWrapper.classList.add('viewTitleWrapper');
    let viewTitle = document.createElement('h4');
    viewTitle.innerHTML = `View - ${appState.currentView?.name || 'New View'}`;

    let viewConfigAddSubOption = document.createElement('button');
    viewConfigAddSubOption.classList.add('viewConfigAddSubOption');
    viewConfigAddSubOption.innerHTML = '+';
    viewConfigAddSubOption.id = 'viewConfigAddSubOption';

    viewConfigAddSubOption.addEventListener('click', function() {
        console.log("Add suboption clicked");
        appState.currentView.chartInstances.push(dom_createChartInstance());
        renderCharts(appState, deps);
        console.log("Current view after adding chart instance:", appState.currentView);
    });
    
    viewTitleWrapper.appendChild(viewTitle);
    viewTitleWrapper.appendChild(viewConfigAddSubOption);
    viewChartInstanceWrapper.appendChild(viewTitleWrapper);

    appState.currentView.chartInstances.forEach((chartInstance, index) => {
        dom_addChartInstanceToCurrentView(appState, deps, index);
    });

    // GENERATE
    let generateViewButton = document.createElement('button');
    generateViewButton.classList.add('generateViewButton');
    generateViewButton.textContent = 'Generate View';
    viewConfigWrapper.appendChild(generateViewButton);
    generateViewButton.addEventListener('click', function() {
        console.log('GENERATE VIEW CLICKED');

        const validationResult = validateCurrentViewReferences(appState, deps);
        if (!validationResult.isValid) {
            showViewGenerationBlockedWarning(appState, deps, validationResult);
            return;
        }

        appState.currentView.isViewGenerated = true;
        renderCharts(appState, deps);
        appState.currentView["targetDim"] = appState.currentView.chartInstances[0].axis[0].Data; // we should look to make this more dynamic in the future when we have more complex views with multiple chart instances and different axis data. For now we will just set the targetDim to be the data of the first axis of the first chart instance.
        console.log(appState.currentView);
        collectSpecifiedViewVars(appState, deps);
    })

    // OUTPUT
    let viewOutputWrapper = document.createElement('div');
    viewOutputWrapper.id = 'viewOutputWrapper';
    viewOutputWrapper.classList.add('viewOutputWrapper');
    viewOutputWrapper.classList.add('instanceOptionWrapper');
    viewConfigWrapper.appendChild(viewOutputWrapper);
    let viewOutputSpan = document.createElement('span');
    viewOutputSpan.textContent = "--------------";
    viewOutputWrapper.appendChild(viewOutputSpan);

    let viewOutput = document.createElement('h3');
    viewOutput.textContent = "Output";
    viewOutput.classList.add('viewOutput');
    viewOutput.classList.add('viewConfigOption');
    viewOutputWrapper.appendChild(viewOutput);

    viewOutput.addEventListener('click', function() {
        onChartInstanceOptionClick(appState, deps, "output", -1);
    });

    if (appState.currentView?.isViewGenerated && hasRenderableViewData(appState.currentView)) {
        viewOutputWrapper.style.display = 'flex';
    } else {        
        viewOutputWrapper.style.display = 'none';
    }

    schedulePlotResize(appState);
}

function dom_addChartInstanceToCurrentView(appState, deps, index, chartParams = {}){
    let newChartInstance = document.createElement('div');
    newChartInstance.classList.add('ViewChartInstance');

    // chart
    let instanceOptionWrapper_chart = document.createElement('div');
    let instanceOtionWrapper_chart_span = document.createElement('span');
    let instanceOptionWrapper_chart_name = document.createElement('div');
    let instanceOptionWrapper_chart_btn = document.createElement('button');
    instanceOptionWrapper_chart.classList.add('instanceOptionWrapper');
    instanceOtionWrapper_chart_span.textContent = "-----";
    instanceOptionWrapper_chart_name.classList.add('viewConfigOption');
    instanceOptionWrapper_chart_name.textContent = appState.currentView.chartInstances[index].general.Name || "Chart " + (index + 1);
    instanceOptionWrapper_chart_btn.classList.add('viewConfigRemoveSubOption');
    let instanceOptionWrapper_chart_btn_img = document.createElement('img');
    instanceOptionWrapper_chart_btn_img.src = path.join(pathDep.fromHereToRoot(__dirname), "src", "media", "trashcan.svg");
    instanceOptionWrapper_chart_btn_img.classList.add('viewRemoveIcon');
    instanceOptionWrapper_chart_btn.appendChild(instanceOptionWrapper_chart_btn_img);

    instanceOptionWrapper_chart.appendChild(instanceOtionWrapper_chart_span);
    instanceOptionWrapper_chart.appendChild(instanceOptionWrapper_chart_name);
    instanceOptionWrapper_chart.appendChild(instanceOptionWrapper_chart_btn);
    //


    // general
    let instanceOptionWrapper_general = document.createElement('div');
    let instanceOtionWrapper_general_span = document.createElement('span');
    let instanceOptionWrapper_general_name = document.createElement('div');
    instanceOptionWrapper_general.classList.add('instanceOptionWrapper');
    instanceOptionWrapper_general.classList.add('subOption');
    instanceOtionWrapper_general_span.textContent = "└";
    instanceOptionWrapper_general_name.classList.add('viewConfigOption');
    instanceOptionWrapper_general_name.textContent = "General";

    instanceOptionWrapper_general.appendChild(instanceOtionWrapper_general_span);
    instanceOptionWrapper_general.appendChild(instanceOptionWrapper_general_name);
    //

    // axis
    let instanceOptionWrapper_axis = document.createElement('div');
    let instanceOtionWrapper_axis_span = document.createElement('span');
    let instanceOptionWrapper_axis_name = document.createElement('div');
    instanceOptionWrapper_axis.classList.add('instanceOptionWrapper');
    instanceOptionWrapper_axis.classList.add('subOption');
    instanceOtionWrapper_axis_span.textContent = "└";
    instanceOptionWrapper_axis_name.classList.add('viewConfigOption');
    instanceOptionWrapper_axis_name.textContent = "Axis";

    instanceOptionWrapper_axis.appendChild(instanceOtionWrapper_axis_span);
    instanceOptionWrapper_axis.appendChild(instanceOptionWrapper_axis_name);
    //

    newChartInstance.appendChild(instanceOptionWrapper_chart);
    newChartInstance.appendChild(instanceOptionWrapper_general);
    newChartInstance.appendChild(instanceOptionWrapper_axis);

    instanceOptionWrapper_chart_name.addEventListener('click', function() {
        let x = instanceOptionWrapper_chart_name.parentElement.parentElement;
        console.log(x);

        let found = appState.currentView.chartInstances.find(instance => instance.obj === x);

        let object = found.obj;

        console.log(object);

        onChartInstanceOptionClick(appState, deps, "chart", index);
    });
    instanceOptionWrapper_general.addEventListener('click', function() {
        onChartInstanceOptionClick(appState, deps, "general", index);
    });
    instanceOptionWrapper_axis.addEventListener('click', function() {
        onChartInstanceOptionClick(appState, deps, "axis", index);
    });

    instanceOptionWrapper_chart_btn.addEventListener('click', function() {
        if (appState.currentView.chartInstances.length <= 1){
            alert("A view must contain at least one chart instance.");
            return;
        }
        let foundIndex = findChartInstanceIndexByObject(appState, newChartInstance);
        removeChart(appState, deps, foundIndex);
    });
    
    document.getElementById('viewChartInstanceWrapper').appendChild(newChartInstance);
    appState.currentView.chartInstances[index].obj = newChartInstance;

    appState.currentView.chartInstances[index].general.Name = appState.currentView.chartInstances[index].general.Name || `Chart ${index + 1}`;
}

function findChartInstanceIndexByObject(appState, object){
    for (let i = 0; i < appState.currentView.chartInstances.length; i++){
        if (appState.currentView.chartInstances[i].obj == object){
            return i;
        }
    }
}

function removeChart(appState, deps, index){
    appState.currentView.chartInstances.splice(index, 1);
    renderCharts(appState, deps);
}

function switchViewMenu(menuName){
    const createNewViewForm = document.getElementById('createNewViewForm');
    const chartInstanceSettingsMenu = document.getElementById('chartInstanceSettingsMenu');
    const chartInstanceGeneralSettingsMenu = document.getElementById('chartInstanceGeneralSettingsMenu');
    const chartInstanceAxisSettingsMenu = document.getElementById('chartInstanceAxisSettingsMenu');
    const viewOutputMenu = document.getElementById('viewOutputMenu');

    if (!createNewViewForm || !chartInstanceSettingsMenu || !chartInstanceGeneralSettingsMenu || !chartInstanceAxisSettingsMenu || !viewOutputMenu) {
        console.warn('switchViewMenu: one or more menu elements not found in DOM');
        return;
    }

    createNewViewForm.style.display = 'none';
    chartInstanceSettingsMenu.style.display = 'none';
    chartInstanceGeneralSettingsMenu.style.display = 'none';
    chartInstanceAxisSettingsMenu.style.display = 'none';
    viewOutputMenu.style.display = 'none';

    switch (menuName) {
        case "createNewView":
            createNewViewForm.style.display = 'flex';
            break;
        case "chartInstanceSettings":
            chartInstanceSettingsMenu.style.display = 'block';
            break;
        case "chartInstanceGeneralSettings":
            chartInstanceGeneralSettingsMenu.style.display = 'block';
            break;
        case "chartInstanceAxisSettings":
            chartInstanceAxisSettingsMenu.style.display = 'block';
            break;
        case "viewOutput":
            viewOutputMenu.style.display = 'block';
            break;
    }

    if (menuName === "viewOutput") {
        schedulePlotResize(window.appState || null);
    }

}

function onChartInstanceOptionClick(appState, deps, optionType, chartInstanceIndex){
    switch (optionType) {
        case "chart":
            DOM.switchViewMenu('chartInstanceSettings');
            setViewMenuTitle(`${appState.currentView.chartInstances[chartInstanceIndex].general.Name} Settings`);
            buildChartInstanceOptionsMenu(appState, deps, optionType, chartInstanceIndex);
            break;
        case "general":
            DOM.switchViewMenu('chartInstanceGeneralSettings');
            setViewMenuTitle(`${appState.currentView.chartInstances[chartInstanceIndex].general.Name} General Settings`);
            buildChartInstanceOptionsMenu(appState, deps, optionType, chartInstanceIndex);
            break;
        case "axis":
            DOM.switchViewMenu('chartInstanceAxisSettings');
            setViewMenuTitle(`${appState.currentView.chartInstances[chartInstanceIndex].general.Name} Axis Settings`);
            buildChartInstanceOptionsMenu(appState, deps, optionType, chartInstanceIndex);
            break;
        case "output":
            DOM.switchViewMenu('viewOutput');
            setViewMenuTitle(appState.currentView?.name || 'Output');
            buildChartInstanceOptionsMenu(appState, deps, optionType, chartInstanceIndex);
            break;
    }
}

function buildChartInstanceOptionsMenu(appState, deps, optionType, chartInstanceIndex){
    let menuWrapper = document.createElement('div');
    menuWrapper.classList.add('chartInstanceOptionsMenuWrapper');

    switch (optionType) {
        case "chart":
            document.getElementById('chartInstanceSettingsMenu').innerHTML = '';
            document.getElementById('chartInstanceSettingsMenu').appendChild(menuWrapper);
            let currentChart = appState.currentView.chartInstances[chartInstanceIndex];
            let contentWrapper = document.createElement('div');
            contentWrapper.classList.add('chartInstanceContentWrapper');
            menuWrapper.appendChild(contentWrapper);
            let stringifyedData = JSON.stringify(currentChart, createSafeChartInstanceReplacer(), 2);
            let pre = document.createElement('pre');
            pre.textContent = stringifyedData;
            pre.style.background = "#f6f8fa";
            pre.style.padding = "12px";
            pre.style.borderRadius = "6px";
            pre.style.fontSize = "0.98em";
            pre.style.overflowX = "auto";
            contentWrapper.appendChild(pre);
            break;
        case "general":
            document.getElementById('chartInstanceGeneralSettingsMenu').innerHTML = '';
            document.getElementById('chartInstanceGeneralSettingsMenu').appendChild(menuWrapper);
            
            let generalSettings = appState.currentView.chartInstances[chartInstanceIndex].general;
            console.log(generalSettings);

            for (let setting in generalSettings){
                let settingWrapper = document.createElement('div');
                settingWrapper.classList.add('chartInstanceGeneralSettingWrapper');
                let settingLabel = document.createElement('label');
                settingLabel.classList.add('chartInstanceGeneralSettingLabel');
                settingLabel.textContent = setting;
                let settingInput = document.createElement('input');
                settingInput.classList.add('chartInstanceGeneralSettingInput');
                settingWrapper.appendChild(settingLabel);
                settingWrapper.appendChild(settingInput);
                menuWrapper.appendChild(settingWrapper);

                if (typeof generalSettings[setting] === 'boolean') {
                    settingInput.type = 'checkbox';
                    settingInput.checked = generalSettings[setting];
                } else if (typeof generalSettings[setting] === 'string') {
                    settingInput.type = 'text';
                    settingInput.value = generalSettings[setting];
                } else if (typeof generalSettings[setting] === 'number') {
                    settingInput.type = 'number';
                    settingInput.value = generalSettings[setting];
                } else {
                    settingInput.type = 'text';
                    settingInput.value = generalSettings[setting];
                    //console.warn(`Unsupported setting type for ${setting}:`, typeof generalSettings[setting]);
                }

                if (setting === "Name") {
                    settingInput.value = generalSettings[setting] || `Chart ${chartInstanceIndex + 1}`;

                    
                    settingInput.addEventListener('input', function() {
                        appState.currentView.chartInstances[chartInstanceIndex].general[setting] = settingInput.value;
                        appState.currentView.chartInstances[chartInstanceIndex].obj.getElementsByClassName('instanceOptionWrapper')[0].getElementsByClassName('viewConfigOption')[0].textContent = settingInput.value;
                        setViewMenuTitle(`${settingInput.value} General Settings`);
                        // 117 appState.currentView.chartInstances[chartInstanceIndex].obj.getElementsByClassName('instanceOptionWrapper')[1].getElementsByClassName('viewConfigOption')[0].textContent = settingInput.value;
                        console.log(`Updated setting ${setting} to`, settingInput.value);
                    });
                    continue; // skip adding another event listener below since it's already added here for the Name setting
                }
                
                settingInput.addEventListener('input', function() {
                    if (settingInput.type === 'checkbox') {
                        appState.currentView.chartInstances[chartInstanceIndex].general[setting] = settingInput.checked;
                    } else {
                        appState.currentView.chartInstances[chartInstanceIndex].general[setting] = settingInput.value;
                    }
                    console.log(`Updated setting ${setting} to`, settingInput.type === 'checkbox' ? settingInput.checked : settingInput.value);
                });
            }

            break;
        case "axis":
            renderAxisChartInstance(appState, deps, menuWrapper, chartInstanceIndex);
            break;
        case "output":
            //collectSpecifiedViewVars(appState, deps);
            schedulePlotResize(appState);
            break;
    }


}

function getFilteredAxisDropdownVars(appState, deps) {
    const allVars = Array.isArray(appState?.currentView?.vars) ? appState.currentView.vars : [];
    const shouldHideQCVars = Boolean(deps?.config?.get('view', 'HideQCVarsForAxisDropdown'));
    const shouldHideDMVars = Boolean(deps?.config?.get('view', 'HideDMVarsForAxisDropdown'));
    const shouldHideERRORVars = Boolean(deps?.config?.get('view', 'HideERRORVarsForAxisDropdown'));
    const blacklistedVars = Array.isArray(appState?.filteredAxisVarBlacklist)
        ? new Set(
            appState.filteredAxisVarBlacklist
                .filter((varName) => typeof varName === 'string')
                .map((varName) => varName.trim().toLowerCase())
                .filter((varName) => varName.length > 0)
        )
        : new Set();

    return allVars.filter((varName) => {
        if (typeof varName !== 'string') {
            return false;
        }

        if (shouldHideQCVars && varName.endsWith('QC')) {
            return false;
        }

        if (shouldHideDMVars && varName.endsWith('DM')) {
            return false;
        }

        if (shouldHideERRORVars && varName.endsWith('ERROR')) {
            return false;
        }

        if (blacklistedVars.has(varName.trim().toLowerCase())) {
            return false;
        }

        return true;
    });
}

function createSafeChartInstanceReplacer() {
    const seen = new WeakSet();

    return function(key, value) {
        if (key === 'obj') {
            return '[DOM Element]';
        }

        if (key === 'plotObject') {
            return '[Plot Object]';
        }

        if (key === 'chartObject') {
            return '[Chart Object]';
        }

        if (typeof Element !== 'undefined' && value instanceof Element) {
            return `[Element: ${value.tagName}]`;
        }

        if (value && typeof value === 'object') {
            if (seen.has(value)) {
                return '[Circular]';
            }

            seen.add(value);
        }

        return value;
    };
}

function collectSpecifiedViewVars(appState, deps) {
    console.log(deps);
    let {charts, integrations, pathDep} = deps;
    let specifiedVars = new Set();

    showLoadingScreen();
    setLoadingText('Generating plots...');

    // For Each Chart
    appState.currentView.chartInstances.forEach((chartInstance, index) => {
        // For Each Axis in Chart
        chartInstance.axis.forEach((axis, axisIndex) => {
            // Add Var (skip null/undefined Data)
            if (axis.Data != null) specifiedVars.add(axis.Data);
        });
    });

    console.log(specifiedVars);
    fetchDataForSpecifiedVars(appState, deps, Array.from(specifiedVars)).then(async dataMap => {
        console.log('Fetched dataMap:', dataMap);
        appState.currentView.dataMap = dataMap;

        

        console.log('Updated appState with dataMap:', appState);
        buildPlots(appState, deps);
        renderCharts(appState, deps);
        schedulePlotResize(appState);

        await Promise.all(
            appState.currentView.chartInstances.map((chartInstance) => chartInstance.plotObject?.plotReadyPromise || Promise.resolve())
        );

        hideLoadingScreen();

    }).catch(err => {
        console.error('fetchDataForSpecifiedVars error:', err);
        hideLoadingScreen();
    });
}

async function fetchDataForSpecifiedVars(appState, deps, specifiedVars) {
    let {integrations, pathDep, fileHandle, basicFunctions} = deps;
    let dataPath = pathDep.resolveToProperDataPath(__dirname, 'savedData');
    let dataMap = {};

    for (const fileName of appState.currentView.data) {
        dataMap[fileName] = {};
        const filePath = path.join(dataPath, fileName);
        await integrations.callPyFunc('open', [filePath]);
        for (const varName of specifiedVars) {
            console.log(`Fetching variable "${varName}" from file "${fileName}"...`);
            if (varName === "SSP"){
                dataMap[fileName][varName] = {};
            } else{
                const result = await integrations.callPyFunc('getVariable', [varName], fileName);
                dataMap[fileName][varName] = result;
            }
        }

        if ("SSP" in dataMap[fileName]){
            let utilizedPres = null;
            let utilizedTemp = null;
            let utilizedPsal = null;
            let coords = fileHandle.getEntryKeyInSimpleData(fileName, "coords");

            const availableDataVars = Object.keys(dataMap[fileName]);
            const storedFileVars = fileHandle.getEntryKeyInSimpleData(fileName, 'vars') || [];

            const utilizedPresName = basicFunctions.getMatchingVariableName(availableDataVars, 'pressure', ['PRES', 'PRES_ADJUSTED'])
                || basicFunctions.getMatchingVariableName(storedFileVars, 'pressure', ['PRES', 'PRES_ADJUSTED']);
            const utilizedTempName = basicFunctions.getMatchingVariableName(availableDataVars, 'temperature', ['TEMP', 'TEMP_ADJUSTED'])
                || basicFunctions.getMatchingVariableName(storedFileVars, 'temperature', ['TEMP', 'TEMP_ADJUSTED']);
            const utilizedPsalName = basicFunctions.getMatchingVariableName(availableDataVars, 'salinity', ['PSAL', 'PSAL_ADJUSTED'])
                || basicFunctions.getMatchingVariableName(storedFileVars, 'salinity', ['PSAL', 'PSAL_ADJUSTED']);

            if (utilizedPresName && utilizedPresName in dataMap[fileName]) {
                utilizedPres = dataMap[fileName][utilizedPresName];
            } else if (utilizedPresName) {
                utilizedPres = await integrations.callPyFunc('getVariable', [utilizedPresName], fileName);
            }

            if (utilizedTempName && utilizedTempName in dataMap[fileName]) {
                utilizedTemp = dataMap[fileName][utilizedTempName];
            } else if (utilizedTempName) {
                utilizedTemp = await integrations.callPyFunc('getVariable', [utilizedTempName], fileName);
            }

            if (utilizedPsalName && utilizedPsalName in dataMap[fileName]) {
                utilizedPsal = dataMap[fileName][utilizedPsalName];
            } else if (utilizedPsalName) {
                utilizedPsal = await integrations.callPyFunc('getVariable', [utilizedPsalName], fileName);
            }

            let presDict = {};
            let tempDict = {};
            let psalDict = {};
            let lats = [];
            let lons = [];
            for (let i = 0; i < utilizedPres.length; i++) {
                presDict[i] = utilizedPres[i];
                tempDict[i] = utilizedTemp[i];
                psalDict[i] = utilizedPsal[i];
                lats.push(coords[i]["lat"]);
                lons.push(coords[i]["lon"]);
            }
            const sspResult = await integrations.callPyFunc('bulkSSP', [presDict, tempDict, psalDict, lats, lons], fileName);
            //dataMap[fileName]["SSP_PRIMED"] = [utilizedPres, utilizedTemp, utilizedPsal, coords];
            dataMap[fileName]["SSP"] = Object.keys(sspResult).sort((a, b) => a - b).map(k => sspResult[k]);
        }
    }

    console.log(dataMap);
    return dataMap;
}

function buildPlots(appState, deps) {
    const {charts} = deps;
    appState.currentView.chartInstances.forEach((chartInstance) => {
        if (typeof chartInstance.plotObject?.cleanupPlotObject === 'function') {
            chartInstance.plotObject.cleanupPlotObject();
        }

        if (chartInstance.plotObject?.chartObject && !chartInstance.plotObject.chartObject.isDisposed()) {
            chartInstance.plotObject.chartObject.dispose();
        }
    });

    document.getElementById('plotOutputWrapper').innerHTML = '';

    appState.currentView.chartInstances.forEach((chartInstance, index) => {
        chartInstance.plotObject = charts.buildPlotInstance(appState, deps, index);
        document.getElementById('plotOutputWrapper').appendChild(chartInstance.plotObject);
    });

}

function renderAxisChartInstance(appState, deps, menuWrapper, chartInstanceIndex) {
    document.getElementById('chartInstanceAxisSettingsMenu').innerHTML = '';
    document.getElementById('chartInstanceAxisSettingsMenu').appendChild(menuWrapper);

    // Add + Button for adding new axis
    let addAxisButton = document.createElement('button');
    addAxisButton.classList.add('addAxisButton');
    addAxisButton.textContent = "Add Axis +";
    addAxisButton.addEventListener('click', function() {
        let newAxis = {
            AxisSide: "X",
            Data: null,
            Unit: ''
        };
        appState.currentView.chartInstances[chartInstanceIndex].axis.push(newAxis);
        menuWrapper.innerHTML = '';
        renderAxisChartInstance(appState, deps, menuWrapper, chartInstanceIndex);
    });
    menuWrapper.appendChild(addAxisButton);
    //

    // Init vars
    allAxis = appState.currentView.chartInstances[chartInstanceIndex].axis;
    axisAmount = allAxis.length;
    //

    // Each Axis
    allAxis.forEach((axisKey, index) => {
        // Header row: [arrow + label + select + remove]
        
        // row (wrapper)
        let axisRow = document.createElement('div');
        axisRow.style.display = 'flex';
        axisRow.style.alignItems = 'center';
        axisRow.style.gap = '8px';
        axisRow.style.padding = '6px 4px';
        axisRow.style.cursor = 'pointer';
        axisRow.style.userSelect = 'none';

        // Arrow
        let arrow = document.createElement('span');
        arrow.textContent = '▶';
        arrow.style.fontSize = '10px';
        arrow.style.transition = 'transform 0.2s';
        arrow.style.flexShrink = '0';

        // Label
        let label = document.createElement('label');
        label.textContent = `Axis ${index + 1}`;
        label.style.minWidth = '50px';
        label.style.cursor = 'pointer';

        // Var Dropdown Select
        let axisSelect = document.createElement('select');
        //axisSelect.style.flex = '1';
        axisSelect.style.width = '50%';
        axisSelect.style.marginLeft = '20px';
        let varsToUse = getFilteredAxisDropdownVars(appState, deps);
        varsToUse.forEach(opt => {
            let option = document.createElement('option');
            option.value = opt;
            option.textContent = opt;
            axisSelect.appendChild(option);
            //console.log(opt)
        });
        let currentData = appState.currentView.chartInstances[chartInstanceIndex].axis[index].Data;
        if (currentData && varsToUse.includes(currentData)) {
            axisSelect.value = currentData;
            appState.currentView.chartInstances[chartInstanceIndex].axis[index].Data = currentData;
        } else if (axisSelect.options.length > 0) {
            // No saved value — default to first option and sync state
            axisSelect.value = axisSelect.options[0].value;
            appState.currentView.chartInstances[chartInstanceIndex].axis[index].Data = axisSelect.options[0].value;
            console.log(`No saved data for axis[${index}], defaulting to first option:`, axisSelect.options[0].value);
        }

        // Axis Side Dropdown
        let axisSideSelect = document.createElement('select');
        axisSideSelect.style.width = '10%';
        axisSideSelect.style.marginLeft = '5px';
        ['X', 'Y'].forEach(opt => {
            let option = document.createElement('option');
            option.textContent = opt;
            axisSideSelect.appendChild(option);
        });
        let currentSide = appState.currentView.chartInstances[chartInstanceIndex].axis[index].AxisSide;
        if (currentSide) axisSideSelect.value = currentSide;


        // Var Dropdown Content
        let axisContent = document.createElement('div');
        axisContent.style.display = 'none';
        axisContent.style.padding = '6px 8px';

        let placeholder = document.createElement('p');
        placeholder.textContent = `Axis ${index + 1} — select variable and axis side.`;
        placeholder.style.margin = '0';
        placeholder.style.fontSize = '0.9em';
        placeholder.style.color = '#666';
        axisContent.appendChild(placeholder);

        // Remove Button
        let removeButton = document.createElement('button');
        removeButton.classList.add('bannerButton');
        removeButton.textContent = 'Remove Axis';
        removeButton.style.marginTop = '6px';

        // Stop select clicks from toggling the row
        axisSelect.addEventListener('click', function(e) {
            e.stopPropagation();
        });
        axisSideSelect.addEventListener('click', function(e) {
            e.stopPropagation();
        });

        // Single toggle listener on the whole row
        axisRow.addEventListener('click', function() {
            const isOpen = axisContent.style.display !== 'none';
            axisContent.style.display = isOpen ? 'none' : 'block';
            arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
        });

        // Remove button listener
        removeButton.addEventListener('click', function() {
            appState.currentView.chartInstances[chartInstanceIndex].axis.splice(index, 1);
            menuWrapper.innerHTML = '';
            renderAxisChartInstance(appState, deps, menuWrapper, chartInstanceIndex);
        });

        // Select listener
        axisSelect.addEventListener('change', function() {
            appState.currentView.chartInstances[chartInstanceIndex].axis[index].Data = axisSelect.value;
        });
        axisSideSelect.addEventListener('change', function() {            
            appState.currentView.chartInstances[chartInstanceIndex].axis[index].AxisSide = axisSideSelect.value;
        });

        if(index === 0){
            axisSelect.disabled = true;
            axisSideSelect.disabled = true;
            removeButton.disabled = true;

            const preferredPressureAxis = deps.basicFunctions.getMatchingVariableName(varsToUse, 'pressure', ['PRES_ADJUSTED', 'PRES']);
            if (preferredPressureAxis) {
                axisSelect.value = preferredPressureAxis;
                appState.currentView.chartInstances[chartInstanceIndex].axis[0].Data = preferredPressureAxis;
            }
        }
        
        axisRow.appendChild(arrow);
        axisRow.appendChild(label);
        axisRow.appendChild(axisSideSelect);
        axisRow.appendChild(axisSelect);
        axisRow.appendChild(removeButton);

        // Axis dropdown content (expanded panel)
        // Add Axis Unit input as the first (and currently only) option
        let axisUnitInput = document.createElement('input');
        axisUnitInput.type = 'text';
        axisUnitInput.placeholder = 'Axis Unit';
        axisUnitInput.style.width = '120px';
        axisUnitInput.style.margin = '8px 0 8px 0';
        axisUnitInput.value = appState.currentView.chartInstances[chartInstanceIndex].axis[index].Unit || '';
        axisUnitInput.addEventListener('input', function() {
            appState.currentView.chartInstances[chartInstanceIndex].axis[index].Unit = axisUnitInput.value;
        });
        // Label and input for unit, side by side
        let axisUnitWrapper = document.createElement('div');
        axisUnitWrapper.style.display = 'flex';
        axisUnitWrapper.style.alignItems = 'center';
        axisUnitWrapper.style.gap = '8px';
        axisUnitWrapper.style.margin = '8px 0 8px 0';

        let axisUnitLabel = document.createElement('label');
        axisUnitLabel.textContent = 'Axis Unit:';
        axisUnitLabel.style.fontSize = '0.95em';
        axisUnitLabel.style.margin = '0';

        axisUnitInput.style.margin = '0';

        axisUnitWrapper.appendChild(axisUnitLabel);
        axisUnitWrapper.appendChild(axisUnitInput);
        axisContent.appendChild(axisUnitWrapper);

        menuWrapper.appendChild(axisRow);
        menuWrapper.appendChild(axisContent);
    });
}

function setViewMenuTitle(title){
    document.getElementById('viewMenuTitle').textContent = title;
}

function constructViewDataViaPreferences(appState, deps, viewPreferences){
    console.log("Constructing view data based on preferences:", viewPreferences);
    let isPresDataMissing = false;
    let {fileHandle, pathDep, basicFunctions} = deps;

    let resultingData = [];
    const markerEntries = Object.entries(appState.markers || {});

    switch (viewPreferences) {
        case "fromSelection":
            // Construct view data based on the current file selection
            resultingData = Array.from(appState.selectedFiles || []);
            break;
        case "allVisible":
            // Construct view data based on all visible items on the map
            markerEntries.forEach(([fileName, marker]) => {
                if (marker.isFiltered  === false && marker.isLocFiltered === false) {
                    resultingData.push(fileName);
                }
            });
            break;
        case "allHidden":
            // Construct view data based on all hidden items on the map
            markerEntries.forEach(([fileName, marker]) => {
                if (marker.isFiltered === true || marker.isLocFiltered === true) {
                    resultingData.push(fileName);
                }
            });
            break;
        case "allWithNotes":
            // Construct view data based on all items with notes on the map
            break;
        case "all":
            // Construct view data based on all items on the map
            resultingData = markerEntries.map(([fileName]) => fileName);
            break;
        case "custom":
            // Construct view data based on a custom selection of items on the map
            break;
    }

    console.log("Resulting view data constructed from preferences:", resultingData);
    resultingData = resultingData.filter(fileName => {
        let fileData = fileHandle.getEntryKeyInSimpleData(fileName, 'vars');
        const hasPres = basicFunctions.hasMatchingVariable(fileData, 'pressure', ['PRES', 'PRES_ADJUSTED']);
        if (!hasPres) {
            isPresDataMissing = true;
            return false; // exclude files without a usable depth axis
        }
        return true;
    });
    if (isPresDataMissing) {
        // Suppress alert if IgnoreNoPresDataPopup is enabled in config
        let ignoreNoPres = false;
        try {
            if (deps && deps.config && typeof deps.config.get === 'function') {
                ignoreNoPres = deps.config.get('view', 'IgnoreNoPresDataPopup');
            }
        } catch (e) { ignoreNoPres = false; }
        if (!ignoreNoPres) {
            alert("Some files were excluded from the view because they are missing a usable depth axis variable (PRES or PRES_ADJUSTED). Re-evaluate your file selection if this was not intended.");
        }
    }

    return resultingData;
}



module.exports = {
    loadSideBar_Glider,
    loadSideBar_Views,
    dom_createElm_GliderListItem,
    dom_createElm_ViewListItem,
    applySidebarEntryFontSize,
    dom_clearElementInnerHTML_UsingString,
    dom_clearElementInnerHTML_UsingObject,
    showLoadingScreen,
    hideLoadingScreen,
    setLoadingText,
    displayDatasetInfo,
    leaf_insertDataMarker,
    leaf_buildPopupContent,
    leaf_removeMapMarker,
    dom_removeSidebarEntry,
    dom_SetElementInnerHTML_UsingString,
    dom_SetElementInnerHTML_UsingObject,
    getSidebarEntryObjectFromFileName,
    leaf_filterPlatformsByTimeRange,
    leaf_filterPlatformsByLocation,
    leaf_addPolyNumberToMap,
    leaf_UpdateTimelineHeader,
    leaf_addPolyLineToMap,
    buildNotificationMenuItem,
    postNotification,
    updateNotificationIndicator,
    updateVisibilityOfNotificationIndicator,
    dom_constructSettingsMenu,
    dom_toggleViewport,
    dom_toggleViewConfigColumn,
    dom_initNewView,
    renderView,
    renderCharts,
    createAxisInstance,
    dom_createChartInstance,
    findChartInstanceIndexByObject,
    dom_setVisibilityOfConfigColumn,
    switchViewMenu,
    setViewMenuTitle,
    constructViewDataViaPreferences
};