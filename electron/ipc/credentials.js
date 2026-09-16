const { safeStorage, app } = require('electron')
const fs = require('fs')
const path = require('path')

function credentialsPath() {
  return path.join(app.getPath('userData'), 'credentials.enc')
}

function registerCredentialsHandlers(ipcMain) {
  ipcMain.handle('credentials:save', (_event, { email, password }) => {
    if (!safeStorage.isEncryptionAvailable()) return { ok: false }
    const encrypted = safeStorage.encryptString(JSON.stringify({ email, password }))
    fs.writeFileSync(credentialsPath(), encrypted)
    return { ok: true }
  })

  ipcMain.handle('credentials:load', () => {
    try {
      if (!safeStorage.isEncryptionAvailable()) return null
      const encrypted = fs.readFileSync(credentialsPath())
      return JSON.parse(safeStorage.decryptString(encrypted))
    } catch {
      return null
    }
  })

  ipcMain.handle('credentials:clear', () => {
    try {
      fs.unlinkSync(credentialsPath())
    } catch {
      // no-op: nothing saved to clear
    }
    return { ok: true }
  })
}

module.exports = { registerCredentialsHandlers }
