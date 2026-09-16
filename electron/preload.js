const { contextBridge, ipcRenderer } = require('electron')

function invoke(channel) {
  return (...args) => ipcRenderer.invoke(channel, ...args)
}

contextBridge.exposeInMainWorld('api', {
  pdf: {
    export: invoke('pdf:export')
  },
  files: {
    pickLogo: invoke('files:pickLogo'),
    getLogoDataUri: invoke('files:getLogoDataUri')
  },
  credentials: {
    save: invoke('credentials:save'),
    load: invoke('credentials:load'),
    clear: invoke('credentials:clear')
  },
  app: {
    getVersion: invoke('app:getVersion')
  }
})
