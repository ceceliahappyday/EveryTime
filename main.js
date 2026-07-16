const { app, BrowserWindow, ipcMain, dialog, globalShortcut, Tray, Menu, nativeImage } = require("electron");
const path = require("path");
const fs = require("fs");
const { autoUpdater } = require("electron-updater");
const ExcelJS = require("exceljs");

let mainWindow;
let locked = false;
let glass = true;
let tray;
let manualUpdateCheck = false;
const dataFileName = "planner-data.json";
const windowStateFileName = "window-state.json";
const settingsFileName = "settings.json";

function createWindow() {
  const savedBounds = loadWindowState();
  mainWindow = new BrowserWindow({
    width: savedBounds?.width || 1380,
    height: savedBounds?.height || 900,
    x: savedBounds?.x,
    y: savedBounds?.y,
    minWidth: 420,
    minHeight: 520,
    title: "今日日程",
    transparent: true,
    frame: false,
    skipTaskbar: true,
    backgroundColor: "#00000000",
    autoHideMenuBar: true,
    alwaysOnTop: false,
    resizable: true,
    thickFrame: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.loadFile("index.html");
  mainWindow.on("move", saveWindowState);
  mainWindow.on("moved", saveWindowState);
  mainWindow.on("resize", saveWindowState);
  mainWindow.on("resized", saveWindowState);
  mainWindow.on("close", saveWindowState);
}

app.whenReady().then(() => {
  const settings = loadSettings();
  glass = settings.glass !== false;
  locked = !!settings.locked;
  app.setLoginItemSettings({ openAtLogin: !!settings.startAtLogin });
  ipcMain.handle("window:get-pinned", () => mainWindow.isAlwaysOnTop());
  ipcMain.handle("window:toggle-pinned", () => {
    const next = !mainWindow.isAlwaysOnTop();
    mainWindow.setAlwaysOnTop(next, next ? "floating" : "normal");
    return next;
  });
  ipcMain.handle("window:get-locked", () => locked);
  ipcMain.handle("window:toggle-locked", () => setLocked(!locked));
  ipcMain.handle("window:get-glass", () => glass);
  ipcMain.handle("window:toggle-glass", () => setGlass(!glass));
  ipcMain.handle("app:get-settings", () => ({
    ...loadSettings(),
    glass,
    locked,
    pinned: mainWindow?.isAlwaysOnTop() || false,
    compact: !!loadSettings().compact,
    startAtLogin: app.getLoginItemSettings().openAtLogin
  }));
  ipcMain.handle("app:save-settings", (_event, nextSettings) => saveSettings(nextSettings || {}));
  ipcMain.handle("app:get-paths", () => ({
    dataFile: plannerDataPath(),
    exportDir: defaultExportDir(),
    installSuggestion: "D:\\今日日程APP"
  }));
  ipcMain.handle("window:minimize", () => mainWindow.minimize());
  ipcMain.handle("app:quit", () => {
    app.isQuitting = true;
    app.quit();
  });
  ipcMain.handle("data:load-store", () => {
    const file = plannerDataPath();
    if (!fs.existsSync(file)) return null;
    try {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      return null;
    }
  });
  ipcMain.handle("data:save-store", (_event, data) => {
    const file = plannerDataPath();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const content = JSON.stringify(data || {}, null, 2);
    if (fs.existsSync(file)) {
      const previous = fs.readFileSync(file, "utf8");
      if (previous === content) return true;
      writePlannerBackup(previous);
    }
    fs.writeFileSync(file, content, "utf8");
    writePlannerBackup(content, true);
    return true;
  });
  ipcMain.on("window:resize-by", (_event, width, height) => {
    if (!mainWindow || locked) return;
    const bounds = mainWindow.getBounds();
    mainWindow.setBounds({
      x: bounds.x,
      y: bounds.y,
      width: Math.max(420, Math.round(width)),
      height: Math.max(520, Math.round(height))
    });
  });
  ipcMain.handle("data:export", async (_event, filename, format, data) => {
    const exportDir = defaultExportDir();
    try { fs.mkdirSync(exportDir, { recursive: true }); } catch {}
    const result = await dialog.showSaveDialog(mainWindow, {
      title: "导出全部日程数据",
      defaultPath: path.join(exportDir, filename),
      filters: format === "xlsx"
        ? [{ name: "Excel 工作簿", extensions: ["xlsx"] }]
        : [{ name: "JSON 数据文件", extensions: ["json"] }]
    });
    if (result.canceled || !result.filePath) return false;
    if (format === "json") {
      fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), "utf8");
      return true;
    }
    await buildExcel(result.filePath, data);
    return true;
  });
  createWindow();
  if (settings.pinned) mainWindow.setAlwaysOnTop(true, "floating");
  if (locked) mainWindow.webContents.once("did-finish-load", () => mainWindow.webContents.send("window:lock-changed", locked));
  createTray();
  configureAutoUpdater();
  mainWindow.webContents.once("did-finish-load", () => setTimeout(() => checkForUpdates(false), 1800));
  globalShortcut.register("CommandOrControl+Shift+Space", () => setLocked(!locked));
  app.on("activate", () => BrowserWindow.getAllWindows().length === 0 && createWindow());
});

