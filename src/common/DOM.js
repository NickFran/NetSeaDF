// DOM manipulation functions
const path = require('path');

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
            document.querySelector('.temp').style.display = 'block';
            
            // Set clicked li background
            li.style.backgroundColor = '#4a90e2';
            
            // const thisFilePath = path.join(savedDataPath, file);
            // console.log("Activating file:", thisFilePath);
            
            // Trigger the callback with the selected file
            if (onFileSelect) {
                onFileSelect(file);
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

function dom_clearElementInnerHTML_UsingString(elementIdString) {
    const element = document.getElementById(elementIdString);
    element.innerHTML = '';
}function dom_clearElementInnerHTML_UsingObject(elementObject) {
    elementObject.innerHTML = '';
}

module.exports = {
    loadSideBar_Glider,
    dom_createElm_GliderListItem,
    dom_clearElementInnerHTML_UsingString,
    dom_clearElementInnerHTML_UsingObject
};
