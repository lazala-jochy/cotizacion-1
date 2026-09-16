const { app, dialog, shell } = require('electron')

const REPO_OWNER = 'lazala-jochy'
const REPO_NAME = 'cotizacion-1'

async function checkMacUpdateManually(mainWindow) {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`)
    if (!res.ok) return
    const data = await res.json()
    const latest = (data.tag_name || '').replace(/^v/, '')
    const current = app.getVersion()
    if (!latest || latest === current) return

    const { response } = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Actualización disponible',
      message: `Hay una nueva versión de Cotizador (${latest}). Tu versión actual es ${current}.`,
      detail: 'En Mac, la actualización no es automática: descarga el instalador y ábrelo para actualizar.',
      buttons: ['Descargar', 'Más tarde'],
      defaultId: 0
    })
    if (response === 0) shell.openExternal(data.html_url)
  } catch {
    // Sin internet o la API de GitHub no respondió: no interrumpir el arranque de la app.
  }
}

function checkWindowsUpdateAutomatically(mainWindow) {
  const { autoUpdater } = require('electron-updater')

  autoUpdater.on('update-downloaded', () => {
    dialog
      .showMessageBox(mainWindow, {
        type: 'info',
        title: 'Actualización descargada',
        message: 'Se descargó una nueva versión de Cotizador. Se instalará al reiniciar la app.',
        buttons: ['Reiniciar ahora', 'Más tarde'],
        defaultId: 0
      })
      .then(({ response }) => {
        if (response === 0) autoUpdater.quitAndInstall()
      })
  })

  autoUpdater.on('error', (err) => {
    console.error('Error de auto-actualización:', err)
  })

  autoUpdater.checkForUpdatesAndNotify().catch((err) => {
    console.error('No se pudo verificar actualizaciones:', err)
  })
}

function initAutoUpdater(mainWindow) {
  if (!app.isPackaged) return // no tiene sentido revisar actualizaciones en desarrollo

  if (process.platform === 'win32') {
    checkWindowsUpdateAutomatically(mainWindow)
  } else if (process.platform === 'darwin') {
    checkMacUpdateManually(mainWindow)
  }
}

module.exports = { initAutoUpdater }
