const path = require('node:path');
const os = require('node:os');
const { app, BrowserWindow, session } = require('electron');
const { default: installExtension, REACT_DEVELOPER_TOOLS } = require('electron-devtools-installer');
const isDev = require('electron-is-dev');

const reactDevToolsPath = path.join(
  os.homedir(),
  '.config/google-chrome/Default/Extensions/fmkadmapgofadopljbjfkapdkoienihi/4.28.5_1'
)

let win;
app.disableHardwareAcceleration();
function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 800,
    height: 600,
    center: true,
    icon: path.join(__dirname, 'windows/icon70.png'),
    webPreferences: {
      nodeIntegration: true,
      devTools: isDev,
    },
  });
  win.maximize();
  win.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );
  // Open the DevTools.
  return win;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  if (isDev) {
    session.defaultSession.loadExtension(reactDevToolsPath).then((data) => {
      installExtension()
      createWindow();
      win.webContents.openDevTools({ mode: 'right'});
    })
  }
  //installExtension(REACT_DEVELOPER_TOOLS);
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

//app.commandLine.appendSwitch('js-flags', '--expose_gc --max-old-space-size=128')
