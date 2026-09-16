const { dialog, app } = require('electron')
const path = require('path')
const fs = require('fs')
const { logoToDataUri } = require('../logoUtils')

function registerFileHandlers(ipcMain) {
  ipcMain.handle('files:pickLogo', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Selecciona el logo de la empresa',
      filters: [{ name: 'Imágenes', extensions: ['png', 'jpg', 'jpeg'] }],
      properties: ['openFile']
    })
    if (result.canceled || result.filePaths.length === 0) return null

    const sourcePath = result.filePaths[0]
    const ext = path.extname(sourcePath)
    const assetsDir = path.join(app.getPath('userData'), 'assets')
    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true })
    const destPath = path.join(assetsDir, `logo${ext}`)
    fs.copyFileSync(sourcePath, destPath)
    return { path: destPath, dataUri: logoToDataUri(destPath) }
  })

  ipcMain.handle('files:getLogoDataUri', (_event, logoPath) => logoToDataUri(logoPath))
}

module.exports = { registerFileHandlers }
