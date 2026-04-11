const { getTimestamp } = require("./basicFunctions");
const fs = require('fs');
const path = require('path');
const config = require('./config');

let currentLogRef = null;
function refLog() {return currentLogRef;}
function setLog(value) {currentLogRef = value;}


function startLog() {
      
}

function log(params = {}) {
    // params: msg, msgLabel, seriousness, code, ignoreConsole, ignorePopup, ignoreNotification, ignoreLogging
    // (msgLabel, mag, class)
    if (!("ignoreConsole" in params)) {params.ignoreConsole = true;}
    if (!("ignorePopup" in params)) {params.ignorePopup = true;}
    if (!("ignoreNotification" in params)) {params.ignoreNotification = true;}
    if (!("ignoreLogging" in params)) {params.ignoreLogging = true;}

    if (!("seriousness" in params)) {params.seriousness = "info";}
    if (!("msgLabel" in params)) {params.msgLabel = "Message";}

    forceIgnore = function() {params.ignorePopup = true;params.ignoreNotification = true;};
    const state = params.state ?? forceIgnore();
    const dep = params.dep ?? null;
    if (dep){let {popup, DOM} = dep ?? null;}

    
    content = buildLogMessage(params);
    

    contentArrangement1 = `${content.timestamp} | ${content.callerInfo[0]}-${content.callerInfo[1]} [S:${content.seriousnessFormatted}] [C:${content.class}] [ID:${content.code}]
    | ${content.label}
    | ${content.message}`

    if (!params.ignoreConsole){
        if(config.get('debug', 'enableDebug')){
            switch (params.seriousness) {
                case "info":
                    console.log(contentArrangement1);
                    break;
                case "warning":
                    console.warn(contentArrangement1);
                    break;
                case "error":
                    console.error(contentArrangement1);
                    break;
                }
        }
    }
    if (!params.ignorePopup){
        let temp = new popup.NotificationPopup(
                    {   // probably dont need this line 
                        notificationType: content.seriousness,
                    },
                    {
                        title: content.label,
                        content: content.message,
                    },
                    {
                        onClose: function() {
                            //
                        }
                    },
                    {
                        isFullscreen: false,
                        width: "30%",
                        height: "30%"
                    }
                );
        temp.open();
    }
    if (!params.ignoreNotification){
        DOM.postNotification(state, {
            notificationLabel: content.label,
            notificationType: content.seriousness,
            content: content.message,
            code: content.code
        });
    }
    if (!params.ignoreLogging){
        if(config.get('debug', 'enableDebug')){
            writeToLogFile(contentArrangement1);
        }
    }
}

function buildLogMessage(params = {}) {
    let timestamp = getTimestamp({ "short": true });
    let seriousnessFormatted = null;

    switch (params.seriousness) {
                case "info":
                    seriousnessFormatted = 0;
                    break;
                case "warning":
                    seriousnessFormatted = 1;
                    break;
                case "error":
                    seriousnessFormatted = 2;
                    break;
            }

    return {
        ...params,
        timestamp: timestamp,
        label: params.msgLabel || "Default Label",
        seriousness: params.seriousness || "info",
        seriousnessFormatted: seriousnessFormatted,
        message: params.msg || "No message provided",
        code: params.code || "0000",
        class: params.class || "(n/a)",
        callerInfo: params.callerInfo
    };
}

function createLogFile(fileName = 'log.txt', directory = './logs') {
    // Sanitize the file name to remove invalid characters
    fileName = fileName.replace(/[:*?"<>|]/g, '_');

    // Ensure the directory exists
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }

    // Correct the file path construction
    const filePath = path.join(directory, fileName);

    // Create the file if it doesn't exist
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '', 'utf8');
    }

    // Return the file reference
    setLog(fs.createWriteStream(filePath, { flags: 'a' }));
    return refLog();
}

function writeToLogFile(input) {
    const logRef = refLog();
    if (logRef) {
        logRef.write(input + '\n\n');
    } else {
        console.error('Log file reference is not set. Call createLogFile() first.');
    }
}

module.exports = { 
    log,
    refLog,
    setLog,
    createLogFile };