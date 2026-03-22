const { app } = require("electron");







function userint_ToggleMarkerTimeline(state, dep, event) {
    // initialize dependencies 
    const {DOM, fileHandle, pathDep} = dep;
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
                let instancePopupContent = DOM.leaf_buildPopupContent(currentFileToExpand, instance=coordPair);
                DOM.leaf_insertDataMarker(state, ModuleDependencies["DOM"], latNlon[0], latNlon[1], instancePopupContent, {}, currentFileToExpand.fileName, instance=true);
                state.markers[file].isExpanded = true; // set marker state to expanded
                polyLineVerts.push(latNlon); // add new coordinate pair to polyline array
                
                // init instance number (string for marker icon)
                const numberIcon = L.divIcon({
                className: 'number-icon',
                html: `<div style="font-size:16px;font-weight:bold;color:#fff;border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;">${coordPair}</div>`,
                iconSize: [1, 1],
                iconAnchor: [16, 30]
                });

                // Add number icon marker to map
                let instanceNumber = L.marker(latNlon, { icon: numberIcon })
                instanceNumber.addTo(state.map);
                appState.markers[file].additionalInstances.Numbers.push(instanceNumber); // store instance marker reference for later removal when collapsing
            }

            console.log(`Marker for file ${file} expanded with ${currentFileToExpand.coords.length - 1} instance(s)`);
        
            // establish polyline connecting all coordinate pairs for this marker
            const latlngs = polyLineVerts;
            const polyline = L.polyline(latlngs, {
                    color: 'blue',
                    weight: 3,
                    opacity: 0.8,
                    dashArray: '10, 5',
                    lineCap: 'round',
                    lineJoin: 'round'
            });
            // add new line to map
            polyline.addTo(state.map);
            appState.markers[file].additionalInstances.polyLines.push(polyline);
        }
}

module.exports = {
    userint_ToggleMarkerTimeline
};