const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

app.userAgentFallback = app.userAgentFallback.replace(/\s*Electron\/\S+/, '').replace(/\s*redstar-os\/\S+/i, '');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1180,
    height: 900,
    minWidth: 640,
    minHeight: 500,
    backgroundColor: '#111111',
    title: 'Red Star OS 3.0',
    icon: path.join(__dirname, 'icons', 'redstar.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
      autoplayPolicy: 'no-user-gesture-required',
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, 'index.html'));
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.on('web-contents-created', (_, contents) => {
  contents.on('will-attach-webview', (e, webPreferences) => {
    delete webPreferences.preload;
    webPreferences.nodeIntegration = false;
    webPreferences.contextIsolation = true;
  });
  if (contents.getType() === 'webview') {
    contents.setWindowOpenHandler(({ url }) => {
      if (win && !win.isDestroyed()) win.webContents.send('rs:open-tab', url);
      return { action: 'deny' };
    });
  }
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
