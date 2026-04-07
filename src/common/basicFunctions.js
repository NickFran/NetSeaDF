const objects = require('./objects');

function clamp(value, min, max) {
  if (value > max) return max;
  if (value < min) return min;
  return value;
}

function getNextIndex(currentIndex, arrayLength, direction) {
    if (direction === 'forward') {
        // Go to next, wrap to 0 if at end
        return (currentIndex + 1) % arrayLength;
    } else if (direction === 'back') {
        // Go to previous, wrap to last if at start
        return (currentIndex - 1 + arrayLength) % arrayLength;
    }
    return currentIndex; // fallback
}

function getInbetweenCoords(coord1, coord2, fraction) {
    console.log(`Calculating in-between coordinates with fraction ${fraction} between:`, coord1, coord2);
    const lat = coord1[0] + (coord2[0] - coord1[0]) * fraction;
    const lon = coord1[1] + (coord2[1] - coord1[1]) * fraction;
    return {lat, lon};
}

function format24hr(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function format12hr(date) {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${ampm}`;
}

function getTimestampDifference(timestamp1, timestamp2, importFormat, returnType) {
    let ts1 = null;
    let ts2 = null;
    let diff = null;
    let result = null;

    if (importFormat === 'formatted') {
        const ts1 = new Date(timestamp1);
        const ts2 = new Date(timestamp2);
        diff = Math.abs(ts1 - ts2);
        result = diff; // default to days

    } else if (importFormat === 'ms') {
        ts1 = timestamp1;
        ts2 = timestamp2;
        diff = Math.abs(ts1 - ts2);

        switch (returnType) {
        case objects.GraphType.d:
            result = diff / (1e9 * 60 * 60 * 24);
            break;
        case objects.GraphType.h:
            result = diff / (1e9 * 60 * 60);
            break;
        case objects.GraphType.m:
            result = diff / (1e9 * 60);
            break;
        case objects.GraphType.ms:
            result = diff / 1e9;
            break;
        default:
            result = diff;
        }
    } else {    
        console.error("Unsupported format for timestamp difference calculation");
        return null;
    }
    return result;
}

function PlatformsMapToFuncsIfNameMatchFound(state, collection, functionName, elseFunction) { // leaving this for now, but this approach doesnt work because the call doesnt have access to item object
    const gliderList = document.getElementById('GliderList');
    if (!gliderList) {
        console.error('GliderList element not found');
        return false;
    }

    // Find all list items in the GliderList
    const listItems = gliderList.querySelectorAll('li');

    // Find the item with matching textContent and remove it
    for (const item of listItems) {
        if (collection.has(item.textContent)) {
            functionName(state);
        } else {
            elseFunction(state);
        }
    }
}

function getNotificationsMaxSeriousness() {
    return this.notificationsSeriousnessArray.length
        ? Math.max(...this.notificationsSeriousnessArray)
        : 0;
}

module.exports = { 
    clamp, 
    getNextIndex, 
    getInbetweenCoords, 
    format24hr, 
    format12hr, 
    getTimestampDifference,
    getNotificationsMaxSeriousness
};
