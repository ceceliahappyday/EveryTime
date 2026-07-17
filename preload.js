const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopAPI", {
  getPinned: () => ipcRenderer.invoke("window:get-pinned"),
  togglePinned: () => ipcRenderer.invoke("window:toggle-pinned"),
  getLocked: () => ipcRenderer.invoke("window:get-locked"),
  toggleLocked: () => ipcRenderer.invoke("window:toggle-locked"),
  onLockChanged: callback => ipcRenderer.on("window:lock-changed", (_event, locked) => callback(locked)),
  getGlass: () => ipcRenderer.invoke("window:get-glass"),
  toggleGlass: () => ipcRenderer.invoke("window:toggle-glass"),
  onGlassChanged: callback => ipcRenderer.on("window:glass-changed", (_event, glass) => callback(glass)),
  getSettings: () => ipcRenderer.invoke("app:get-settings"),
  saveSettings: settings => ipcRenderer.invoke("app:save-settings", settings),
  getVersion: () => ipcRenderer.invoke("app:get-version"),
  getPaths: () => ipcRenderer.invoke("app:get-paths"),
  resizeBy: (width, height) => ipcRenderer.send("window:resize-by", width, height),
  minimize: () => ipcRenderer.invoke("window:minimize"),
  quit: () => ipcRenderer.invoke("app:quit"),
  loadPlannerData: () => ipcRenderer.invoke("data:load-store"),
  savePlannerData: data => ipcRenderer.invoke("data:save-store", data),
  exportData: (filename, format, data) => ipcRenderer.invoke("data:export", filename, format, data)
});
