console.log("Working");

const { create } = require('domain');
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;
const path = require('path');
const url = require('url');

// more secure
// electron.ipcMain.handle("test-thing", async (_, msg) => {
//     console.log(`Test Message ${msg}`)
// })

let win;

function createWindow() {
    win = new BrowserWindow({ 
        width: 1920, height: 1080,
        //autoHideMenuBar: true,  // Hide menu bar
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, "common", "preload.js")
        }
    });
    
    // Create menu with Transfer option
    const menuTemplate = [
        {
            label: 'File',
            submenu: [
                { role: 'quit' }
            ]
        },
        {
            label: 'Transfer',
            submenu: [
                {
                    label: 'Transfer Data',
                    click: () => {
                        console.log('Transfer clicked');
                        // Add your transfer logic here
                    }
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'toggleDevTools' }
            ]
        }
    ];
    
    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
    
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'map.html'),
        //pathname: path.join(__dirname, 'unitTests', 'testOfMeans', 'means.html'),
        //pathname: path.join(__dirname, 'unitTests', 'echartsTesting', 'eTestExp.html'),
        protocol: 'file:',
        slashes: true
    }));
    // win.webContents.openDevTools();
    win.on('closed', () => {
        win = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (win === null) {
        createWindow();
    }
});

process.stdout.write("hello: ");