function setLocked(next) {
  locked = next;
  persistPartialSettings({ locked });
  mainWindow.webContents.send("window:lock-changed", locked);
  mainWindow.show();
  mainWindow.focus();
  return locked;
}

function setGlass(next) {
  glass = next;
  persistPartialSettings({ glass });
  mainWindow.webContents.send("window:glass-changed", glass);
  return glass;
}

function plannerDataPath() {
  return path.join(app.getPath("userData"), dataFileName);
}

function windowStatePath() {
  return path.join(app.getPath("userData"), windowStateFileName);
}

function settingsPath() {
  return path.join(app.getPath("userData"), settingsFileName);
}

function defaultExportDir() {
  return fs.existsSync("D:\\") ? "D:\\今日日程APP\\导出" : path.join(app.getPath("documents"), "今日日程APP", "导出");
}

function loadSettings() {
  const file = settingsPath();
  const defaults = { glass: true, pinned: false, locked: false, compact: false, startAtLogin: false };
  if (!fs.existsSync(file)) return defaults;
  try {
    return { ...defaults, ...JSON.parse(fs.readFileSync(file, "utf8")) };
  } catch {
    return defaults;
  }
}

function saveSettings(nextSettings) {
  const settings = { ...loadSettings(), ...nextSettings };
  glass = settings.glass !== false;
  locked = !!settings.locked;
  app.setLoginItemSettings({ openAtLogin: !!settings.startAtLogin });
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(!!settings.pinned, settings.pinned ? "floating" : "normal");
    mainWindow.webContents.send("window:glass-changed", glass);
    mainWindow.webContents.send("window:lock-changed", locked);
  }
  fs.mkdirSync(path.dirname(settingsPath()), { recursive: true });
  fs.writeFileSync(settingsPath(), JSON.stringify(settings, null, 2), "utf8");
  return {
    ...settings,
    pinned: mainWindow?.isAlwaysOnTop() || !!settings.pinned,
    startAtLogin: app.getLoginItemSettings().openAtLogin
  };
}

function persistPartialSettings(partial) {
  const settings = { ...loadSettings(), ...partial };
  fs.mkdirSync(path.dirname(settingsPath()), { recursive: true });
  fs.writeFileSync(settingsPath(), JSON.stringify(settings, null, 2), "utf8");
}

function configureAutoUpdater() {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on("update-available", async info => {
    manualUpdateCheck = false;
    const result = await dialog.showMessageBox(mainWindow, {
      type: "question",
      title: "发现新版本",
      message: `发现 EveryTime ${info.version}，当前版本是 ${app.getVersion()}。`,
      detail: "是否现在下载更新？下载完成后会再次询问是否重启并安装。",
      buttons: ["下载更新", "稍后"],
      defaultId: 0,
      cancelId: 1
    });
    if (result.response === 0) autoUpdater.downloadUpdate();
  });
  autoUpdater.on("update-not-available", () => {
    if (manualUpdateCheck) {
      manualUpdateCheck = false;
      dialog.showMessageBox(mainWindow, { type: "info", title: "检查更新", message: "当前已经是最新版本。" });
    }
  });
  autoUpdater.on("download-progress", progress => {
    mainWindow?.setProgressBar(Math.max(0, Math.min(1, progress.percent / 100)));
  });
  autoUpdater.on("update-downloaded", async info => {
    mainWindow?.setProgressBar(-1);
    const result = await dialog.showMessageBox(mainWindow, {
      type: "question",
      title: "更新已下载",
      message: `EveryTime ${info.version} 已下载完成。`,
      detail: "是否现在重启并安装？",
      buttons: ["立即安装", "退出时安装"],
      defaultId: 0,
      cancelId: 1
    });
    if (result.response === 0) {
      app.isQuitting = true;
      autoUpdater.quitAndInstall(false, true);
    }
  });
  autoUpdater.on("error", error => {
    mainWindow?.setProgressBar(-1);
    if (manualUpdateCheck) {
      manualUpdateCheck = false;
      dialog.showErrorBox("检查更新失败", error?.message || String(error));
    }
  });
}

