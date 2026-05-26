const { app } = require("electron");
const objects = require('./objects');







function userint_ToggleMarkerTimeline(state, dep, event) {
    // initialize dependencies 
    const {DOM, fileHandle, pathDep, basicFunctions} = dep;
    const file = event.target.dataset.markerDataFile;
    
        // init array that holds polylines (will update with more sophisticated structure later)
        const polyLineVerts = []

        // If already expanded, collapse and remove all instance markers
        if (state.markers[file].isExpanded) {
            let currentFileToRetract = fileHandle.getEntryInSimpleData(file);
            newPopupContent = DOM.leaf_buildPopupContent(currentFileToRetract, false, "Show Profile Timeline", false, ModuleDependencies["DOM"].config); // pass config
            if (event.target && event.target.classList.contains('mapPopupButton')) {
                event.target.innerText = "Show Profile Timeline";
            }
            state.markers[file].marker.setPopupContent(newPopupContent);            
            
            DOM.leaf_removeMapMarker(state, file, instance=true);
            state.markers[file].isExpanded = false; // set marker state to not expanded
            state.markers[file].expandedInstances = []; // clear expanded instances array
            state.markers[file].additionalInstances.polyLines = [];
            state.markers[file].additionalInstances.Numbers = [];
            state.markers[file].additionalInstances.UnderIceFlags = [];
            state.markers[file].TimestampFlags.TimestampFlagDifferences = [];

        // in not, expand and add instance markers for each additional coordinate pair
        } else {
            let currentFileToExpand = fileHandle.getEntryInSimpleData(file);
            newPopupContent = DOM.leaf_buildPopupContent(currentFileToExpand, false, "Hide Profile Timeline", false, ModuleDependencies["DOM"].config); // pass config
            if (event.target && event.target.classList.contains('mapPopupButton')) {
                event.target.innerText = "Hide Profile Timeline";
            }
            state.markers[file].marker.setPopupContent(newPopupContent);
            
            // Add first coordinate pair to polyline vertices
            polyLineVerts.push([currentFileToExpand.coords[0].lat, currentFileToExpand.coords[0].lon]);
            for (coordPair in currentFileToExpand.coords) {
                if (coordPair == 0) continue; // skip first coord pair since it's already represented by the main marker and we want to avoid duplicate markers and popups for the first instance

                // current coord pair instance
                latNlon = [currentFileToExpand.coords[coordPair].lat, currentFileToExpand.coords[coordPair].lon];
                let previousCoordPair = [currentFileToExpand.coords[coordPair-1].lat, currentFileToExpand.coords[coordPair-1].lon];
                let currentCoordPair = latNlon;

                // polyline instance
                let polyLineInstance = DOM.leaf_addPolyLineToMap(state, currentFileToExpand.fileName, previousCoordPair, currentCoordPair);
                
                // marker instance
                let instancePopupContent = DOM.leaf_buildPopupContent(currentFileToExpand, coordPair, null, false, ModuleDependencies["DOM"].config);
                DOM.leaf_insertDataMarker(state, ModuleDependencies["DOM"], latNlon[0], latNlon[1], instancePopupContent, {}, currentFileToExpand.fileName, instance=true);
                state.markers[file].isExpanded = true; // set marker state to expanded
                
                // instance number
                DOM.leaf_addPolyNumberToMap(state, file, latNlon, coordPair);

                //underIceFlags
                let a = currentFileToExpand.timestamps["ms"][coordPair]
                let aform = currentFileToExpand.timestamps["formatted"][coordPair]
                let b = currentFileToExpand.timestamps["ms"][coordPair - 1]
                let bform = currentFileToExpand.timestamps["formatted"][coordPair - 1]
                let c = a - b
                const days = c / (1000 * 1000 * 1000 * 60 * 60 * 24)

                let timestampInstancesDiff = basicFunctions.getTimestampDifference(a, b, importFormat="ms", returnType=objects.GraphType.d);
                
                if (timestampInstancesDiff > config.get("basics", "MaxTimeTillUnderIceFlag")) { // default to 200 for debugging, 
                    state.markers[file].TimestampFlags.TimestampFlagDifferences.push(timestampInstancesDiff);
                    polyLineInstance.setStyle({ color: 'red' });
                    
                    let instancePopupContent = DOM.leaf_buildPopupContent(currentFileToExpand, true, null, `
                        <h4>Under Ice Flag</h4>
                        <p><span class="cRed bold">This platforms deployment might have gone under ice</span></p>
                        <br>
                        <p><span class="cRed bold">${Number(timestampInstancesDiff).toFixed(2)}</span> days Elapsed between timestamp <span class="cBlue bold">[${coordPair-1}] (${bform})</span> and timestamp <span class="cBlue bold">[${coordPair}] (${aform})</span>.</p>
                    `);
                    if (
                    typeof latNlon[0] === 'number' && !isNaN(latNlon[0]) &&
                    typeof latNlon[1] === 'number' && !isNaN(latNlon[1])
                    ) {
                    
                    let InbetweenCoords = basicFunctions.getInbetweenCoords(previousCoordPair, currentCoordPair, .5);
                    let FlagInstance = DOM.leaf_insertDataMarker(state, ModuleDependencies["DOM"], InbetweenCoords.lat, InbetweenCoords.lon, instancePopupContent, {}, currentFileToExpand.fileName, instance=true, customImage="timeFlag.png");
                    //state.markers[file].additionalInstances.UnderIceFlags.push(FlagInstance); 
                    } else {
                    console.error('Invalid coordinates:', latNlon);
                    }
                } else {
                    state.markers[file].TimestampFlags.TimestampFlagDifferences.push(NaN);
                }
            }
        }
}

