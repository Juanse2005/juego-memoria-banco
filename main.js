const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: true,
    fullscreenable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  win.loadFile('index.html');
}


app.whenReady().then(() => {
  const expirationDate = new Date('2025-06-29');
  const now = new Date();

  if (now > expirationDate) {
    dialog.showErrorBox(
      'Juego expirado',
      'Este juego ya no está disponible. Contacta con el desarrollador.'
    );
    app.quit();
    return;
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Salir completamente si todas las ventanas están cerradas (menos en macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
