console.log("PRELOADED: ", __dirname);

const { ipcRenderer } = require('electron');

ipcRenderer.on('menu-transfer-data', () => {
	if (typeof window.handleTransferDataMenuClick === 'function') {
		window.handleTransferDataMenuClick();
		return;
	}

	window.__pendingTransferDataMenuClick = true;
});