function userint_focusOnMarker(state) {
        if (Array.from(state.selectedFiles).length === 0){
        console.warn('No file selected, cannot focus marker');
        return;
    } else {
        let focusedFile = null;

        if(state.isMultiSelect){
            focusedFile = Array.from(state.allFiles)[state.currentFileIndexTarget];
        } else {
            focusedFile = Array.from(state.selectedFiles)[0];
        }

        console.log(state.currentFileIndexTarget);    
        console.log(focusedFile); 

        focusedEntry = fileHandle.getEntryInSimpleData(focusedFile);
        focusedEntryCoords = focusedEntry.coords[0];
        let lat = focusedEntryCoords.lat;
        let lon = focusedEntryCoords.lon;
        let zoomLevel = 6;
        
        //state.map.setView([lat, lon], zoomLevel);
        state.map.panTo([lat, lon]);
    }

    
}

async function userint_deleteFileButton(state, dep) {
    const dep_userint = dep["userInteractions"];
    const {DOM, fileHandle, pathDep, basicFunctions} = dep_userint;
    const deletePlatformsButton = document.getElementById('deletePlatformsSummaryButton');

    const filesToDelete = Array.from(state.selectedFiles);
        if (filesToDelete.length === 0) return;
        console.log(`Delete button clicked, ${filesToDelete.length} file(s) selected`);
        // Add all selected files to the remove queue
        queue.addToRemoveQeue(filesToDelete);
        console.log(`Remove queue populated with ${filesToDelete.length} file(s)`);
        DOM.showLoadingScreen();
        await fileHandle.processRemoveQeue(state, dep["queue"]);
        state.allFiles = fileHandle.listSavedDataFiles(
            pathDep.resolveToProperDataPath(__dirname, 'savedData'), 
            '.nc'
        );
        console.log('All queued deletions complete');
        DOM.dom_clearElementInnerHTML_UsingString("datasetInfoCardWrapper");
        DOM.dom_clearElementInnerHTML_UsingString('datasetAttrCardWrapper');
        DOM.dom_clearElementInnerHTML_UsingString('datasetVarsCardWrapper');
        document.getElementById('titleTargetFile').textContent = `Data`;
        state.selectedFiles = new Set();
        state.isMultiSelect = false;
        if (deletePlatformsButton) {
            deletePlatformsButton.style.backgroundColor = '';
        }
        //DOM.dom_SetElementInnerHTML_UsingString("dataFileHeader", "(Click on a data file to view)");
        DOM.hideLoadingScreen();
}

function userint_pressBackArrow(state, dep) {
        const dep_userint = dep["userInteractions"];
        const {DOM, fileHandle, pathDep, basicFunctions} = dep_userint;

        let nextIndex;
        console.log("Back arrow clicked");
        if (Array.from(state.selectedFiles).length === 0) {
            console.log("No file selected, ignoring back arrow click");
            return;
        } else {
            nextIndex = basicFunctions.getNextIndex(state.currentFileIndexTarget, Array.from(state.selectedFiles).length, 'back');
            state.currentFileIndexTarget = nextIndex;
            console.log("Next index:", nextIndex);
            DOM.displayDatasetInfo(state, dep["DOM"], Array.from(state.selectedFiles)[state.currentFileIndexTarget]);
        }
}

function userint_pressForwardArrow(state, dep) {
        const dep_userint = dep["userInteractions"];
        const {DOM, fileHandle, pathDep, basicFunctions} = dep_userint;

        let nextIndex;
        console.log("Forward arrow clicked");
        if (Array.from(state.selectedFiles).length === 0) {
            console.log("No file selected, ignoring forward arrow click");
            return;
        } else {
            nextIndex = basicFunctions.getNextIndex(state.currentFileIndexTarget, Array.from(state.selectedFiles).length, 'forward');
            state.currentFileIndexTarget = nextIndex;
            console.log("Next index:", nextIndex);
            DOM.displayDatasetInfo(state, dep["DOM"], Array.from(state.selectedFiles)[state.currentFileIndexTarget]);
        }    
}

module.exports = {
    userint_ToggleMarkerTimeline,
    userint_focusOnMarker,
    userint_deleteFileButton,
    userint_pressBackArrow,
    userint_pressForwardArrow
};