const fs = require('fs')
const path = require('path')

function logoToDataUri(logoPath) {
  if (!logoPath || !fs.existsSync(logoPath)) return ''
  const ext = path.extname(logoPath).replace('.', '') || 'png'
  const base64 = fs.readFileSync(logoPath).toString('base64')
  return `data:image/${ext};base64,${base64}`
}

module.exports = { logoToDataUri }
