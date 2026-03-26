class DataFile {
    constructor(params = {}) {
        this.fileName = params.fileName;
        this.fileExtension = params.fileExtension;
        this.filePath = params.filePath;
        this.fileSize = params.fileSize;

        this.data = null
    }

    async load() { // this stores the data into the object
        if (!this._data) { 
            const text = await 
            fs.promises.readFile(this.filePath, "utf8"); 
            this._data = parseCDL(text); 
        } 
        return this._data; 
    }

    deleteFile() {
        console.log("|DEL|")
    }

    duplicateFile() {
        console.log("|DUP|")
    }

    addData() {
        console.log("|Add|")
    }

    removeData() {
        console.log("|Remove|")
    }

    updateData() {
        console.log("|Update|")
    }
}

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

class ViewSettings {
    constructor(params = {}) {

    }
}

const GraphType = Object.freeze({
    ns: "nanoseconds",
    ms: "milliseconds",
    s: "seconds",
    m: "minuets",
    h: "hours",
    d: "days"
});

// this needs to be fleshed out, but you get the point
const dataViewAxisSetting = {
    axis : "x",
    MappedDataFileVariable : "Salinity",
    minRange: 0,
    maxRange: 100
}
const dataViewSettings = {
    viewName : "Salinity and SSP",
    dataFilePath : "C:/",
    graphType : "SimpleChart",
    XAxisSettings : dataViewAxisSetting, // obviously replace these later with an instance
    YAxisSettings : dataViewAxisSetting, //
    dataViewAdditionalSettings: [
    "Snappy",
    "DarkTheme",
    "HighlightSelected"
    ]
}
console.log(dataViewSettings);



const df = new DataFile(
    {
        fileName: "dataTest",
        fileExtension: ".nc",
        filePath: "C:/",
        fileSize: 194053        
    });

df.addData();
df.removeData();
df.updateData();
df.duplicateFile();
df.deleteFile();

// for i in allFiles
//    fileArray.append(new DataFile())

module.exports = {
    GraphType
};