function checkForUpdates(manual = false) {
  manualUpdateCheck = manual;
  if (!app.isPackaged) {
    if (manual) dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "检查更新",
      message: "开发模式不会检查 GitHub Releases。请安装正式版本后测试自动更新。"
    });
    return;
  }
  autoUpdater.checkForUpdates().catch(error => {
    if (manual) dialog.showErrorBox("检查更新失败", error?.message || String(error));
  });
}

function loadWindowState() {
  const file = windowStatePath();
  if (!fs.existsSync(file)) return null;
  try {
    const bounds = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!bounds || bounds.width < 420 || bounds.height < 520) return null;
    return bounds;
  } catch {
    return null;
  }
}

function saveWindowState() {
  if (!mainWindow || mainWindow.isMinimized()) return;
  const bounds = mainWindow.getBounds();
  fs.mkdirSync(path.dirname(windowStatePath()), { recursive: true });
  fs.writeFileSync(windowStatePath(), JSON.stringify(bounds, null, 2), "utf8");
}

function writePlannerBackup(content, latest = false) {
  const backupDir = path.join(app.getPath("userData"), "backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const now = new Date();
  const stamp = now.toISOString().replace(/[:.]/g, "-");
  if (latest) {
    fs.writeFileSync(path.join(backupDir, "planner-data-latest.json"), content, "utf8");
    return;
  }
  const backupPath = path.join(backupDir, `planner-data-before-update-${stamp}.json`);
  fs.writeFileSync(backupPath, content, "utf8");
}

function createTray() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" rx="8" fill="#3c6655"/><text x="16" y="22" text-anchor="middle" font-size="18" fill="white">今</text></svg>`;
  tray = new Tray(nativeImage.createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`));
  tray.setToolTip("今日日程");
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: "显示并解锁", click: () => { if (locked) setLocked(false); mainWindow.show(); mainWindow.focus(); } },
    { label: "切换玻璃模式", click: () => setGlass(!glass) },
    { label: "切换窗口置顶", click: () => mainWindow.setAlwaysOnTop(!mainWindow.isAlwaysOnTop()) },
    { label: "检查更新", click: () => checkForUpdates(true) },
    { type: "separator" },
    { label: "退出今日日程", click: () => app.quit() }
  ]));
  tray.on("double-click", () => {
    if (locked) setLocked(false);
    mainWindow.show();
    mainWindow.focus();
  });
}

async function buildExcel(outputPath, data) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "今日日程";
  workbook.created = new Date();
  workbook.modified = new Date();

  addSheet(workbook, "任务清单", [
    "任务ID", "任务名称", "层级", "父任务ID", "责任人", "优先级", "状态", "进度",
    "计划归属日期", "截止日期", "截止时间", "实际开始", "实际完成/关闭", "投入工时",
    "业务背景", "问题原因", "详细计划/交付件", "任务说明", "每月重复", "重复至月份",
    "重复组ID", "创建时间", "最后更新时间"
  ], (data.tasks || []).map(task => [
    task.id, task.title, task.parentId ? "子任务" : "父任务", task.parentId || "", task.owner || "",
    priorityLabel(task.priority), statusLabel(task.status), Number(task.progress || 0) / 100,
    asDate(task.planDate), asDate(task.dueDate), task.dueTime || "", asDateTime(task.startedAt || task.startOverrideAt),
    asDateTime(task.completedAt), Number(task.workHours || 0), task.businessBackground || "",
    task.problemReason || "", task.deliveryNote || "", task.description || "",
    task.recurrence?.frequency === "monthly" ? "是" : "否", task.recurrence?.until || "",
    task.recurrenceGroupId || "", asDateTime(task.createdAt), asDateTime(task.updatedAt)
  ]), {
    percentCols: [8],
    dateCols: [9, 10],
    dateTimeCols: [12, 13, 22, 23],
    numberCols: [14],
    wrapCols: [15, 16, 17, 18]
  });

  addSheet(workbook, "日程记录", [
    "日期", "开始时间", "结束时间", "计划时长", "实际投入工时", "事项", "关联任务ID", "备注", "颜色"
  ], (data.schedules || []).map(entry => [
    asDate(entry.date), decimalTime(entry.start), decimalTime(entry.end),
    Number(entry.plannedDurationHours || 0), Number(entry.durationHours || 0),
    entry.title || "", entry.taskId || "", entry.note || "", entry.color || ""
  ]), {
    dateCols: [1],
    timeCols: [2, 3],
    numberCols: [4, 5],
    wrapCols: [6, 8]
  });

  addSheet(workbook, "每日备注", ["日期", "当天备注"], (data.notes || []).map(note => [
    asDate(note.date), note.note || ""
  ]), {
    dateCols: [1],
    wrapCols: [2]
  });

  await workbook.xlsx.writeFile(outputPath);
}

function addSheet(workbook, name, headers, rows, formats = {}) {
  const sheet = workbook.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.addRow(headers);
  rows.forEach(row => sheet.addRow(row));
  const header = sheet.getRow(1);
  header.height = 24;
  header.eachCell(cell => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3C6655" } };
    cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });
  sheet.eachRow((row, rowNumber) => {
    row.eachCell(cell => {
      cell.font = { name: "Microsoft YaHei", size: 10, ...(cell.font || {}) };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E6E1" } },
        left: { style: "thin", color: { argb: "FFE2E6E1" } },
        bottom: { style: "thin", color: { argb: "FFE2E6E1" } },
        right: { style: "thin", color: { argb: "FFE2E6E1" } }
      };
      if (rowNumber > 1) cell.alignment = { vertical: "top", wrapText: false };
    });
  });
  (formats.percentCols || []).forEach(index => sheet.getColumn(index).numFmt = "0%");
  (formats.dateCols || []).forEach(index => sheet.getColumn(index).numFmt = "yyyy-mm-dd");
  (formats.dateTimeCols || []).forEach(index => sheet.getColumn(index).numFmt = "yyyy-mm-dd hh:mm");
  (formats.timeCols || []).forEach(index => sheet.getColumn(index).numFmt = "hh:mm");
  (formats.numberCols || []).forEach(index => sheet.getColumn(index).numFmt = "0.0");
  (formats.wrapCols || []).forEach(index => {
    sheet.getColumn(index).alignment = { vertical: "top", wrapText: true };
  });
  sheet.columns.forEach((column, index) => {
    const max = Math.max(String(headers[index] || "").length, ...column.values.slice(2).map(value => displayLength(value)));
    column.width = Math.min(Math.max(max + 2, 10), formats.wrapCols?.includes(index + 1) ? 36 : 24);
  });
  if (rows.length) {
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } };
  }
}

function asDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date;
}

function asDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date;
}

function decimalTime(value) {
  if (value === undefined || value === null || value === "") return "";
  const hour = Math.floor(Number(value));
  const minute = Math.round((Number(value) - hour) * 60);
  return new Date(1899, 11, 30, hour, minute, 0, 0);
}

function displayLength(value) {
  if (value instanceof Date) return 16;
  if (value === null || value === undefined) return 0;
  return String(value).length;
}

function statusLabel(status) {
  return { planned: "计划中", in_progress: "进行中", done: "已完成", closed: "已关闭" }[status] || "计划中";
}

function priorityLabel(priority) {
  return {
    general_daily: "一般日常",
    kpi: "KPI",
    follow_up: "跟踪关注",
    important_urgent: "重要紧急",
    paused: "中止暂停"
  }[priority] || "一般日常";
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => globalShortcut.unregisterAll());
