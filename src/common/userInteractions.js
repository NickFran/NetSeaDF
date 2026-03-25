const { app } = require("electron");







function userint_ToggleMarkerTimeline(state, dep, event) {
    // initialize dependencies 
    const {DOM, fileHandle, pathDep, basicFunctions} = dep;
    const file = event.target.dataset.markerDataFile;
    
        // init array that holds polylines (will update with more sophisticated structure later)
        const polyLineVerts = []

        // If already expanded, collapse and remove all instance markers
        if (state.markers[file].isExpanded) {
            let currentFileToRetract = fileHandle.getEntryInSimpleData(file);
            newPopupContent = DOM.leaf_buildPopupContent(currentFileToRetract, instance=false, buttonText="Show Timeline"); // rebuild main marker popup content to reflect collapsed state (e.g. remove instance-specific timestamp info)            
            document.getElementById("mapPopupButton").innerText = "Show Timeline";
            state.markers[file].marker.setPopupContent(newPopupContent);            
            
            DOM.leaf_removeMapMarker(state, file, instance=true);
            state.markers[file].isExpanded = false; // set marker state to not expanded
            state.markers[file].expandedInstances = []; // clear expanded instances array
            state.markers[file].additionalInstances.polyLines = []; 
            state.markers[file].additionalInstances.Numbers = []; 

        // in not, expand and add instance markers for each additional coordinate pair
        } else {
            let currentFileToExpand = fileHandle.getEntryInSimpleData(file);
            newPopupContent = DOM.leaf_buildPopupContent(currentFileToExpand, instance=false, buttonText="Hide Timeline"); // rebuild main marker popup content to reflect expanded state (e.g. remove instance-specific timestamp info)            
            document.getElementById("mapPopupButton").innerText = "Hide Timeline";
            state.markers[file].marker.setPopupContent(newPopupContent);
            
            // Add first coordinate pair to polyline vertices
            polyLineVerts.push([currentFileToExpand.coords[0].lat, currentFileToExpand.coords[0].lon]);
            for (coordPair in currentFileToExpand.coords) {
                if (coordPair == 0) continue; // skip first coord pair since it's already represented by the main marker and we want to avoid duplicate markers and popups for the first instance

                console.log(`
                Expanding marker for file: ${currentFileToExpand.fileName}
                [index]: ${coordPair}
                Time: ${currentFileToExpand.timestamps["formatted"][coordPair]}
                Lat: ${currentFileToExpand.coords[coordPair].lat} 
                Lon: ${currentFileToExpand.coords[coordPair].lon}
                `);
                


                // current coord pair instance
                latNlon = [currentFileToExpand.coords[coordPair].lat, currentFileToExpand.coords[coordPair].lon];
                let previousCoordPair = [currentFileToExpand.coords[coordPair-1].lat, currentFileToExpand.coords[coordPair-1].lon];
                let currentCoordPair = latNlon;
                const polyline = L.polyline([previousCoordPair, currentCoordPair], {
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



                let instancePopupContent = DOM.leaf_buildPopupContent(currentFileToExpand, instance=coordPair);
                DOM.leaf_insertDataMarker(state, ModuleDependencies["DOM"], latNlon[0], latNlon[1], instancePopupContent, {}, currentFileToExpand.fileName, instance=true);
                state.markers[file].isExpanded = true; // set marker state to expanded
                
                // init instance number (string for marker icon)
                DOM.leaf_addPolyNumberToMap(state, file, latNlon, coordPair);

                //underIceFlags
                // currentFileToExpand.timestamps["ms"][coordPair]
                // currentFileToExpand.timestamps["ms"][coordPair - 1]
                
            }
            
            
        
        }
}

module.exports = {
    userint_ToggleMarkerTimeline
};