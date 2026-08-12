const { app, BrowserWindow, ipcMain, dialog, globalShortcut, Tray, Menu, nativeImage, safeStorage } = require("electron");
const path = require("path");
const fs = require("fs");
const { execFileSync } = require("child_process");
const { autoUpdater } = require("electron-updater");
const ExcelJS = require("exceljs");
const StartupPolicy = require("./startup-policy.js");

let mainWindow;
let locked = false;
let glass = true;
let tray;
let manualUpdateCheck = false;
const singleInstanceLock = app.requestSingleInstanceLock();
const dataFileName = "planner-data.json";
const windowStateFileName = "window-state.json";
const settingsFileName = "settings.json";
const appIconPath = path.join(__dirname, "assets", "icons", "app-icon.ico");
const trayIconPath = path.join(__dirname, "assets", "icons", "app-icon.png");

if (process.platform === "win32") {
  app.setAppUserModelId("com.local.todayDailyPlanner");
}

if (!singleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, _commandLine, _workingDirectory) => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });
}

function createWindow() {
  const savedBounds = loadWindowState();
  mainWindow = new BrowserWindow({
    width: savedBounds?.width || 1380,
    height: savedBounds?.height || 900,
    x: savedBounds?.x,
    y: savedBounds?.y,
    minWidth: 360,
    minHeight: 520,
    icon: appIconPath,
    title: "今日日程",
    transparent: true,
    frame: false,
    skipTaskbar: false,
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

if (singleInstanceLock) app.whenReady().then(() => {
  const settings = loadSettings();
  glass = settings.glass !== false;
  locked = !!settings.locked;
  configureLoginItem(settings.startAtLogin);
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
    ...publicSettings(),
    glass,
    locked,
    pinned: mainWindow?.isAlwaysOnTop() || false,
    compact: !!loadSettings().compact,
    startAtLogin: app.getLoginItemSettings().openAtLogin
  }));
  ipcMain.handle("app:save-settings", (_event, nextSettings) => {
    const incoming = { ...(nextSettings || {}) };
    if (Object.prototype.hasOwnProperty.call(incoming, "aiApiKey")) {
      const key = String(incoming.aiApiKey || "").trim();
      delete incoming.aiApiKey;
      incoming.aiApiKeyEncrypted = key ? encryptAiKey(key) : null;
    }
    saveSettings(incoming);
    return { ...publicSettings(), pinned: mainWindow?.isAlwaysOnTop() || false, startAtLogin: app.getLoginItemSettings().openAtLogin };
  });
  ipcMain.handle("ai:ask", async (_event, payload) => askOpenAI(payload || {}));
  ipcMain.handle("app:get-version", () => app.getVersion());
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

const startupRunKey = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run";
const startupApprovedRunKey = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run";

function queryRunValue(name) {
  if (process.platform !== "win32") return "";
  try {
    const output = execFileSync("reg.exe", ["query", startupRunKey, "/v", name], { encoding: "utf8", windowsHide: true });
    const line = output.split(/\r?\n/).find(item => /\sREG_\w+\s+/i.test(item));
    return line ? line.replace(/^.*?\sREG_\w+\s+/i, "").trim() : "";
  } catch { return ""; }
}

function deleteRegistryValue(key, name) {
  if (process.platform !== "win32") return false;
  try {
    execFileSync("reg.exe", ["delete", key, "/v", name, "/f"], { stdio: "ignore", windowsHide: true });
    return true;
  } catch { return false; }
}

function cleanupKnownStartupEntries() {
  if (process.platform !== "win32") return;
  StartupPolicy.aliases.filter(name => name !== StartupPolicy.canonicalName).forEach(name => {
    try {
      app.setLoginItemSettings({ openAtLogin: false, name, path: app.getPath("exe") });
    } catch { /* best-effort cleanup; registry verification below is authoritative */ }
  });
  const entries = StartupPolicy.aliases.map(name => ({ name, command: queryRunValue(name) }));
  StartupPolicy.cleanupPlan(entries, app.getPath("exe")).forEach(entry => {
    deleteRegistryValue(startupRunKey, entry.name);
    deleteRegistryValue(startupApprovedRunKey, entry.name);
  });
}

function configureLoginItem(openAtLogin) {
  cleanupKnownStartupEntries();
  app.setLoginItemSettings({
    openAtLogin: !!openAtLogin,
    name: StartupPolicy.canonicalName,
    path: app.getPath("exe")
  });
  if (!openAtLogin) {
    deleteRegistryValue(startupRunKey, StartupPolicy.canonicalName);
    deleteRegistryValue(startupApprovedRunKey, StartupPolicy.canonicalName);
  }
}

function defaultExportDir() {
  return fs.existsSync("D:\\") ? "D:\\今日日程APP\\导出" : path.join(app.getPath("documents"), "今日日程APP", "导出");
}

function loadSettings() {
  const file = settingsPath();
  const defaults = { glass: true, pinned: false, locked: false, compact: false, startAtLogin: false, aiEnabled: false, aiModel: "gpt-5.6-sol" };
  if (!fs.existsSync(file)) return defaults;
  try {
    return { ...defaults, ...JSON.parse(fs.readFileSync(file, "utf8")) };
  } catch {
    return defaults;
  }
}

function encryptAiKey(value) {
  if (!value) return null;
  return safeStorage.isEncryptionAvailable() ? safeStorage.encryptString(value).toString("base64") : value;
}

function decryptAiKey(settings) {
  if (!settings?.aiApiKeyEncrypted) return "";
  try {
    return safeStorage.isEncryptionAvailable()
      ? safeStorage.decryptString(Buffer.from(settings.aiApiKeyEncrypted, "base64"))
      : settings.aiApiKeyEncrypted;
  } catch { return ""; }
}

function publicSettings() {
  const settings = loadSettings();
  const { aiApiKeyEncrypted, ...safeSettings } = settings;
  return { ...safeSettings, aiConfigured: Boolean(aiApiKeyEncrypted) };
}

function extractResponseText(payload) {
  if (typeof payload?.output_text === "string") return payload.output_text.trim();
  return (payload?.output || []).flatMap(item => item.content || [])
    .map(item => item.text || item.value || "").filter(Boolean).join("\n").trim();
}

async function askOpenAI(payload) {
  const settings = loadSettings();
  if (settings.aiEnabled === false) throw new Error("请先在设置中启用 AI 任务助手");
  const apiKey = decryptAiKey(settings);
  if (!apiKey) throw new Error("请先在设置中填写 OpenAI API Key");
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: settings.aiModel || "gpt-5.6-sol", store: false,
      input: [
        { role: "system", content: [{ type: "input_text", text: "你是 EveryTime 的任务数据助手。只根据用户提供的任务、日程和工时数据回答。不要编造数据；找不到时明确说没有找到。用简洁清晰的中文回答，优先列出任务名称、状态、日期和工时。你只能做任务查询、定位未完成任务和指定期间工作总结。" }] },
        { role: "user", content: [{ type: "input_text", text: `用户问题：${String(payload?.question || "").slice(0, 4000)}\n\n数据范围：${String(payload?.rangeLabel || "未指定")}\n\n应用数据：${JSON.stringify(payload?.context || {}).slice(0, 120000)}` }] }
      ]
    })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message || `AI 请求失败（${response.status}）`);
  return extractResponseText(body) || "AI 没有返回可显示的结果。";
}

