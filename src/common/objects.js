class DataView {
    constructor(params = {}) {
        this.graphType = params.graphType;
        this.isStored = params.isStored;
        //?
        
        //Generate UUID for Data
        if (params.isStored) {
            this.uuid = params.uuid;
        } else {
            this.uuid = crypto.randomUUID();
        }
    }

    saveToJSON() {
        // save contents to JSON to store for later loading
        
        // one option is to return a struct of its data, which JS can then save in a JSON file.
    }
}

const varPossibilities = Object.freeze({
    "temperature": ["temperature", "temp", "t", "TEMP", "TEMP_ADJUSTED"],
    "pressure": ["pressure", "pres", "p", "PRES", "PRES_ADJUSTED"],
    "salinity": ["salinity", "psal", "sal", "s", "PSAL", "PSAL_ADJUSTED"],
    "humidity": ["humidity", "hum", "h"],
    // Add more variables and their possible names here
});

const GraphType = Object.freeze({
    ns: "nanoseconds",
    ms: "milliseconds",
    s: "seconds",
    m: "minutes",
    h: "hours",
    d: "days"
});

module.exports = {
    varPossibilities,
    GraphType
};

