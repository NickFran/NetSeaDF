console.log("PRELOADED: ", __dirname);

const { ipcRenderer } = require('electron');

window.transferApi = {
	exportData(transferOptions) {
		return ipcRenderer.invoke('transfer-export-data', transferOptions);
	}
};

ipcRenderer.on('menu-transfer-data', () => {
	if (typeof window.handleTransferDataMenuClick === 'function') {
		window.handleTransferDataMenuClick();
		return;
	}

	window.__pendingTransferDataMenuClick = true;
});

ipcRenderer.on('menu-import-transfer-data', () => {
	if (typeof window.handleImportTransferredDataMenuClick === 'function') {
		window.handleImportTransferredDataMenuClick();
		return;
	}

	window.__pendingImportTransferredDataMenuClick = true;
});

ipcRenderer.on('menu-import-transfer-package-selected', (_, payload) => {
	if (typeof window.handleImportTransferredPackageSelected === 'function') {
		window.handleImportTransferredPackageSelected(payload?.filePath || null);
		return;
	}

	window.__pendingImportTransferredPackagePath = payload?.filePath || null;
});

ipcRenderer.on('menu-import-transfer-data-error', (_, payload) => {
	if (typeof window.handleImportTransferredDataError === 'function') {
		window.handleImportTransferredDataError(payload?.error || 'Unknown import error.');
		return;
	}

	window.__pendingImportTransferredDataError = payload?.error || 'Unknown import error.';
});

