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

const GraphType = Object.freeze({
    ns: "nanoseconds",
    ms: "milliseconds",
    s: "seconds",
    m: "minutes",
    h: "hours",
    d: "days"
});

module.exports = {
    GraphType
};

