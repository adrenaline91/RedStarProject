const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('rsElectron', {
  onOpenTab: cb => ipcRenderer.on('rs:open-tab', (_, url) => cb(url))
});
