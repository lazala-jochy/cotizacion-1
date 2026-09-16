const { BrowserWindow, dialog } = require('electron')
const fs = require('fs')
const { buildQuoteHtml } = require('../pdfTemplate')

function registerPdfHandlers(ipcMain) {
  ipcMain.handle('pdf:export', async (_event, { quote, client, settings }) => {
    if (!quote) throw new Error('Cotización no encontrada')

    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Guardar cotización como PDF',
      defaultPath: `${quote.folio}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    })
    if (canceled || !filePath) return null

    const html = buildQuoteHtml({ quote, client, settings })
    const pdfWindow = new BrowserWindow({ show: false })
    try {
      await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
      const pdfBuffer = await pdfWindow.webContents.printToPDF({ printBackground: true, pageSize: 'A4' })
      fs.writeFileSync(filePath, pdfBuffer)
    } finally {
      pdfWindow.close()
    }

    return filePath
  })
}

module.exports = { registerPdfHandlers }
