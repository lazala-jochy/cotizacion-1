const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const path = require('path')
const { registerPdfHandlers } = require('./ipc/pdf')
const { registerFileHandlers } = require('./ipc/files')
const { registerCredentialsHandlers } = require('./ipc/credentials')
const { initAutoUpdater } = require('./updater')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  const isDev = !app.isPackaged
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

function setupMenu() {
  const isMac = process.platform === 'darwin'
  const template = isMac
    ? [{ role: 'appMenu' }, { role: 'editMenu' }, { role: 'viewMenu' }]
    : [{ role: 'editMenu' }, { role: 'viewMenu' }]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

app.whenReady().then(() => {
  registerPdfHandlers(ipcMain)
  registerFileHandlers(ipcMain)
  registerCredentialsHandlers(ipcMain)

  setupMenu()
  createWindow()
  initAutoUpdater(mainWindow)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
