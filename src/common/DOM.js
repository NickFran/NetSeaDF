// DOM manipulation functions
const path = require('path');


/**
 * Displays detailed information about a dataset in the info cards section of the UI.
 * @param {*} state - App state object 
 * @param {*} deps - Module dependencies
 * @param {*} fileName - The name of the file whose dataset info should be displayed in the info cards.
 * @returns 
 */
function displayDatasetInfo(state, deps, fileName) {
    const { pathDep, fileHandle, integrations } = deps;

    document.getElementById('dataFileHeader').textContent = `${fileName}`;
    
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
        
        // Helper function to format coordinate values (truncate to 10 decimals with ellipsis)
        function formatCoord(value) {
            if (value === 'N/A') return value;
            const str = value.toString();
            const decimalIndex = str.indexOf('.');
            if (decimalIndex === -1) return str;
            
            const wholePart = str.substring(0, decimalIndex);
            const decimalPart = str.substring(decimalIndex + 1);
            
            if (decimalPart.length > 10) {
                return wholePart + '.' + decimalPart.substring(0, 10) + '...';
            }
            return str;
        }
        
        // Helper function to create nested list items
        function addToList(parent, key, value, timestamps = null) {
            const li = document.createElement('li');
            li.textContent = key;
            li.style.wordWrap = 'break-word';
            
            // If the value is an array, create a nested list for its items
            if (Array.isArray(value)) {
                // Create nested list for array items (even if empty)
                const subUl = document.createElement('ul');
                if (value.length > 0) {
                    // Special handling for coords
                    if (key === 'coords' && value.length > 0) {
                        const first = value[0];
                        if (first && typeof first === 'object' && ('lat' in first || 'lon' in first)) {
                            value.forEach((coord, index) => {
                                const indexLi = document.createElement('li');
                                indexLi.textContent = `[${index}]: ${timestamps[index]}`;

                                const coordUl = document.createElement('ul');
                                const coordLi_Lat = document.createElement('li');
                                const coordLi_Lon = document.createElement('li');
                                const lat = coord?.lat !== undefined ? coord.lat : 'N/A';
                                const lon = coord?.lon !== undefined ? coord.lon : 'N/A';
                                coordLi_Lat.textContent = `Lat: ${formatCoord(lat)}`;
                                coordLi_Lon.textContent = `Lon: ${formatCoord(lon)}`;
                                coordUl.appendChild(coordLi_Lat);
                                coordUl.appendChild(coordLi_Lon);

                                indexLi.appendChild(coordUl);
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

                                const coordUl = document.createElement('ul');
                                const coordLi = document.createElement('li');
                                const lat = lats[i] !== undefined ? lats[i] : 'N/A';
                                const lon = lons[i] !== undefined ? lons[i] : 'N/A';
                                coordLi.textContent = `Lat: ${formatCoord(lat)}, Lon: ${formatCoord(lon)}`;
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
            if (key === 'dims' || key === 'coords') {
                addToList(ulInfo, key, value, Object.entries(dataset)[6][1]["formatted"]);
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

/**
 * Creates a list item element for a glider file, with click handling for selection and opening.
 * @param {*} state App State Object  
 * @param {*} deps Module Dependencies
 * @param {*} file File name (title of the list item)
 * @param {*} onFileSelect Callback function that gets called when the file is selected (receives file name as argument)
 * @returns li element to be appended and displayed in the sidebar list
 */
function dom_createElm_GliderListItem(state, deps, file, onFileSelect) {
    const { pathDep, fileHandle, integrations } = deps;

    const li = document.createElement('li'); // create a new element
        li.textContent = file; // set its name to the file name
        li.addEventListener('click', (event) => {  // Use event parameter instead of global
            console.log(`Click Tunnel = `, JSON.stringify(fileHandle.getEntryKeyInSimpleData(file, "dims"), null, 2));
            
            if (event.shiftKey){
                console.log("Shift key was held during click - multi-select not implemented yet")
                state.isMultiSelect = true;
                state.selectedFiles.add(file);
            } else {
                console.log("Shift key was not held during click - opening file normally")
                state.isMultiSelect = false;
                state.selectedFiles = new Set([file]);
            }

            console.log("Selected files:", Array.from(state.selectedFiles));
            if (state.isMultiSelect){
                console.log("Multi-select mode is on");
                // SHOW POPUP FOR MULTI-VIEWING
            }else{
                // SHOW NORMALLY
            }

            // Reset all li backgrounds first
            document.querySelectorAll('.GliderList li').forEach(item => {
                item.style.backgroundColor = '';
            });

            // Show the temp class (DELETE button)
            document.querySelector('.DeleteFileButton').style.display = 'block';
            
            // Set clicked li background
            li.style.backgroundColor = '#4a90e2';
            
            // const thisFilePath = path.join(savedDataPath, file);
            // console.log("Activating file:", thisFilePath);
            
            // Trigger the callback with the selected file
            if (onFileSelect) {
                onFileSelect(state, deps, file);
            }

            // integrations.callPyFunc('open', [thisFilePath], { timeoutMs: 60000 }).then(result => {
            //     console.log("Result from loading upon click:", result);
            // }).catch(error => {
            //     console.error("Error calling Python function:", error);
            // });
        })
        // append it as a child to the element
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
}
/**
 * Functions to show and hide the loading screen overlay. The showLoadingScreen function makes the overlay visible and fully opaque, while the hideLoadingScreen function fades it out and then hides it after the fade-out animation completes.
 * These functions can be called before and after long-running operations (like loading a dataset) to provide visual feedback to the user that something is happening.
 */
function hideLoadingScreen() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.opacity = '0';
    setTimeout(function() {
        loadingOverlay.style.display = 'none';
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
function leaf_insertDataMarker(state, lat, lon, popupText = null, markerOptions = {}, fileName = null) {
    // Validate coordinates
    if (lat === undefined || lon === undefined || lat === 'N/A' || lon === 'N/A') {
        console.warn('Invalid coordinates provided to insertDataMarker:', { lat, lon });
        return null;
    }

    // Create marker with optional custom options
    const marker = L.marker([lat, lon], markerOptions).addTo(state.map);

    // Add popup if text is provided
    if (popupText) {
        marker.bindPopup(popupText);
    }

    // Store marker reference by fileName if provided
    if (fileName) {
        leaf_storeStateOfMapMarker(state, fileName, marker);
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
function leaf_buildPopupContent(name, lat, lon, dims) {
    let popupContent = `<ul>
            <li>File Name: ${name}</li>
            <br>
            <li>Latitude: ${lat}</li>
            <li>Longitude: ${lon}</li>
            <br>
            <li>Dimensions: ${dims}</li>
            <br>
            <button class="mapPopupButton dis" id="mapPopupButton">View Data</button>
        </ul>`;
    return popupContent;
}

/**
 * Stores a reference to a Leaflet marker in the application state, associated with a specific file name. This allows for easy retrieval and management of markers on the map based on the dataset they represent. When a marker is created for a dataset, this function can be called to save the marker reference in the state, enabling features like later removal or updating of the marker when the corresponding dataset is interacted with in the UI.
 * @param {*} state - The application state object where marker references are stored.
 * @param {*} fileName - The name of the file (or dataset) that the marker is associated with, used as a key to store the marker reference in the state.
 * @param {*} marker - The Leaflet marker object that should be stored in the state for later retrieval or management.
 */
function leaf_storeStateOfMapMarker(state, fileName, marker) {
    if (!state.markers) {
        state.markers = {};
    }

    state.markers[fileName] = marker;
    console.log(`Marker stored for: ${fileName}`);
    console.log('Current markers in state:', state.markers);
}

/**
 * Removes a marker from the Leaflet map based on the provided file name. This function looks up the marker associated with the given file name in the application state, removes it from the map, and deletes the reference from the state. It also logs the process for debugging purposes. This is useful for managing markers when datasets are removed or updated, ensuring that the map reflects the current state of the data being visualized.
 * @param {*} state - The application state object where marker references are stored.
 * @param {*} fileName - The name of the file (or dataset) whose associated marker should be removed from the map and state.
 * @returns boolean - Returns true if the marker was found and removed, false if no marker was found for the given file name.
 */
function leaf_removeMapMarker(state, fileName) {
    /**
     * Removes a marker from the map based on fileName.
     * 
     * @param {Object} state - App state object containing markers map.
     * @param {string} fileName - The name of the file whose marker should be removed.
     * @returns {boolean} - True if marker was found and removed, false otherwise.
     */
    console.log('Attempting to remove marker for:', fileName);
    console.log('Available markers:', Object.keys(state.markers || {}));
    
    if (!state.markers || !state.markers[fileName]) {
        console.warn(`No marker found for file: ${fileName}`);
        return false;
    }

    // Remove marker from map (use removeFrom for compatibility)
    const marker = state.markers[fileName];
    if (state.map) {
        state.map.removeLayer(marker);
    }
    
    // Delete reference from state
    delete state.markers[fileName];
    
    console.log(`Marker removed for: ${fileName}`);
    return true;
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

module.exports = {
    loadSideBar_Glider,
    dom_createElm_GliderListItem,
    dom_clearElementInnerHTML_UsingString,
    dom_clearElementInnerHTML_UsingObject,
    showLoadingScreen,
    hideLoadingScreen,
    displayDatasetInfo,
    leaf_insertDataMarker,
    leaf_buildPopupContent,
    leaf_removeMapMarker,
    dom_removeSidebarEntry,
    dom_SetElementInnerHTML_UsingString,
    dom_SetElementInnerHTML_UsingObject,
    getSidebarEntryObjectFromFileName
};
