const { app, BrowserWindow, shell, Tray, Menu } = require('electron');
const path = require('path');

// Disable Chromium background/phone-home features
app.commandLine.appendSwitch('disable-background-networking');
app.commandLine.appendSwitch('disable-component-update');
app.commandLine.appendSwitch('disable-domain-reliability');
app.commandLine.appendSwitch('disable-features', 'OptimizationHints,MediaRouter,Translate');
app.commandLine.appendSwitch('no-pings');

// Correct taskbar icon/grouping on Windows
app.setAppUserModelId('com.local.twitch');

let win = null;
let tray = null;

// Only one instance at a time; a second launch just restores the first
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', showWindow);
  app.whenReady().then(() => {
    createWindow();
    createTray();
  });
}

function showWindow() {
  if (!win) return;
  win.show();
  if (win.isMinimized()) win.restore();
  win.focus();
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Twitch',
    icon: path.join(__dirname, 'icon.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  // Keep the window title fixed as "Twitch"
  win.on('page-title-updated', (e) => e.preventDefault());

  // Minimize sends the window to the tray
  win.on('minimize', (e) => {
    e.preventDefault();
    win.hide();
  });

  win.loadURL('https://www.twitch.tv');

  // Open non-Twitch links in the default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    const host = new URL(url).hostname;
    if (host.endsWith('twitch.tv')) return { action: 'allow' };
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'icon.ico'));
  tray.setToolTip('Twitch');

  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show Twitch', click: showWindow },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]));

  // Left-click toggles the window
  tray.on('click', () => {
    if (win.isVisible()) win.hide();
    else showWindow();
  });
}

app.on('window-all-closed', () => app.quit());
