console.log("Working");

const { create } = require('domain');
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;
const dialog = electron.dialog;
const ipcMain = electron.ipcMain;
const path = require('path');
const url = require('url');
const transfer = require('./common/transfer.js');

// more secure
// electron.ipcMain.handle("test-thing", async (_, msg) => {
//     console.log(`Test Message ${msg}`)
// })

let win;

ipcMain.handle('transfer-export-data', async (event, transferOptions) => {
    try {
        const targetWindow = BrowserWindow.fromWebContents(event.sender);
        const pickerResult = await dialog.showOpenDialog(targetWindow, {
            title: 'Choose Export Folder',
            buttonLabel: 'Export Here',
            properties: ['openDirectory', 'createDirectory']
        });

        if (pickerResult.canceled || pickerResult.filePaths.length === 0) {
            return {
                success: false,
                canceled: true
            };
        }

        const exportResult = await transfer.createTransferArchive(
            transferOptions,
            pickerResult.filePaths[0],
            app.getVersion()
        );

        return exportResult;
    } catch (error) {
        console.error('Transfer export failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
});

ipcMain.handle('transfer-select-import-package', async (event) => {
    try {
        const targetWindow = BrowserWindow.fromWebContents(event.sender);
        const pickerResult = await dialog.showOpenDialog(targetWindow, {
            title: 'Choose Transfer Package',
            buttonLabel: 'Import Package',
            properties: ['openFile'],
            filters: [
                {
                    name: 'NetSeaDF Transfer Packages',
                    extensions: ['zip']
                }
            ]
        });

        if (pickerResult.canceled || pickerResult.filePaths.length === 0) {
            return {
                success: false,
                canceled: true
            };
        }

        return {
            success: true,
            filePath: pickerResult.filePaths[0]
        };
    } catch (error) {
        console.error('Transfer package selection failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
});

async function promptForImportPackage(targetWindow) {
    const pickerResult = await dialog.showOpenDialog(targetWindow, {
        title: 'Choose Transfer Package',
        buttonLabel: 'Import Package',
        properties: ['openFile'],
        filters: [
            {
                name: 'NetSeaDF Transfer Packages',
                extensions: ['zip']
            }
        ]
    });

    if (pickerResult.canceled || pickerResult.filePaths.length === 0) {
        return null;
    }

    return pickerResult.filePaths[0];
}

function sendRendererEvent(channel, payload = null) {
    if (!win || win.isDestroyed()) {
        console.warn(`Cannot send renderer event "${channel}" because the window is unavailable.`);
        return;
    }

    if (win.webContents.isLoading()) {
        win.webContents.once('did-finish-load', () => {
            win.webContents.send(channel, payload);
        });
        return;
    }

    win.webContents.send(channel, payload);
}

function createWindow() {
    win = new BrowserWindow({ 
        width: 1920, height: 1080,
        //autoHideMenuBar: true,  // Hide menu bar
        icon: process.platform === 'darwin'
            ? path.join(__dirname, 'build', 'icon.icns')
            : path.join(__dirname, 'build', 'icon.ico'),
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
                        sendRendererEvent('menu-transfer-data');
                    }
                },
                {
                    label: 'Import Transferred Data',
                    click: async () => {
                        console.log('Import clicked');
                        try {
                            const selectedPackagePath = await promptForImportPackage(win);
                            if (!selectedPackagePath) {
                                return;
                            }

                            sendRendererEvent('menu-import-transfer-package-selected', {
                                filePath: selectedPackagePath
                            });
                        } catch (error) {
                            console.error('Import package selection failed:', error);
                            sendRendererEvent('menu-import-transfer-data-error', {
                                error: error.message
                            });
                        }
                    }
                }
            ]
        },
        {
            label: 'Tools',
            submenu: [
                {
                    label: 'Clean Up References',
                    click: () => {
                        sendRendererEvent('menu-tools-clean-up-references');
                    }
                },
                {
                    label: 'Log Application PATH',
                    click: () => {
                        sendRendererEvent('menu-tools-log-application-path');
                    }
                },
                {
                    label: 'Log AppState',
                    click: () => {
                        sendRendererEvent('menu-tools-log-app-state');
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