function saveSettings(nextSettings) {
  const settings = { ...loadSettings(), ...nextSettings };
  glass = settings.glass !== false;
  locked = !!settings.locked;
  configureLoginItem(settings.startAtLogin);
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
    if (result.response === 0) {
      sendUpdateProgress({ state: "downloading", percent: 0, message: `正在下载 EveryTime ${info.version}…` });
      autoUpdater.downloadUpdate();
    }
  });
  autoUpdater.on("update-not-available", () => {
    if (manualUpdateCheck) {
      manualUpdateCheck = false;
      dialog.showMessageBox(mainWindow, { type: "info", title: "检查更新", message: "当前已经是最新版本。" });
    }
  });
  autoUpdater.on("download-progress", progress => {
    const percent = Math.max(0, Math.min(100, progress.percent || 0));
    mainWindow?.setProgressBar(percent / 100);
    sendUpdateProgress({
      state: "downloading",
      percent,
      message: `正在下载更新… ${Math.round(percent)}%`
    });
  });
  autoUpdater.on("update-downloaded", async info => {
    mainWindow?.setProgressBar(-1);
    sendUpdateProgress({ state: "downloaded", percent: 100, message: `EveryTime ${info.version} 已下载完成` });
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
    const message = `更新失败：${error?.message || String(error)}`;
    sendUpdateProgress({ state: "error", percent: 0, message });
    if (manualUpdateCheck) {
      manualUpdateCheck = false;
      dialog.showErrorBox("检查更新失败", message);
    } else if (mainWindow && !mainWindow.isDestroyed()) {
      dialog.showMessageBox(mainWindow, {
        type: "warning",
        title: "自动更新暂不可用",
        message,
        detail: "请确认 GitHub Releases 中存在最新版本的安装包、latest.yml 和 blockmap 文件。"
      });
    }
  });
}

function sendUpdateProgress(payload) {
  mainWindow?.webContents.send("app:update-progress", payload);
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
  tray = new Tray(nativeImage.createFromPath(trayIconPath).resize({ width: 20, height: 20, quality: "best" }));
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
