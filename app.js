const HOURS = Array.from({ length: 15 }, (_, i) => i + 7);
const WEEKDAY_NAMES = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const STORAGE_KEY = "today-planner-v1";
const CN_HOLIDAYS = {
  "2026-01-01": { name: "元旦", type: "holiday" },
  "2026-02-15": { name: "除夕", type: "holiday" },
  "2026-02-16": { name: "春节", type: "holiday" },
  "2026-02-17": { name: "春节", type: "holiday" },
  "2026-02-18": { name: "春节", type: "holiday" },
  "2026-02-19": { name: "春节", type: "holiday" },
  "2026-02-20": { name: "春节", type: "holiday" },
  "2026-02-21": { name: "春节", type: "holiday" },
  "2026-02-22": { name: "春节", type: "holiday" },
  "2026-02-14": { name: "调休上班", type: "workday" },
  "2026-02-28": { name: "调休上班", type: "workday" },
  "2026-04-04": { name: "清明节", type: "holiday" },
  "2026-04-05": { name: "清明节", type: "holiday" },
  "2026-04-06": { name: "清明节", type: "holiday" },
  "2026-05-01": { name: "劳动节", type: "holiday" },
  "2026-05-02": { name: "劳动节", type: "holiday" },
  "2026-05-03": { name: "劳动节", type: "holiday" },
  "2026-05-04": { name: "劳动节", type: "holiday" },
  "2026-05-05": { name: "劳动节", type: "holiday" },
  "2026-04-26": { name: "调休上班", type: "workday" },
  "2026-05-09": { name: "调休上班", type: "workday" },
  "2026-06-19": { name: "端午节", type: "holiday" },
  "2026-06-20": { name: "端午节", type: "holiday" },
  "2026-06-21": { name: "端午节", type: "holiday" },
  "2026-09-25": { name: "中秋节", type: "holiday" },
  "2026-09-26": { name: "中秋节", type: "holiday" },
  "2026-09-27": { name: "中秋节", type: "holiday" },
  "2026-10-01": { name: "国庆节", type: "holiday" },
  "2026-10-02": { name: "国庆节", type: "holiday" },
  "2026-10-03": { name: "国庆节", type: "holiday" },
  "2026-10-04": { name: "国庆节", type: "holiday" },
  "2026-10-05": { name: "国庆节", type: "holiday" },
  "2026-10-06": { name: "国庆节", type: "holiday" },
  "2026-10-07": { name: "国庆节", type: "holiday" },
  "2026-09-20": { name: "调休上班", type: "workday" },
  "2026-10-10": { name: "调休上班", type: "workday" }
};

const state = {
  selectedDate: toDateKey(new Date()),
  filter: typeof TodoListPolicy !== "undefined" ? TodoListPolicy.loadSavedFilter() : "in_progress",
  taskListSearch: "",
  showContinueYesterdayOnly: false,
  taskView: "day",
  projectScale: "day",
  projectScrollLeft: null,
  projectHorizontalSyncing: false,
  projectAnchorDate: null,
  projectWindowStart: null,
  projectWindowEnd: null,
  projectGanttExtending: false,
  projectGanttLastExtend: null,
  projectViewNeedsAnchor: false,
  projectCollapsedGroups: new Set(),
  ganttCollapsedGroups: new Set(),
  projectCollapsedSections: new Set(),
  projectCollapsedTasks: new Set(),
  todoCollapsedSections: new Set(),
  editingTaskId: null,
  editingEntryId: null,
  selectedColor: "sage",
  data: loadData()
};

const el = {};
let toastTimer;
let timelineScrollBarTimer;
let projectGanttScrollTimer;
let taskListScrollBarTimer;
let persistentWritesEnabled = false;
let pendingEntrySave = null;
let taskListSearchTimer = null;

document.addEventListener("DOMContentLoaded", async () => {
  [
    "todaySummary", "monthLabel", "monthPickerButton", "datePicker", "previousWeek", "nextWeek",
    "appVersionBadge",
    "todayButton", "weekDays", "taskCount", "taskList", "taskListSearch", "continueYesterdayButton", "unplannedCount", "openCount", "doneCount", "closedCount", "exportButton",
    "plannedHours", "progressLabel", "progressBar", "scheduleTitle", "loggedHours", "freeHours",
    "timeline", "timelineWrap", "projectGanttChrome", "quickAddButton", "toggleCompact", "quickTaskForm", "quickTaskInput", "taskAddTrigger", "viewSwitcher",
    "taskTabs", "allCount", "taskViewTitle", "taskDialog", "taskEditForm", "taskDialogEyebrow", "taskDialogTitle",
    "taskDetailSummary",
    "taskTitleInput", "taskDueDate", "taskDueTime", "taskOwner", "taskParent", "taskPriority",
    "taskProgress", "taskProgressValue", "taskStatus", "taskMonthlyRecurring", "taskRecurringUntil",
    "recurringOptions", "taskActualStart", "taskActualEnd",
    "taskBusinessBackground", "taskProblemReason", "taskDeliveryNote", "businessBackgroundLabel",
    "problemReasonLabel", "taskDescription",
    "deleteTaskButton", "mergeTaskButton", "entryDialog", "entryForm", "entryEyebrow", "entryDialogTitle", "entryTitle", "entryType",
    "entryLinkConfirmDialog", "entryLinkConfirmTitle", "entryLinkConfirmMessage", "entryLinkConfirmOptions", "entryLinkConfirmCancel", "entryLinkConfirmCreate",
    "taskMergeDialog", "taskMergeForm", "taskMergeMessage", "taskMergeTarget",
    "entryTaskLink", "entryTaskCombobox", "entryTaskTrigger", "entryTaskPopup", "entryTaskSearch", "entryTaskOptions", "entryStart", "entryEnd", "entryNote", "colorPicker", "deleteEntryButton", "dayNoteButton",
    "dayNoteText", "noteDialog", "noteForm", "dayNoteInput", "toast", "pinWindow", "desktopLock", "glassMode",
    "updateProgress", "updateProgressText", "updateProgressBar",
    "exportDialog", "exportForm", "exportFormat", "minimizeWindow", "closeWindow", "aiAssistantButton", "aiDialog", "aiForm", "aiPrompt", "aiPeriodStart", "aiPeriodEnd", "aiResult", "aiStatus", "aiCopyButton", "aiQuickActions",
    "progressReviewButton", "progressReviewDialog", "progressReviewForm", "progressReviewList",
    "settingsButton", "settingsDialog", "settingsForm", "settingGlass", "settingPinned", "settingLocked",
    "settingCompact", "settingStartAtLogin", "settingAiEnabled", "settingAiApiKey", "settingAiModel", "aiKeyStatus", "settingsAppVersion", "settingsDataPath", "settingsExportPath"
  ].forEach(id => el[id] = document.getElementById(id));

  if (!el.closeTaskButton) {
    el.closeTaskButton = document.createElement("button");
    el.closeTaskButton.type = "button";
    el.closeTaskButton.className = "soft-button hidden";
    el.closeTaskButton.id = "closeTaskButton";
    el.closeTaskButton.textContent = "关闭任务";
    el.deleteTaskButton.parentElement.insertBefore(el.closeTaskButton, el.deleteTaskButton.nextSibling);
  }

  await initPersistentStorage();
  migrateData();
  ensureEntryTaskLinks();
  ensureRecurringTasksForVisibleRange();
  persistentWritesEnabled = true;
  saveData();
  fillTimeOptions();
  bindEvents();
  initDesktop();
  bindUpdateProgress();
  renderAppVersion();
  render();
  requestAnimationFrame(scrollToWorkday);
  setInterval(() => {
    if (!document.querySelector("dialog[open]")) render();
  }, 60000);
});

function loadData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}

async function initPersistentStorage() {
  if (!window.desktopAPI?.loadPlannerData) return;
  const persisted = await window.desktopAPI.loadPlannerData();
  if (!persisted || typeof persisted !== "object") return;
  const localCount = countPlannerRecords(state.data);
  const persistedCount = countPlannerRecords(persisted);
  if (persistedCount > localCount) {
    state.data = persisted;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
  }
}

function migrateData() {
  Object.entries(state.data).forEach(([dateKey, day]) => {
    day.tasks ||= [];
    day.entries ||= [];
    day.note ||= "";
    day.entries.forEach(entry => {
      entry.entryType ||= entry.taskId ? "task_work" : "calendar";
      entry.note ||= "";
      entry.color ||= "sage";
    });
    day.tasks.forEach(task => {
      task.parentId ||= task.parentTaskId || task.parentTask || task.parent || "";
      task.dueDate ??= dateKey;
      task.dueTime ??= "18:00";
      task.owner ||= "我";
      task.parentId ||= "";
      task.description ||= "";
      task.priority = migratePriority(task.priority);
      task.progress = Number(task.progress || (task.status === "done" ? 100 : 0));
      if (!["done", "closed"].includes(task.status)) task.status = "planned";
      task.startedAt ||= "";
      task.completedAt ||= "";
      task.createdAtIso ||= new Date(`${dateKey}T09:00:00`).toISOString();
      task.updatedAt ||= task.createdAtIso;
      task.businessBackground ||= "";
      task.problemReason ||= "";
      task.deliveryNote ||= "";
      task.recurrence ||= null;
      task.recurrenceGroupId ||= "";
      if (task.status === "closed") {
        task.status = "done";
        task.completedAt ||= task.updatedAt || new Date().toISOString();
      }
      if (task.completedAt) {
        task.status = "done";
        task.progress = 100;
      }
      task.startOverrideAt ||= "";
    });
  });
  saveData();
}

function ensureEntryTaskLinks() {
  // Historical entries without a task link remain calendar-only records.
  // New task links are created explicitly from the entry type selector.
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
  if (persistentWritesEnabled && window.desktopAPI?.savePlannerData) {
    window.desktopAPI.savePlannerData(state.data).catch(() => {});
  }
}

function countPlannerRecords(data) {
  return Object.values(data || {}).reduce((sum, day) =>
    sum + (day.tasks?.length || 0) + (day.entries?.length || 0) + (day.note ? 1 : 0), 0);
}

function getDay(key = state.selectedDate) {
  if (!state.data[key]) state.data[key] = { tasks: [], entries: [], note: "" };
  return state.data[key];
}

function getAllTasks() {
  return Object.entries(state.data).flatMap(([dateKey, day]) =>
    (day.tasks || []).map(task => ({ task, dateKey }))
  );
}

function findTask(id) {
  return getAllTasks().find(item => item.task.id === id);
}

function findTaskRecords(id) {
  return getAllTasks().filter(item => item.task.id === id);
}

function updateTaskRecords(id, updater) {
  findTaskRecords(id).forEach(({ task }) => updater(task));
}

function bindEvents() {
  document.querySelectorAll("[data-close-dialog]").forEach(button => {
    button.addEventListener("click", () => document.getElementById(button.dataset.closeDialog).close("cancel"));
  });
  el.exportButton.addEventListener("click", () => el.exportDialog.showModal());
  el.progressReviewButton.addEventListener("click", openProgressReview);
  el.progressReviewForm.addEventListener("submit", event => {
    event.preventDefault();
    saveProgressReview();
  });
  el.exportForm.addEventListener("submit", event => {
    event.preventDefault();
    el.exportDialog.close();
    exportAllData(el.exportFormat.value);
  });
  el.quickAddButton.addEventListener("click", () => openTaskDialog());
  el.quickTaskForm.addEventListener("submit", event => {
    event.preventDefault();
    const title = el.quickTaskInput.value.trim();
    if (!title) return openTaskDialog();
    createQuickUnplannedTask(title);
  });

  el.viewSwitcher.addEventListener("click", event => {
    const button = event.target.closest("button[data-view]");
    if (!button) return;
    const previousView = state.taskView;
    state.taskView = button.dataset.view;
    state.projectViewNeedsAnchor = state.taskView === "project" && previousView !== "project";
    if (state.projectViewNeedsAnchor) state.projectAnchorDate = toDateKey(new Date());
    if (state.taskView === "project") {
      state.projectWindowStart = null;
      state.projectWindowEnd = null;
      state.projectGanttLastExtend = null;
    }
    el.viewSwitcher.querySelectorAll("button").forEach(item => item.classList.toggle("active", item === button));
    render();
  });

  el.taskTabs.addEventListener("click", event => {
    const button = event.target.closest("button[data-filter]");
    if (!button) return;
    state.filter = button.dataset.filter;
    state.showContinueYesterdayOnly = false;
    TodoListPolicy.saveFilter(state.filter);
    el.taskTabs.querySelectorAll("button").forEach(item => item.classList.toggle("active", item === button));
    renderTasks();
    if (state.taskView === "project") renderSchedule();
  });

  el.taskListSearch?.addEventListener("input", () => {
    state.taskListSearch = el.taskListSearch.value;
    state.showContinueYesterdayOnly = false;
    el.continueYesterdayButton?.classList.remove("active");
    clearTimeout(taskListSearchTimer);
    taskListSearchTimer = setTimeout(() => {
      const selectionStart = el.taskListSearch.selectionStart;
      renderTasks();
      el.taskListSearch.focus({ preventScroll: true });
      if (selectionStart !== null) el.taskListSearch.setSelectionRange(selectionStart, selectionStart);
    }, 120);
  });

  el.continueYesterdayButton?.addEventListener("click", () => {
    state.showContinueYesterdayOnly = !state.showContinueYesterdayOnly;
    el.continueYesterdayButton.classList.toggle("active", state.showContinueYesterdayOnly);
    if (state.showContinueYesterdayOnly) {
      state.filter = "all";
      TodoListPolicy.saveFilter(state.filter);
      el.taskTabs.querySelectorAll("button").forEach(item => item.classList.toggle("active", item.dataset.filter === "all"));
    }
    renderTasks();
  });

  el.mergeTaskButton?.addEventListener("click", () => openTaskMergeDialog());
  el.taskMergeForm?.addEventListener("submit", event => {
    event.preventDefault();
    mergeTaskIntoTarget(state.editingTaskId, el.taskMergeTarget.value);
  });
  el.entryLinkConfirmCancel?.addEventListener("click", () => {
    pendingEntrySave = null;
    el.entryLinkConfirmDialog.close();
  });
  el.entryLinkConfirmCreate?.addEventListener("click", () => {
    if (!pendingEntrySave) return;
    const { resolve, entryPayload, createMode } = pendingEntrySave;
    let task;
    if (createMode === "parent") {
      const parentTitle = el.entryLinkConfirmOptions.querySelector("#entryParentTaskTitle")?.value.trim() || "";
      if (!parentTitle) return showToast("请输入父级任务名称");
      if (TodoListPolicy.normalizeTitle(parentTitle) === TodoListPolicy.normalizeTitle(entryPayload.title)) {
        return showToast("父级任务名称需要与当前具体事项不同");
      }
      task = createParentAndLeafFromEntryPayload(entryPayload, parentTitle);
    } else {
      task = createTaskFromEntryPayload(entryPayload);
    }
    pendingEntrySave = null;
    el.entryLinkConfirmDialog.close();
    resolve(task.id);
  });

  el.previousWeek.addEventListener("click", () => moveSelectedDate(-7));
  el.nextWeek.addEventListener("click", () => moveSelectedDate(7));
  el.todayButton.addEventListener("click", () => {
    state.taskView = "day";
    state.projectViewNeedsAnchor = false;
    state.projectAnchorDate = null;
    state.projectScrollLeft = null;
    el.viewSwitcher.querySelectorAll("button").forEach(item => item.classList.toggle("active", item.dataset.view === "day"));
    selectDate(new Date());
  });
  el.monthPickerButton.addEventListener("click", () => el.datePicker.showPicker ? el.datePicker.showPicker() : el.datePicker.click());
  el.datePicker.addEventListener("change", () => el.datePicker.value && selectDate(fromDateKey(el.datePicker.value)));

  el.toggleCompact.addEventListener("click", () => {
    document.body.classList.toggle("compact");
    localStorage.setItem("today-planner-compact", document.body.classList.contains("compact") ? "1" : "0");
    renderSchedule();
  });
  if (localStorage.getItem("today-planner-compact") === "1") document.body.classList.add("compact");

  el.taskEditForm.addEventListener("submit", event => {
    event.preventDefault();
    saveTask();
  });
  el.deleteTaskButton.addEventListener("click", deleteEditingTask);
  el.closeTaskButton.addEventListener("click", closeEditingTask);
  el.taskProgress.addEventListener("input", () => el.taskProgressValue.textContent = `${el.taskProgress.value}%`);
  el.taskStatus.addEventListener("change", updateProgressAvailability);
  el.taskParent.addEventListener("change", updateParentRequirements);
  el.taskMonthlyRecurring.addEventListener("change", updateRecurringOptions);
  [el.taskDueDate, el.taskDueTime, el.taskActualStart, el.taskActualEnd].forEach(enableNativePicker);
  el.taskDueDate.addEventListener("change", () => {
    if (el.taskMonthlyRecurring.checked && el.taskDueDate.value) {
      const currentUntil = el.taskRecurringUntil.value;
      if (!currentUntil || currentUntil < el.taskDueDate.value.slice(0, 7)) {
        el.taskRecurringUntil.value = defaultRecurringUntil(el.taskDueDate.value);
      }
    }
  });
  el.taskActualEnd.addEventListener("change", () => {
    updateProgressAvailability();
  });

  el.entryForm.addEventListener("submit", event => {
    event.preventDefault();
    saveEntry();
  });
  el.entryType.addEventListener("change", updateEntryTypeControls);
  bindEntryTaskCombobox();
  el.entryStart.addEventListener("change", () => {
    if (Number(el.entryEnd.value) <= Number(el.entryStart.value)) el.entryEnd.value = Math.min(Number(el.entryStart.value) + 1, 22);
  });
  el.colorPicker.addEventListener("click", event => {
    const button = event.target.closest("button[data-color]");
    if (!button) return;
    state.selectedColor = button.dataset.color;
    el.colorPicker.querySelectorAll("button").forEach(item => item.classList.toggle("selected", item === button));
  });
  el.deleteEntryButton.addEventListener("click", () => {
    cancelEditingEntry();
  });

  el.dayNoteButton.addEventListener("click", openNoteDialog);
  el.dayNoteText.addEventListener("click", openNoteDialog);
  el.noteForm.addEventListener("submit", event => {
    event.preventDefault();
    getDay().note = el.dayNoteInput.value.trim();
    saveData();
    el.noteDialog.close();
    render();
    showToast("当天备注已保存");
  });
  el.timelineWrap.addEventListener("scroll", () => {
    clearTimeout(timelineScrollBarTimer);
    el.timelineWrap.classList.add("is-scrolling");
    timelineScrollBarTimer = setTimeout(() => el.timelineWrap.classList.remove("is-scrolling"), 700);
  }, { passive: true });
  window.addEventListener("dragend", clearScheduleDragOver);
  window.addEventListener("drop", clearScheduleDragOver);
  el.taskList.addEventListener("scroll", () => {
    clearTimeout(taskListScrollBarTimer);
    el.taskList.classList.add("is-scrolling");
    taskListScrollBarTimer = setTimeout(() => el.taskList.classList.remove("is-scrolling"), 700);
  }, { passive: true });
}

function enableNativePicker(input) {
  input?.addEventListener("click", () => {
    try { input.showPicker?.(); } catch {}
  });
}

async function initDesktop() {
  if (!window.desktopAPI) return;
  document.body.classList.add("in-desktop");
  const desktopSettings = await window.desktopAPI.getSettings?.();
  if (desktopSettings?.compact) {
    document.body.classList.add("compact");
    localStorage.setItem("today-planner-compact", "1");
  }
  const pinned = await window.desktopAPI.getPinned();
  document.body.classList.toggle("pinned", pinned);
  el.pinWindow.textContent = pinned ? "📌 已置顶" : "📌 置顶";
  el.pinWindow.addEventListener("click", async () => {
    const next = await window.desktopAPI.togglePinned();
    document.body.classList.toggle("pinned", next);
    el.pinWindow.textContent = next ? "📌 已置顶" : "📌 置顶";
    await window.desktopAPI.saveSettings?.({ pinned: next });
    showToast(next ? "窗口将保持在最前" : "已取消窗口置顶");
  });
  const syncLock = locked => {
    document.body.classList.toggle("desktop-locked", locked);
    el.desktopLock.textContent = locked ? "◉ 恢复显示" : "◌ 低干扰";
  };
  const syncGlass = glass => {
    document.body.classList.toggle("glass-mode", glass);
    el.glassMode.textContent = glass ? "◫ 退出玻璃" : "◫ 玻璃模式";
  };
  syncGlass(await window.desktopAPI.getGlass());
  el.glassMode.addEventListener("click", async () => {
    const glass = await window.desktopAPI.toggleGlass();
    syncGlass(glass);
    showToast(glass ? "已进入玻璃桌面模式，可继续拖动和缩放" : "已退出玻璃桌面模式");
  });
  window.desktopAPI.onGlassChanged(syncGlass);
  syncLock(await window.desktopAPI.getLocked());
  el.desktopLock.addEventListener("click", async () => {
    const locked = await window.desktopAPI.toggleLocked();
    syncLock(locked);
    showToast(locked ? "已降低界面存在感，仍可直接编辑" : "已恢复正常显示");
  });
  window.desktopAPI.onLockChanged(syncLock);
  el.minimizeWindow.addEventListener("click", () => window.desktopAPI.minimize());
  el.closeWindow.addEventListener("click", () => window.desktopAPI.quit());
  el.settingsButton?.addEventListener("click", openSettingsDialog);
  el.aiAssistantButton?.addEventListener("click", openAiDialog);
  el.aiQuickActions?.addEventListener("click", event => {
    const button = event.target.closest("[data-ai-prompt]");
    if (!button) return;
    el.aiPrompt.value = button.dataset.aiPrompt;
    if (button.textContent.includes("本周")) setAiRangeForWeek();
    el.aiPrompt.focus();
  });
  el.aiForm?.addEventListener("submit", event => { event.preventDefault(); askAi(); });
  el.aiCopyButton?.addEventListener("click", async () => {
    if (!el.aiResult?.textContent) return;
    await navigator.clipboard?.writeText(el.aiResult.textContent);
    showToast("AI 结果已复制");
  });
  el.settingsForm?.addEventListener("submit", event => {
    event.preventDefault();
    saveDesktopSettings();
  });

  const resizeHandle = document.querySelector(".resize-handle");
  resizeHandle?.addEventListener("pointerdown", event => {
    event.preventDefault();
    const startX = event.screenX;
    const startY = event.screenY;
    const startWidth = window.outerWidth;
    const startHeight = window.outerHeight;
    resizeHandle.setPointerCapture(event.pointerId);
    const move = moveEvent => window.desktopAPI.resizeBy(
      startWidth + moveEvent.screenX - startX,
      startHeight + moveEvent.screenY - startY
    );
    const up = () => {
      resizeHandle.removeEventListener("pointermove", move);
      resizeHandle.removeEventListener("pointerup", up);
      resizeHandle.removeEventListener("pointercancel", up);
    };
    resizeHandle.addEventListener("pointermove", move);
    resizeHandle.addEventListener("pointerup", up);
    resizeHandle.addEventListener("pointercancel", up);
  });
}

async function renderAppVersion() {
  const version = await window.desktopAPI?.getVersion?.().catch(() => "") || "";
  const label = version ? `v${version}` : "网页版";
  if (el.appVersionBadge) el.appVersionBadge.textContent = label;
  if (el.settingsAppVersion) el.settingsAppVersion.textContent = label;
}

function bindUpdateProgress() {
  window.desktopAPI?.onUpdateProgress?.(payload => {
    if (!el.updateProgress || !payload) return;
    const percent = Math.max(0, Math.min(100, Number(payload.percent || 0)));
    el.updateProgress.classList.remove("hidden", "done", "error");
    el.updateProgress.classList.toggle("done", payload.state === "downloaded");
    el.updateProgress.classList.toggle("error", payload.state === "error");
    el.updateProgressText.textContent = payload.message || `正在下载更新… ${Math.round(percent)}%`;
    el.updateProgressBar.style.width = `${percent}%`;
    if (payload.state === "downloaded" || payload.state === "error") {
      setTimeout(() => el.updateProgress?.classList.add("hidden"), 6500);
    }
  });
}

async function openSettingsDialog() {
  if (!window.desktopAPI) return;
  const [settings, paths] = await Promise.all([
    window.desktopAPI.getSettings?.(),
    window.desktopAPI.getPaths?.()
  ]);
  el.settingGlass.checked = settings?.glass !== false;
  el.settingPinned.checked = !!settings?.pinned;
  el.settingLocked.checked = !!settings?.locked;
  el.settingCompact.checked = document.body.classList.contains("compact") || !!settings?.compact;
  el.settingStartAtLogin.checked = !!settings?.startAtLogin;
  el.settingAiEnabled.checked = !!settings?.aiEnabled;
  el.settingAiApiKey.value = "";
  el.settingAiModel.value = settings?.aiModel || "gpt-5.6-sol";
  el.aiKeyStatus.textContent = settings?.aiConfigured ? "API Key 已配置（输入新 Key 可替换）" : "API Key 未配置";
  el.settingsAppVersion.textContent = el.appVersionBadge?.textContent || await window.desktopAPI.getVersion?.().then(version => `v${version}`).catch(() => "读取失败");
  el.settingsDataPath.textContent = paths?.dataFile || "当前用户数据目录";
  el.settingsExportPath.textContent = paths?.exportDir || "文档目录";
  el.settingsDialog.showModal();
}

async function saveDesktopSettings() {
  if (!window.desktopAPI?.saveSettings) return;
  const nextSettings = {
    glass: el.settingGlass.checked,
    pinned: el.settingPinned.checked,
    locked: el.settingLocked.checked,
    compact: el.settingCompact.checked,
    startAtLogin: el.settingStartAtLogin.checked,
    aiEnabled: el.settingAiEnabled.checked,
    aiModel: el.settingAiModel.value.trim() || "gpt-5.6-sol",
    ...(el.settingAiApiKey.value.trim() ? { aiApiKey: el.settingAiApiKey.value.trim() } : {})
  };
  const saved = await window.desktopAPI.saveSettings(nextSettings);
  document.body.classList.toggle("compact", !!saved?.compact);
  localStorage.setItem("today-planner-compact", saved?.compact ? "1" : "0");
  el.settingsDialog.close();
  render();
  showToast("设置已保存");
}

function setAiRangeForWeek() {
  const date = fromDateKey(state.selectedDate);
  const monday = getMonday(date);
  const end = new Date(monday); end.setDate(end.getDate() + 6);
  el.aiPeriodStart.value = toDateKey(monday);
  el.aiPeriodEnd.value = toDateKey(end);
}

function openAiDialog() {
  const date = fromDateKey(state.selectedDate);
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  el.aiPeriodStart.value = toDateKey(first);
  el.aiPeriodEnd.value = toDateKey(last);
  el.aiPrompt.value = "";
  el.aiStatus.textContent = "仅使用 EveryTime 内的任务、日程和工时数据。";
  el.aiResult.textContent = "AI 结果会显示在这里。";
  el.aiDialog.showModal();
}

function buildAiContext(startKey, endKey) {
  const tasks = uniqueTasks(getAllTasks().map(({ task }) => task)).map(task => {
    const entries = getTaskScheduleEntries(task.id).filter(item => item.dateKey >= startKey && item.dateKey <= endKey);
    const scheduledHours = entries.reduce((sum, item) => sum + (item.entry.end - item.entry.start), 0);
    const actualHours = entries.reduce((sum, item) => sum + getEntryInvestedHours(item.dateKey, item.entry), 0);
    return {
      id: task.id, title: task.title, status: task.status, priority: task.priority, owner: task.owner,
      dueDate: task.dueDate || "", dueTime: task.dueTime || "", parentId: task.parentId || "",
      createdAt: task.createdAt || "", updatedAt: task.updatedAt || "", completedAt: task.completedAt || "",
      scheduleCount: entries.length, scheduledHours: Number(scheduledHours.toFixed(2)), actualHours: Number(actualHours.toFixed(2)),
      notes: entries.map(item => ({ date: item.dateKey, start: formatTime(item.entry.start), end: formatTime(item.entry.end), note: item.entry.note || "" }))
    };
  });
  const entries = Object.entries(state.data).flatMap(([date, day]) => (day.entries || [])
    .filter(entry => date >= startKey && date <= endKey)
    .map(entry => ({ date, title: entry.title, entryType: entry.entryType || "calendar", start: formatTime(entry.start), end: formatTime(entry.end), note: entry.note || "", taskId: entry.taskId || "" })));
  return { period: { start: startKey, end: endKey }, tasks, calendarEntries: entries, dayNotes: Object.entries(state.data).filter(([date, day]) => date >= startKey && date <= endKey && day.note).map(([date, day]) => ({ date, note: day.note })) };
}

async function askAi() {
  const question = el.aiPrompt.value.trim();
  if (!question) { el.aiStatus.textContent = "请先输入问题。"; return; }
  const startKey = el.aiPeriodStart.value || "1900-01-01";
  const endKey = el.aiPeriodEnd.value || "2999-12-31";
  el.aiStatus.textContent = "正在整理本地任务数据并请求 AI…";
  el.aiResult.textContent = "处理中，请稍候…";
  try {
    const result = await window.desktopAPI.aiAsk({ question, rangeLabel: `${startKey} 至 ${endKey}`, context: buildAiContext(startKey, endKey) });
    el.aiResult.textContent = result;
    el.aiStatus.textContent = "已完成。结果只来自当前应用数据。";
  } catch (error) {
    el.aiStatus.textContent = error?.message || "AI 请求失败";
    el.aiResult.textContent = "请检查设置中的 API Key、模型名称和网络连接。";
  }
}

function render() {
  syncTaskStatuses();
  ensureRecurringTasksForVisibleRange();
  const date = fromDateKey(state.selectedDate);
  el.monthLabel.textContent = `${date.getFullYear()}年 ${date.getMonth() + 1}月`;
  el.datePicker.value = state.selectedDate;
  el.scheduleTitle.textContent = state.taskView === "project" ? "项目进度 · 甘特总览" :
    state.taskView === "month" ? `${date.getFullYear()}年${date.getMonth() + 1}月 · 月历` :
    state.taskView === "week" ? `${getMonday(date).getMonth() + 1}月${getMonday(date).getDate()}日起 · 周历` :
    `${date.getMonth() + 1}月${date.getDate()}日 · ${WEEKDAY_NAMES[date.getDay()]}`;
  el.todaySummary.textContent = isToday(date) ? "专注当下，把事情一件件做好" : `查看 ${date.getMonth() + 1}月${date.getDate()}日 的工作安排`;
  document.body.classList.toggle("month-mode", state.taskView === "month");
  document.body.classList.toggle("project-mode", state.taskView === "project");
  el.viewSwitcher.querySelectorAll("button[data-view]").forEach(button => {
    button.classList.toggle("active", button.dataset.view === state.taskView);
  });
  el.viewSwitcher.scrollIntoView({ block: "nearest", inline: "nearest" });
  renderWeek();
  renderTasks();
  renderSchedule();
  renderDayNote();
}

function renderWeek() {
  const monday = getMonday(fromDateKey(state.selectedDate));
  el.weekDays.innerHTML = "";
  for (let i = 0; i < 7; i++) {
    const date = addDays(monday, i);
    const key = toDateKey(date);
    const day = state.data[key];
    const button = document.createElement("button");
    button.className = "day-button";
    if (i >= 5) button.classList.add("weekend");
    if (key === state.selectedDate) button.classList.add("active");
    if (isToday(date)) button.classList.add("is-today");
    if (day && (day.tasks?.length || day.entries?.length || day.note)) button.classList.add("has-data");
    button.innerHTML = `<span class="day-number">${date.getDate()}</span><span class="day-name">
      <strong>${WEEKDAY_NAMES[date.getDay()]}${isToday(date) ? " · 今天" : ""}</strong>
      <span>${date.getMonth() + 1}月${date.getDate()}日</span></span><i class="day-dot"></i>`;
    button.addEventListener("click", () => selectDate(date));
    el.weekDays.appendChild(button);
  }
}

function taskDatesForView() {
  if (state.taskView === "day") return [state.selectedDate];
  if (state.taskView === "week") {
    const monday = getMonday(fromDateKey(state.selectedDate));
    return Array.from({ length: 7 }, (_, i) => toDateKey(addDays(monday, i)));
  }
  return [];
}

function renderUnifiedTodoList() {
  const allTasks = uniqueTasks(getAllTasks().map(({ task }) => task));
  const allLeafTasks = RecurringPolicy.dedupeRecurringTasksForProject(
    allTasks.filter(task => !isHiddenFutureRecurringInstance(task) || isOngoingTask(task)),
    RecurringPolicy.currentMonthKey()
  ).filter(isTodoListTask);

  updateTaskStats(allLeafTasks);

  const query = (state.taskListSearch || el.taskListSearch?.value || "").trim();
  let visibleTasks = allLeafTasks.filter(task => matchesUnifiedTaskFilter(task, state.filter));
  if (query) {
    visibleTasks = TaskOptionPolicy.searchTaskCandidates({
      tasks: allLeafTasks,
      query,
      selectedId: "",
      includeEnded: true,
      isHiddenFutureRecurringInstance,
      statusText: task => statusLabel(task.status),
      dateText: task => task.dueDate || "未计划"
    }).map(item => item.task);
  }

  el.taskViewTitle.textContent = "待办清单";
  el.taskList.className = "task-list unified-view";
  el.taskList.innerHTML = "";
  el.taskTabs.classList.remove("hidden");
  el.taskTabs.querySelectorAll("button").forEach(item =>
    item.classList.toggle("active", item.dataset.filter === state.filter)
  );
  el.continueYesterdayButton?.classList.toggle("active", state.showContinueYesterdayOnly);

  const entriesByDate = getWorkEntriesByDate();
  const yesterdayKey = shiftDateKey(state.selectedDate, -1);
  let linkedWorkItems = TodoListPolicy.parentLinkedWorkItems({
    entriesByDate,
    tasks: allTasks,
    selectedDate: state.selectedDate,
    yesterdayKey,
    hasChildTasks
  });
  if (query) {
    const normalizedQuery = TaskOptionPolicy.normalizeSearchText(query);
    const keywords = normalizedQuery.split(" ").filter(Boolean);
    linkedWorkItems = linkedWorkItems.filter(item => {
      const searchable = TaskOptionPolicy.normalizeSearchText(`${item.title} ${item.parentTitle} 进行中 ${item.dateKey}`);
      return keywords.every(keyword => searchable.includes(keyword));
    });
  } else if (!["all", "in_progress"].includes(state.filter)) {
    linkedWorkItems = [];
  }

  const includeSections = !query && (state.filter === "all" || state.filter === "in_progress" || state.filter === "planned" || state.filter === "unplanned");
  const groups = TodoListPolicy.buildTodoGroups({
    tasks: orderedTasks(visibleTasks),
    selectedDate: state.selectedDate,
    yesterdayKey,
    entriesByDate,
    isOngoingTask,
    isUnplannedTask,
    hasChildTasks: taskId => hasChildTasks(taskId),
    includeSections
  });

  let sections = TodoListPolicy.flattenGroups(groups).filter(section => section.label || section.tasks.length);
  if (!query && state.filter === "all") {
    const remaining = sections.find(section => section.key === "remaining");
    if (remaining?.tasks.length) remaining.label = "其他任务";
  }
  if (linkedWorkItems.length) {
    if (query) {
      sections = [{ key: "search", label: "搜索结果", tasks: [...visibleTasks, ...linkedWorkItems] }];
    } else {
      const yesterdayItems = linkedWorkItems.filter(item => item.isFromYesterday);
      const earlierItems = linkedWorkItems.filter(item => !item.isFromYesterday);
      const continueYesterday = sections.find(section => section.key === "continueYesterday");
      const continueToday = sections.find(section => section.key === "continueToday");
      if (continueYesterday) continueYesterday.tasks.push(...yesterdayItems);
      else if (yesterdayItems.length) sections.unshift({ key: "continueYesterday", label: "继续昨天", tasks: yesterdayItems });
      if (continueToday) continueToday.tasks.push(...earlierItems);
      else if (earlierItems.length) sections.unshift({ key: "continueToday", label: "今日可继续", tasks: earlierItems });
    }
  }
  if (state.showContinueYesterdayOnly) {
    sections = [{
      key: "continueYesterday",
      label: "继续昨天",
      tasks: [...groups.continueYesterday, ...linkedWorkItems.filter(item => item.isFromYesterday)]
    }];
  }

  const renderedCount = sections.reduce((sum, section) => sum + section.tasks.length, 0);
  el.taskCount.textContent = String(renderedCount);

  if (!renderedCount) {
    el.taskList.innerHTML = `<div class="empty-state">${state.showContinueYesterdayOnly
      ? "昨天没有可继续的任务投入"
      : query
        ? "没有匹配的待办任务"
        : "当前分类没有待办任务<br>会议和普通日程只显示在右侧日程中"}</div>`;
    return;
  }

  sections.forEach(section => {
    const collapsible = !query && state.filter === "all" && !state.showContinueYesterdayOnly && Boolean(section.label);
    const collapsed = collapsible && state.todoCollapsedSections.has(section.key);
    if (section.label && section.tasks.length) {
      const heading = document.createElement(collapsible ? "button" : "div");
      heading.className = "task-group-heading";
      if (collapsible) {
        heading.type = "button";
        heading.setAttribute("aria-expanded", String(!collapsed));
      }
      heading.innerHTML = `<strong>${collapsible ? `<i>${collapsed ? "▸" : "▾"}</i>` : ""}${escapeHtml(section.label)}</strong><span>${section.tasks.length} 项</span>`;
      if (collapsible) {
        heading.addEventListener("click", () => {
          if (collapsed) state.todoCollapsedSections.delete(section.key);
          else state.todoCollapsedSections.add(section.key);
          renderTasks();
        });
      }
      el.taskList.appendChild(heading);
    }
    if (collapsed) return;
    section.tasks.forEach(item => el.taskList.appendChild(
      item.entryId ? createLinkedWorkCard(item) : createTaskCard(item)
    ));
  });
}

function getWorkEntriesByDate() {
  const map = {};
  Object.entries(state.data).forEach(([dateKey, day]) => {
    map[dateKey] = (day.entries || []).filter(entry => entry.entryType === "task_work");
  });
  return map;
}

function shiftDateKey(dateKey, deltaDays) {
  const date = fromDateKey(dateKey);
  return toDateKey(addDays(date, deltaDays));
}

function taskHasWorkHistory(taskId) {
  return TodoListPolicy.hasWorkHistory(taskId, getWorkEntriesByDate());
}

function matchesUnifiedTaskFilter(task, filter) {
  if (filter === "in_progress") return isOngoingTask(task);
  if (filter === "all") return true;
  if (filter === "ended") return task.status === "done" || task.status === "closed";
  if (taskHasWorkHistory(task.id) && isOngoingTask(task)) return filter === "in_progress";
  return matchesFilter(task, filter);
}

function renderTasks() {
  renderUnifiedTodoList();
  return;

  const titles = { day: "当天待办", week: "本周待办", month: "月度计划", project: "项目清单" };
  el.taskViewTitle.textContent = titles[state.taskView];
  el.taskList.className = `task-list ${state.taskView}-view`;
  el.taskList.innerHTML = "";
  el.taskTabs.classList.remove("hidden");
  el.taskTabs.querySelectorAll("button").forEach(item => item.classList.toggle("active", item.dataset.filter === state.filter));
  const allVisibleTasks = RecurringPolicy.dedupeRecurringTasksForDisplay(getAllTasks()
    .map(({ task }) => task)
    .filter(task => !isHiddenFutureRecurringInstance(task)));

  if (state.taskView === "project") {
    renderProjectTaskList(allVisibleTasks);
    return;
  }

  if (state.filter === "all") {
    const allTasks = orderedTasks(allVisibleTasks.filter(isTodoListTask));
    updateTaskStats(allTasks);
    if (!allTasks.length) {
      el.taskList.innerHTML = `<div class="empty-state">还没有任务</div>`;
      return;
    }
    allTasks.forEach(task => el.taskList.appendChild(createTaskCard(task)));
    return;
  }

  if (state.taskView === "month") {
    const monthTasks = tasksInMonth(fromDateKey(state.selectedDate));
    updateTaskStats(monthTasks.concat(allVisibleTasks.filter(isUnplannedTask)));
    if (state.filter === "unplanned") {
      const unplannedTasks = orderedTasks(allVisibleTasks.filter(isUnplannedTask));
      if (unplannedTasks.length) {
        const heading = document.createElement("div");
        heading.className = "task-group-heading";
        heading.innerHTML = `<strong>未计划</strong><span>${unplannedTasks.length} 项</span>`;
        el.taskList.appendChild(heading);
        unplannedTasks.forEach(task => el.taskList.appendChild(createTaskCard(task)));
      } else {
        el.taskList.innerHTML = `<div class="empty-state">还没有未计划任务</div>`;
      }
      return;
    }
    const grouped = {};
    const monthDates = datesInMonth(fromDateKey(state.selectedDate));
    const tasksByDate = Object.fromEntries(monthDates.map(dateKey => [dateKey, tasksForDateScope(dateKey)]));
    const monthCanonicalTasks = RecurringPolicy.dedupeRecurringTasksForDisplay(
      uniqueTasks(Object.values(tasksByDate).flat())
    );
    const canonicalIds = new Set(monthCanonicalTasks.map(task => task.id));
    monthDates.forEach(dateKey => {
      const tasks = tasksByDate[dateKey]
        .filter(task => canonicalIds.has(task.id))
        .filter(task => matchesFilter(task, state.filter));
      if (tasks.length) grouped[dateKey] = tasks;
    });
    Object.keys(grouped).sort().forEach(key => {
      const date = fromDateKey(key);
      const heading = document.createElement("div");
      heading.className = "task-group-heading";
      heading.innerHTML = `<strong>${date.getMonth() + 1}月${date.getDate()}日 · ${WEEKDAY_NAMES[date.getDay()]}</strong><span>${grouped[key].length} 项</span>`;
      el.taskList.appendChild(heading);
      orderedTasks(grouped[key]).forEach(task => el.taskList.appendChild(createTaskCard(task)));
    });
    if (!Object.keys(grouped).length) el.taskList.innerHTML = `<div class="empty-state">本月当前分类没有任务</div>`;
    return;
  }

  const dates = taskDatesForView();
  const scopedTasks = uniqueTasks(dates.flatMap(key => tasksForDateScope(key)));
  updateTaskStats(scopedTasks.concat(allVisibleTasks.filter(isUnplannedTask)));
  let rendered = 0;

  if (state.filter === "unplanned") {
    const unplannedTasks = orderedTasks(allVisibleTasks.filter(isUnplannedTask));
    if (unplannedTasks.length) {
      const heading = document.createElement("div");
      heading.className = "task-group-heading";
      heading.innerHTML = `<strong>未计划</strong><span>${unplannedTasks.length} 项</span>`;
      el.taskList.appendChild(heading);
      unplannedTasks.forEach(task => {
        el.taskList.appendChild(createTaskCard(task));
        rendered++;
      });
    }
    if (!rendered) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.innerHTML = "还没有未计划任务<br>直接在上方输入待办即可快速记录";
      el.taskList.appendChild(empty);
    }
    return;
  }

  if (state.taskView === "day" && state.filter === "planned") {
    const todayTasks = tasksForDateScope(state.selectedDate).filter(task => matchesFilter(task, state.filter));
    const futureTasks = getAllTasks()
      .map(({ task }) => task)
      .filter(task => matchesFilter(task, "planned") && task.dueDate > state.selectedDate)
      .filter(task => !todayTasks.some(todayTask => todayTask.id === task.id))
      .filter(task => !isHiddenFutureRecurringInstance(task))
      .sort((a, b) => `${a.dueDate} ${a.dueTime}`.localeCompare(`${b.dueDate} ${b.dueTime}`));
    if (todayTasks.length) {
      const heading = document.createElement("div");
      heading.className = "task-group-heading";
      heading.innerHTML = `<strong>当天计划</strong><span>${todayTasks.length} 项</span>`;
      el.taskList.appendChild(heading);
      orderedTasks(todayTasks).forEach(task => {
        el.taskList.appendChild(createTaskCard(task));
        rendered++;
      });
    }
    if (futureTasks.length) {
      const heading = document.createElement("div");
      heading.className = "task-group-heading";
      heading.innerHTML = `<strong>可提前安排</strong><span>${futureTasks.length} 项</span>`;
      el.taskList.appendChild(heading);
      orderedTasks(futureTasks).forEach(task => {
        el.taskList.appendChild(createTaskCard(task));
        rendered++;
      });
    }
    if (!rendered) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.innerHTML = "当前没有计划中的任务<br>未来计划任务会显示在“可提前安排”里";
      el.taskList.appendChild(empty);
    }
    return;
  }
  if (state.taskView === "day" && state.filter === "in_progress") {
    const activeTasks = orderedTasks(getAllTasks()
      .map(({ task }) => task)
      .filter(task => isTodoListTask(task) && isOngoingTask(task)));
    updateTaskStats(activeTasks.concat(allVisibleTasks.filter(isUnplannedTask)));
    if (activeTasks.length) {
      const heading = document.createElement("div");
      heading.className = "task-group-heading";
      heading.innerHTML = `<strong>进行中的任务（可继续安排）</strong><span>${activeTasks.length} 项</span>`;
      el.taskList.appendChild(heading);
      activeTasks.forEach(task => el.taskList.appendChild(createTaskCard(task)));
    } else {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.innerHTML = "当前没有进行中的任务<br>把任务拖入日程后，会在这里持续显示直到关闭";
      el.taskList.appendChild(empty);
    }
    return;
  }
  dates.forEach(key => {
    const tasks = tasksForDateScope(key).filter(task => matchesFilter(task, state.filter));
    if (state.taskView === "week") {
      const date = fromDateKey(key);
      const heading = document.createElement("div");
      heading.className = "task-group-heading";
      heading.innerHTML = `<strong>${date.getMonth() + 1}月${date.getDate()}日 · ${WEEKDAY_NAMES[date.getDay()]}</strong><span>${tasks.length} 项</span>`;
      el.taskList.appendChild(heading);
    }
    orderedTasks(tasks).forEach(task => {
      el.taskList.appendChild(createTaskCard(task));
      rendered++;
    });
  });

  if (!rendered) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = state.filter === "planned" ? "当前范围还没有计划中的任务<br>只有截止时间、尚未排入日程的任务会显示在这里" :
      state.filter === "in_progress" ? "拖入具体日程后，任务会显示在这里" : "已完成和已关闭的任务会统一显示在这里";
    el.taskList.appendChild(empty);
  }
}

function orderedTasks(tasks) {
  const ids = new Set(tasks.map(task => task.id));
  const result = [];
  const visited = new Set();
  const byDue = (a, b) => `${a.dueDate || "9999-12-31"} ${a.dueTime || ""}`.localeCompare(`${b.dueDate || "9999-12-31"} ${b.dueTime || ""}`);
  const appendBranch = task => {
    if (!task || visited.has(task.id)) return;
    visited.add(task.id);
    result.push(task);
    tasks.filter(child => child.parentId === task.id).sort(byDue).forEach(appendBranch);
  };
  tasks.filter(task => !task.parentId || !ids.has(task.parentId)).sort(byDue).forEach(appendBranch);
  tasks.filter(task => !visited.has(task.id)).sort(byDue).forEach(appendBranch);
  return result;
}

function renderProjectTaskList(tasks) {
  el.taskTabs.classList.remove("hidden");
  const allProjects = getProjectSummaries(tasks);
  const projects = ProjectCollapsePolicy.filterProjectsForStatus(allProjects, state.filter);
  el.taskCount.textContent = projects.length;
  updateProjectStats(allProjects);
  const totalHours = projects.reduce((sum, project) => sum + project.totalHours, 0);
  const avgProgress = projects.length
    ? Math.round(projects.reduce((sum, project) => sum + ProjectSummaryPolicy.projectProgressPercent(project), 0) / projects.length)
    : 0;
  el.plannedHours.textContent = formatHours(totalHours);
  el.progressLabel.textContent = `${avgProgress}%`;
  el.progressBar.style.width = `${avgProgress}%`;
  if (!projects.length) {
    el.taskList.innerHTML = `<div class="empty-state">还没有项目<br>创建主计划或待办后，会在这里形成项目总览</div>`;
    return;
  }
  projectStatusGroups(projects).forEach(group => {
    if (!group.projects.length) return;
    const collapsed = state.projectCollapsedGroups.has(group.status);
    const heading = document.createElement("button");
    heading.className = `task-group-heading project-status-heading ${group.status}`;
    heading.type = "button";
    heading.innerHTML = `<strong><i>${collapsed ? "▸" : "▾"}</i>${group.label}</strong><span>${group.projects.length} 项</span>`;
    heading.addEventListener("click", () => toggleProjectGroup(group.status));
    el.taskList.appendChild(heading);
    if (collapsed) return;
    group.projects.forEach(project => el.taskList.appendChild(createProjectCard(project)));
  });
}

function updateProjectStats(projects) {
  const counts = projectStatusGroups(projects).reduce((result, group) => {
    result[group.status] = group.projects.length;
    return result;
  }, {});
  el.unplannedCount.textContent = counts.unplanned || 0;
  el.openCount.textContent = counts.planned || 0;
  el.doneCount.textContent = counts.in_progress || 0;
  el.closedCount.textContent = counts.ended || 0;
  el.allCount.textContent = projects.length;
}

function createProjectCard(project) {
  const card = document.createElement("article");
  card.className = `project-card project-card-compact ${project.status}`;
  card.innerHTML = `
    <div>
      <strong><button class="task-check project-task-check" title="标记任务已关闭"></button>${escapeHtml(project.parent.title)}</strong>
    </div>
    <button class="task-menu" title="查看项目详情">•••</button>`;
  const check = card.querySelector(".project-task-check");
  check.classList.toggle("completed", ["done", "closed"].includes(project.parent.status));
  check.addEventListener("click", event => {
    event.stopPropagation();
    toggleTaskCompletion(project.parent);
  });
  card.querySelector(".task-menu").addEventListener("click", event => {
    event.stopPropagation();
    openTaskDialog(project.parent);
  });
  card.addEventListener("dblclick", () => openTaskDialog(project.parent));
  return card;
}

function toggleProjectGroup(status) {
  if (state.projectCollapsedGroups.has(status)) state.projectCollapsedGroups.delete(status);
  else state.projectCollapsedGroups.add(status);
  renderTasks();
}

function toggleGanttGroup(status) {
  if (state.ganttCollapsedGroups.has(status)) state.ganttCollapsedGroups.delete(status);
  else state.ganttCollapsedGroups.add(status);
  renderSchedule();
}

function projectStatusGroups(projects) {
  return [
    { status: "in_progress", label: "进行中的项目", projects: projects.filter(project => project.status === "in_progress") },
    { status: "planned", label: "计划中的项目", projects: projects.filter(project => project.status === "planned") },
    { status: "unplanned", label: "未计划项目", projects: projects.filter(project => project.status === "unplanned") },
    { status: "ended", label: "已关闭项目", projects: projects.filter(project => project.status === "ended") }
  ];
}

function projectStatusLabel(status) {
  return { unplanned: "未计划", planned: "计划中", in_progress: "进行中", ended: "已关闭" }[status] || "计划中";
}

function getProjectSummaries(tasks = getAllTasks().map(({ task }) => task)) {
  const visible = RecurringPolicy.dedupeRecurringTasksForProject(
    uniqueTasks(tasks).filter(task => !isHiddenFutureRecurringInstance(task)),
    RecurringPolicy.currentMonthKey()
  );
  const visibleIds = new Set(visible.map(task => task.id));
  const roots = visible
    .filter(task => !task.parentId || !visibleIds.has(task.parentId))
    .sort((a, b) => `${a.dueDate || "9999-12-31"} ${a.dueTime || ""}`.localeCompare(`${b.dueDate || "9999-12-31"} ${b.dueTime || ""}`));
  return roots.map(root => {
    const descendants = getDescendantTasks(root.id).filter(task => visibleIds.has(task.id));
    const children = descendants.length ? descendants : [root];
    const descendantIds = new Set(descendants.map(task => task.id));
    const leafTasks = descendants.filter(task =>
      !descendants.some(candidate => candidate.parentId === task.id && descendantIds.has(candidate.id))
    );
    const summaryTasks = leafTasks.length ? leafTasks : [root];
    return ProjectSummaryPolicy.summarizeProject({
      parent: root,
      children,
      summaryTasks,
      getTaskDuration,
      getTaskScheduledHours
    });
  });
}

function getDescendantTasks(parentId, visited = new Set()) {
  if (!parentId || visited.has(parentId)) return [];
  visited.add(parentId);
  return getChildTasks(parentId).flatMap(child => [child, ...getDescendantTasks(child.id, visited)]);
}

function getTaskScheduleEntries(taskId) {
  return Object.entries(state.data).flatMap(([dateKey, day]) =>
    (day.entries || [])
      .filter(entry => entry.taskId === taskId)
      .map(entry => ({ dateKey, entry }))
  ).sort((a, b) => `${a.dateKey} ${a.entry.start}`.localeCompare(`${b.dateKey} ${b.entry.start}`));
}

const GANTT_LABEL_WIDTH = 240;

function projectTimelineBuckets(projects, scale = "day", meetings = []) {
  if (scale === "month") return projectTimelineMonthBuckets(projects, meetings);
  if (!state.projectWindowStart || !state.projectWindowEnd) resetProjectGanttWindow(scale);
  if (scale === "week") return buildWeekTimelineBuckets(state.projectWindowStart, state.projectWindowEnd);
  return buildDayTimelineBuckets(state.projectWindowStart, state.projectWindowEnd);
}

function projectTimelineMonthBuckets(projects, meetings = []) {
  const projectTasks = projects.flatMap(project =>
    [project.parent, ...project.children, ...project.children.flatMap(task => getDescendantTasks(task.id))]
  );
  const meetingDates = meetings.flatMap(meeting => meeting.entries.map(item => item.dateKey));
  const points = [
    ...uniqueTasks(projectTasks).flatMap(task => taskTimelineDateKeys(task)),
    ...meetingDates
  ];
  const fallback = state.selectedDate;
  const todayKey = toDateKey(new Date());
  const min = points.length ? [points.sort()[0], fallback, todayKey].sort()[0] : [fallback, todayKey].sort()[0];
  const current = fromDateKey(todayKey);
  const futureKey = toDateKey(addDays(current, 370));
  const max = points.length ? [points.slice().sort().at(-1), futureKey].sort().at(-1) : futureKey;
  const buckets = [];
  let cursor = new Date(fromDateKey(min).getFullYear(), fromDateKey(min).getMonth(), 1);
  const end = new Date(fromDateKey(max).getFullYear(), fromDateKey(max).getMonth(), 1);
  while (cursor <= end) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    buckets.push({ key, label: `${cursor.getMonth() + 1}月` });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  return buckets;
}

function buildDayTimelineBuckets(startKey, endKey) {
  const buckets = [];
  for (let cursor = fromDateKey(startKey); cursor <= fromDateKey(endKey); cursor = addDays(cursor, 1)) {
    const key = toDateKey(cursor);
    buckets.push({ key, label: key.slice(5).replace("-", "/") });
  }
  return buckets;
}

function buildWeekTimelineBuckets(startKey, endKey) {
  const buckets = [];
  for (let cursor = fromDateKey(startKey); cursor <= fromDateKey(endKey); cursor = addDays(cursor, 7)) {
    const key = toDateKey(cursor);
    buckets.push({ key, label: `${cursor.getMonth() + 1}/${cursor.getDate()}周` });
  }
  return buckets;
}

function resetProjectGanttWindow(scale = state.projectScale) {
  const centerDateKey = state.projectAnchorDate || toDateKey(new Date());
  const window = ProjectViewPolicy.initialGanttWindow({
    scale,
    centerDateKey,
    addDays,
    getMonday,
    fromDateKey,
    toDateKey
  });
  state.projectWindowStart = window.startKey;
  state.projectWindowEnd = window.endKey;
  state.projectGanttLastExtend = null;
}

function getProjectGanttScroller() {
  return el.projectGanttScroll || el.timelineWrap;
}

function handleProjectGanttScroll() {
  const scroller = getProjectGanttScroller();
  clearTimeout(projectGanttScrollTimer);
  scroller.classList.add("is-scrolling");
  projectGanttScrollTimer = setTimeout(() => scroller.classList.remove("is-scrolling"), 700);
  maybeExtendProjectGanttWindow();
  state.projectScrollLeft = scroller.scrollLeft;
}

function maybeExtendProjectGanttWindow() {
  if (state.taskView !== "project" || state.projectScale === "month" || state.projectGanttExtending) return;
  const scroller = getProjectGanttScroller();
  if (!scroller) return;
  const threshold = 72;
  const maxScroll = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
  if (maxScroll <= threshold) {
    state.projectGanttLastExtend = null;
    return;
  }
  let direction = null;
  if (scroller.scrollLeft <= threshold) direction = "past";
  else if (maxScroll - scroller.scrollLeft <= threshold) direction = "future";
  if (!direction) {
    if (scroller.scrollLeft > threshold * 2 && maxScroll - scroller.scrollLeft > threshold * 2) {
      state.projectGanttLastExtend = null;
    }
    return;
  }
  if (state.projectGanttLastExtend === direction) return;
  const bucketWidth = state.projectScale === "day" ? 44 : 72;
  const prevScroll = scroller.scrollLeft;
  const extended = ProjectViewPolicy.extendGanttWindow({
    scale: state.projectScale,
    startKey: state.projectWindowStart,
    endKey: state.projectWindowEnd,
    direction,
    addDays,
    fromDateKey,
    toDateKey
  });
  state.projectWindowStart = extended.startKey;
  state.projectWindowEnd = extended.endKey;
  state.projectGanttLastExtend = direction;
  state.projectGanttExtending = true;
  state.projectScrollLeft = direction === "past"
    ? prevScroll + extended.addedCount * bucketWidth
    : prevScroll;
  renderSchedule();
  state.projectGanttExtending = false;
}

function taskTimelineDateKeys(task) {
  return [
    task.dueDate,
    task.startedAt ? toDateKey(new Date(task.startedAt)) : "",
    task.startOverrideAt ? toDateKey(new Date(task.startOverrideAt)) : "",
    task.completedAt ? toDateKey(new Date(task.completedAt)) : "",
    ...getTaskScheduleEntries(task.id).map(item => item.dateKey)
  ].filter(Boolean);
}

function projectBucketKey(dateKey, scale = "day") {
  if (!dateKey) return "";
  const date = fromDateKey(dateKey);
  if (scale === "month") return dateKey.slice(0, 7);
  if (scale === "week") return toDateKey(getMonday(date));
  return dateKey;
}

function taskTimelineSpan(task, buckets, scale = "day") {
  const points = taskTimelineDateKeys(task);
  const bucketKeys = buckets.map(bucket => bucket.key);
  const first = points.length ? points.sort()[0] : buckets[0]?.key;
  const last = task.completedAt ? toDateKey(new Date(task.completedAt)) : (task.dueDate || points.sort().at(-1) || first);
  const firstBucket = projectBucketKey(first, scale);
  const lastBucket = projectBucketKey(last, scale);
  const startIndex = Math.max(0, bucketKeys.indexOf(firstBucket));
  const endIndex = Math.max(startIndex, bucketKeys.indexOf(lastBucket));
  const left = buckets.length ? (startIndex / buckets.length) * 100 : 0;
  const width = buckets.length ? ((endIndex - startIndex + 1) / buckets.length) * 100 : 100;
  return { left, width: Math.max(width, 4) };
}

function createTaskCard(task) {
  const duration = getTaskDuration(task.id);
  const schedule = getTaskScheduleInfo(task.id);
  const visualStatus = isUnplannedTask(task) ? "unplanned" : task.status;
  const allTasks = getAllTasks().map(({ task: item }) => item);
  const parentPath = TaskOptionPolicy.hierarchyMeta({ task, tasks: allTasks }).parentPath;
  const card = document.createElement("article");
  card.className = `task-card ${visualStatus}`;
  card.draggable = visualStatus === "unplanned" || task.status === "planned" || task.status === "in_progress";
  card.dataset.taskId = task.id;
  card.innerHTML = `
    <button class="task-check" title="标记完成"></button>
    <div class="task-body">
      <strong>${escapeHtml(task.title)}</strong>
      ${parentPath ? `<span class="task-parent-path">${escapeHtml(parentPath)}</span>` : ""}
      <div class="task-meta">
        <span class="priority-badge ${task.priority || "general_daily"}">${priorityLabel(task.priority)}</span>
        <span>${formatDue(task)}</span>
        <span>${statusLabel(visualStatus)}</span>
        ${duration ? `<span class="task-duration">${formatHours(duration)}</span>` : ""}
        ${task.recurrence?.frequency === "monthly" ? `<span>↻ 每月重复</span>` : ""}
        ${task.status === "planned" && schedule ? `<span>已安排 ${formatDateTime(schedule.firstStartIso)}</span>` : ""}
      </div>
      ${task.progress > 0 ? `<div class="task-progress-track" title="进度 ${task.progress || 0}%"><i style="width:${task.progress || 0}%"></i></div>` : ""}
    </div>
    <button class="task-menu" title="编辑待办">•••</button>`;

  card.querySelector(".task-check").addEventListener("click", event => {
    event.stopPropagation();
    toggleTaskCompletion(task);
  });
  card.querySelector(".task-menu").addEventListener("click", event => {
    event.stopPropagation();
    openTaskDialog(task);
  });
  card.addEventListener("dblclick", event => {
    if (!event.target.closest("button")) openTaskDialog(task);
  });
  card.addEventListener("dragstart", event => {
    card.classList.add("dragging");
    event.dataTransfer.setData("text/task-id", task.id);
    event.dataTransfer.effectAllowed = "copy";
  });
  card.addEventListener("dragend", () => card.classList.remove("dragging"));
  return card;
}

function createLinkedWorkCard(item) {
  const card = document.createElement("article");
  card.className = "task-card in_progress linked-work-card";
  card.draggable = true;
  card.dataset.entryId = item.entryId;
  card.innerHTML = `
    <button class="task-check" title="标记此投入事项完成"></button>
    <div class="task-body">
      <strong>${escapeHtml(item.title)}</strong>
      <span class="task-parent-path">所属计划：${escapeHtml(item.parentTitle)}</span>
      <div class="task-meta">
        <span>历史投入</span>
        <span>${escapeHtml(item.dateKey)}</span>
        <span>可打开、关闭或拖到日程</span>
      </div>
    </div>
    <button class="task-menu" title="打开具体待办">•••</button>`;
  card.querySelector(".task-check").addEventListener("click", event => {
    event.stopPropagation();
    const task = materializeLinkedWorkLeaf(item);
    if (task) toggleTaskCompletion(task);
  });
  const openConcreteTask = event => {
    event?.stopPropagation();
    const task = materializeLinkedWorkLeaf(item);
    if (task) {
      saveData();
      render();
      openTaskDialog(task);
    }
  };
  card.querySelector(".task-menu").addEventListener("click", openConcreteTask);
  card.querySelector(".task-body").addEventListener("click", openConcreteTask);
  card.addEventListener("dblclick", event => {
    if (!event.target.closest("button")) openConcreteTask(event);
  });
  card.addEventListener("dragstart", event => {
    card.classList.add("dragging");
    event.dataTransfer.setData("text/entry-id", item.entryId);
    event.dataTransfer.effectAllowed = "copy";
  });
  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
    clearDragHighlights();
  });
  return card;
}

function materializeLinkedWorkLeaf(item) {
  const tasks = uniqueTasks(getAllTasks().map(({ task }) => task));
  let leaf = tasks.find(task =>
    task.parentId === item.taskId &&
    TodoListPolicy.normalizeTitle(task.title) === TodoListPolicy.normalizeTitle(item.title) &&
    isTodoListTask(task)
  );
  if (!leaf) {
    leaf = createTaskFromEntryPayload({
      title: item.title,
      end: 18
    }, item.dateKey, "由历史父级投入转换为可独立管理的具体待办。");
    leaf.parentId = item.taskId;
  }
  Object.values(state.data).forEach(day => {
    (day.entries || []).forEach(entry => {
      if (entry.taskId === item.taskId &&
          entry.entryType === "task_work" &&
          TodoListPolicy.normalizeTitle(entry.title) === TodoListPolicy.normalizeTitle(item.title)) {
        entry.taskId = leaf.id;
      }
    });
  });
  refreshTaskStatusForId(leaf.id);
  saveData();
  return leaf;
}

function updateTaskStats(tasks) {
  tasks = uniqueTasks(tasks).filter(isTodoListTask);
  const groups = {
    unplanned: tasks.filter(isUnplannedTask),
    planned: tasks.filter(task => task.status === "planned" && !isUnplannedTask(task) && !isContainerOnlyTask(task)),
    inProgress: tasks.filter(task => task.status === "in_progress"),
    ended: tasks.filter(task => task.status === "done" || task.status === "closed")
  };
  el.unplannedCount.textContent = groups.unplanned.length;
  el.openCount.textContent = groups.planned.length;
  el.doneCount.textContent = groups.inProgress.length;
  el.closedCount.textContent = groups.ended.length;
  el.allCount.textContent = tasks.length;
  el.taskCount.textContent = tasks.length;
  const activeTotal = groups.planned.length + groups.inProgress.length + groups.ended.length;
  const completed = tasks.filter(task => task.status === "done").length;
  const progress = activeTotal ? Math.round(completed / activeTotal * 100) : 0;
  el.progressLabel.textContent = `${progress}%`;
  el.progressBar.style.width = `${progress}%`;
  const planned = taskDatesForView().reduce((sum, key) =>
    sum + getDay(key).entries.reduce((sub, entry) => sub + entry.end - entry.start, 0), 0);
  el.plannedHours.textContent = formatHours(planned);
}

function tasksInMonth(date) {
  return uniqueTasks(datesInMonth(date).flatMap(key => tasksForDateScope(key)))
    .filter(task => !isHiddenFutureRecurringInstance(task));
}

function datesInMonth(date) {
  const prefix = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  return Object.keys(state.data)
    .filter(key => key.startsWith(prefix))
    .concat(Array.from({ length: new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() }, (_, i) =>
      `${prefix}-${String(i + 1).padStart(2, "0")}`
    ))
    .filter((key, index, arr) => arr.indexOf(key) === index)
    .sort();
}

function tasksForDateScope(dateKey) {
  const tasks = [];
  tasks.push(...(state.data[dateKey]?.tasks || []));
  getAllTasks().forEach(({ task }) => {
    if (isHiddenFutureRecurringInstance(task)) return;
    if (task.dueDate === dateKey) tasks.push(task);
    if (isTaskStartedOnDate(task, dateKey)) tasks.push(task);
    if (task.completedAt && toDateKey(new Date(task.completedAt)) === dateKey) tasks.push(task);
  });
  (getDay(dateKey).entries || []).forEach(entry => {
    if (!entry.taskId) return;
    const linked = findTask(entry.taskId)?.task;
    if (linked && !isHiddenFutureRecurringInstance(linked)) tasks.push(linked);
  });
  return RecurringPolicy.dedupeRecurringTasksForDisplay(uniqueTasks(tasks));
}

function isTaskStartedOnDate(task, dateKey) {
  if (!task) return false;
  const startIso = task.startOverrideAt || task.startedAt;
  if (!startIso) return false;
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return false;
  return toDateKey(start) === dateKey;
}

function uniqueTasks(tasks) {
  return [...new Map(tasks.filter(Boolean).map(task => [task.id, task])).values()];
}

function isHiddenFutureRecurringInstance(task) {
  if (!task?.recurrenceGroupId || task.recurrence?.frequency !== "monthly") return false;
  const currentMonth = RecurringPolicy.currentMonthKey();
  const taskMonth = task.dueDate?.slice(0, 7);
  if (!taskMonth || taskMonth === currentMonth) return false;
  if (["done", "closed", "in_progress"].includes(task.status)) return false;
  return RecurringPolicy.isFutureRecurringInstance(taskMonth, currentMonth);
}

function renderMonthCalendar() {
  const selected = fromDateKey(state.selectedDate);
  const first = new Date(selected.getFullYear(), selected.getMonth(), 1);
  const start = addDays(first, -first.getDay());
  const calendar = document.createElement("div");
  calendar.className = "month-calendar";
  ["日", "一", "二", "三", "四", "五", "六"].forEach(name => {
    const head = document.createElement("div");
    head.className = "month-weekday";
    head.textContent = name;
    calendar.appendChild(head);
  });
  for (let i = 0; i < 42; i++) {
    const date = addDays(start, i);
    const key = toDateKey(date);
    const tasks = (state.data[key]?.tasks || []).filter(task => !isHiddenFutureRecurringInstance(task));
    const cell = document.createElement("div");
    cell.className = "month-cell";
    if (date.getMonth() !== selected.getMonth()) cell.classList.add("outside");
    if (key === state.selectedDate) cell.classList.add("selected");
    if (isToday(date)) cell.classList.add("today");
    cell.innerHTML = `<span class="month-date">${date.getDate()}</span>
      <div class="month-task-dots">${tasks.slice(0, 6).map(task => `<i class="${task.status === "done" ? "done" : ""}"></i>`).join("")}</div>
      ${tasks.length ? `<div class="month-more">${tasks.length} 项</div>` : ""}`;
    cell.addEventListener("click", () => selectDate(date));
    calendar.appendChild(cell);
  }
  el.taskList.appendChild(calendar);
}

function openTaskDialog(task = null) {
  state.editingTaskId = task?.id || null;
  el.taskDialogEyebrow.textContent = task ? "EDIT TASK" : "NEW TASK";
  el.taskDialogTitle.textContent = task ? "编辑待办" : "新建待办";
  el.taskTitleInput.value = task?.title || "";
  el.taskDueDate.value = task?.dueDate || "";
  el.taskDueTime.value = task?.dueTime || "";
  el.taskOwner.value = task?.owner || "我";
  el.taskPriority.value = task?.priority || "general_daily";
  el.taskProgress.value = task?.progress || 0;
  el.taskProgressValue.textContent = `${task?.progress || 0}%`;
  el.taskStatus.value = task?.status || "planned";
  el.taskActualStart.value = toLocalDateTimeInput(task?.startOverrideAt || task?.startedAt);
  el.taskActualEnd.value = toLocalDateTimeInput(task?.completedAt);
  el.taskBusinessBackground.value = task?.businessBackground || "";
  el.taskProblemReason.value = task?.problemReason || "";
  el.taskDeliveryNote.value = task?.deliveryNote || "";
  el.taskDescription.value = task?.description || "";
  el.taskMonthlyRecurring.checked = task?.recurrence?.frequency === "monthly";
  el.taskRecurringUntil.value = task?.recurrence?.until || defaultRecurringUntil(task?.dueDate || state.selectedDate);
  fillParentOptions(task);
  el.taskParent.value = task?.parentId || "";
  el.deleteTaskButton.classList.toggle("hidden", !task);
  el.mergeTaskButton?.classList.toggle("hidden", !task);
  el.closeTaskButton.classList.toggle("hidden", !task);
  el.closeTaskButton.textContent = task && ["done", "closed"].includes(task.status) ? "恢复任务" : "关闭任务";
  updateProgressAvailability();
  updateParentRequirements();
  updateRecurringOptions();
  renderTaskDetailSummary(task);
  el.taskDialog.showModal();
  setTimeout(() => el.taskTitleInput.focus(), 50);
}

function openTaskDialogForDate(dateKey) {
  state.selectedDate = dateKey;
  openTaskDialog();
  el.taskDueDate.value = dateKey;
  el.taskRecurringUntil.value = defaultRecurringUntil(dateKey);
  updateRecurringOptions();
  renderWeek();
}

function renderTaskDetailSummary(task) {
  el.taskDetailSummary.classList.toggle("hidden", !task);
  if (!task) {
    el.taskDetailSummary.innerHTML = "";
    return;
  }
  const allTasks = getAllTasks().map(({ task }) => task);
  const hierarchyPath = TaskOptionPolicy.taskHierarchyPath({ task, tasks: allTasks, separator: " › " });
  const duration = getTaskDuration(task.id);
  const schedule = getTaskScheduleInfo(task.id);
  const latestProgress = latestTaskProgressNote(task.id);
  const rows = [
    ["状态", statusLabel(task.status)],
    ["优先级", priorityLabel(task.priority)],
    ["责任人", task.owner || "未指定"],
    ["目标", formatDue(task)],
    ["任务层级", hierarchyPath || "顶层任务"],
    ["实际开始", task.startedAt ? formatDateTime(task.startedAt) : "未开始"],
    ["实际完成", task.completedAt ? formatDateTime(task.completedAt) : "未完成"],
    ["累计投入", duration ? formatHours(duration) : "0 小时"],
    ["进度", `${task.progress || 0}%`]
  ];
  if (schedule?.firstStartIso) rows.push(["最早安排", formatDateTime(schedule.firstStartIso)]);
  if (latestProgress?.note) rows.push(["最近进展", latestProgress.note]);
  el.taskDetailSummary.innerHTML = rows.map(([label, value]) =>
    `<div><span>${label}</span><strong>${escapeHtml(String(value))}</strong></div>`
  ).join("");
}

function fillParentOptions(editingTask) {
  el.taskParent.innerHTML = `<option value="">不选择，作为顶层任务</option>`;
  const tasks = getAllTasks().map(({ task }) => task);
  TaskOptionPolicy.parentTaskOptionCandidates({
    tasks,
    editingTaskId: editingTask?.id || "",
    isHiddenFutureRecurringInstance
  }).forEach(task => {
    const path = TaskOptionPolicy.taskHierarchyPath({ task, tasks, separator: " › " });
    const date = task.dueDate ? task.dueDate.slice(5) : "未计划";
    el.taskParent.add(new Option(`${date} · ${path}`, task.id));
  });
}

function saveTask() {
  el.taskEditForm.querySelectorAll(".field-error").forEach(field => field.classList.remove("field-error"));
  const payload = {
    title: el.taskTitleInput.value.trim(),
    dueDate: el.taskDueDate.value,
    dueTime: el.taskDueTime.value,
    owner: el.taskOwner.value.trim() || "未指定",
    parentId: el.taskParent.value,
    priority: el.taskPriority.value,
    progress: Number(el.taskProgress.value),
    status: el.taskStatus.value,
    startedAt: fromLocalDateTimeInput(el.taskActualStart.value),
    startOverrideAt: fromLocalDateTimeInput(el.taskActualStart.value),
    completedAt: fromLocalDateTimeInput(el.taskActualEnd.value),
    businessBackground: el.taskBusinessBackground.value.trim(),
    problemReason: el.taskProblemReason.value.trim(),
    deliveryNote: el.taskDeliveryNote.value.trim(),
    recurrence: el.taskMonthlyRecurring.checked ? {
      frequency: "monthly",
      dayOfMonth: el.taskDueDate.value ? Number(el.taskDueDate.value.slice(-2)) : null,
      until: el.taskRecurringUntil.value
    } : null,
    description: el.taskDescription.value.trim()
  };
  if (!payload.title) return showTaskFieldError(el.taskTitleInput, "请填写待办名称");
  if (payload.parentId && state.editingTaskId) {
    const tasks = getAllTasks().map(({ task }) => task);
    const invalidParentIds = new Set([state.editingTaskId, ...TaskOptionPolicy.descendantTaskIds({ tasks, parentId: state.editingTaskId })]);
    if (invalidParentIds.has(payload.parentId)) return showTaskFieldError(el.taskParent, "不能选择自己或下级任务作为上级");
  }
  if (payload.dueTime && !payload.dueDate) return showTaskFieldError(el.taskDueDate, "填写目标时间时，请同时选择目标日期");
  if (payload.dueDate && !payload.dueTime) payload.dueTime = "18:00";
  if (payload.recurrence && !payload.dueDate) return showTaskFieldError(el.taskDueDate, "月度固定任务需要选择首次目标日期");
  if (payload.recurrence && !payload.recurrence.until) {
    return showTaskFieldError(el.taskRecurringUntil, "请选择月度规则有效至哪个月");
  }
  if (payload.recurrence && payload.recurrence.until < payload.dueDate.slice(0, 7)) {
    return showTaskFieldError(el.taskRecurringUntil, "结束月份不能早于首次截止月份");
  }
  if (payload.completedAt) {
    payload.status = "done";
    payload.progress = 100;
  } else if (!["done", "closed"].includes(payload.status)) {
    payload.status = getAutomaticTaskStatusForPayload(state.editingTaskId, payload);
  }
  const effectiveStartedAt = payload.startedAt || getTaskScheduleInfo(state.editingTaskId)?.firstStartIso || "";
  if (payload.completedAt && effectiveStartedAt && new Date(payload.completedAt) < new Date(effectiveStartedAt)) {
    return showTaskFieldError(el.taskActualEnd, "实际完成时间不能早于实际开始时间");
  }
  if (payload.status === "in_progress" && !payload.startedAt) payload.startedAt = getTaskScheduleInfo(state.editingTaskId)?.firstStartIso || new Date().toISOString();
  if (["done", "closed"].includes(payload.status) && !payload.completedAt) payload.completedAt = new Date().toISOString();
  if (["done", "closed"].includes(payload.status) && !payload.startedAt) payload.startedAt = effectiveStartedAt;
  if (payload.status === "done") payload.progress = 100;
  if (payload.status === "planned") payload.progress = 0;

  if (state.editingTaskId) {
    const found = findTask(state.editingTaskId);
    if (!found) return;
    if (!["done", "closed"].includes(payload.status)) payload.completedAt = "";
    Object.assign(found.task, payload);
    found.task.updatedAt = new Date().toISOString();
    const targetTaskDate = payload.dueDate || found.dateKey || state.selectedDate;
    if (found.dateKey !== targetTaskDate) {
      state.data[found.dateKey].tasks = state.data[found.dateKey].tasks.filter(item => item.id !== found.task.id);
      getDay(targetTaskDate).tasks.push(found.task);
    }
  } else {
    const newTasks = buildRecurringTasks(payload);
    newTasks.forEach(task => getDay(task.dueDate || state.selectedDate).tasks.push(task));
  }
  saveData();
  el.taskDialog.close();
  render();
  showToast(state.editingTaskId ? "待办已更新" :
    payload.recurrence ? "月度规则已建立，本月实例已生成" :
    payload.parentId ? "子计划已建立" : "主计划已建立");
}

function showTaskFieldError(field, message) {
  field.classList.add("field-error");
  field.scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => field.focus({ preventScroll: true }), 180);
  showToast(message);
}

function openProgressReview() {
  const activeTasks = getAllTasks()
    .filter(({ task }) => task.status === "in_progress")
    .sort((a, b) => `${a.task.dueDate} ${a.task.dueTime}`.localeCompare(`${b.task.dueDate} ${b.task.dueTime}`));

  el.progressReviewList.innerHTML = "";
  if (!activeTasks.length) {
    el.progressReviewList.innerHTML = `<div class="empty-state">当前没有进行中的任务<br>将计划任务拖入具体日程后，会出现在这里</div>`;
    el.progressReviewForm.querySelector('button[type="submit"]').disabled = true;
  } else {
    el.progressReviewForm.querySelector('button[type="submit"]').disabled = false;
    activeTasks.forEach(({ task }) => {
      const parent = task.parentId ? findTask(task.parentId)?.task : null;
      const card = document.createElement("section");
      card.className = "progress-review-card";
      card.dataset.taskId = task.id;
      card.innerHTML = `
        <header>
          <div>
            <h4>${escapeHtml(task.title)}</h4>
            <div class="review-meta">
              <span>截止 ${formatDue(task)}</span>
              <span>责任人：${escapeHtml(task.owner || "未指定")}</span>
              <span>${priorityLabel(task.priority)}</span>
              ${parent ? `<span>主计划：${escapeHtml(parent.title)}</span>` : ""}
              <span>已投入 ${formatHours(getTaskDuration(task.id))}</span>
            </div>
          </div>
          <span>${task.startedAt ? `开始于 ${formatDateTime(task.startedAt)}` : ""}</span>
        </header>
        <div class="review-progress-row">
          <input type="range" class="review-progress" min="0" max="100" step="5" value="${task.progress || 0}" />
          <strong class="review-progress-value">${task.progress || 0}%</strong>
        </div>
        <textarea class="review-delivery-note" rows="3" maxlength="500" placeholder="已完成什么、下一步是什么、目前有哪些风险">${escapeHtml(task.deliveryNote || "")}</textarea>`;
      const range = card.querySelector(".review-progress");
      range.addEventListener("input", () => card.querySelector(".review-progress-value").textContent = `${range.value}%`);
      el.progressReviewList.appendChild(card);
    });
  }
  el.progressReviewDialog.showModal();
}

function saveProgressReview() {
  const now = new Date().toISOString();
  el.progressReviewList.querySelectorAll(".progress-review-card").forEach(card => {
    const found = findTask(card.dataset.taskId);
    if (!found) return;
    found.task.progress = Number(card.querySelector(".review-progress").value);
    found.task.deliveryNote = card.querySelector(".review-delivery-note").value.trim();
    found.task.updatedAt = now;
    if (found.task.progress > 100) found.task.progress = 100;
  });
  saveData();
  el.progressReviewDialog.close();
  render();
  showToast("进行中任务进度已更新");
}

function formatDateTime(iso) {
  const date = new Date(iso);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function deleteEditingTask() {
  const found = findTask(state.editingTaskId);
  if (!found) return;
  getAllTasks().forEach(({ task }) => {
    if (task.parentId === found.task.id) task.parentId = "";
  });
  state.data[found.dateKey].tasks = state.data[found.dateKey].tasks.filter(task => task.id !== found.task.id);
  Object.values(state.data).forEach(day => day.entries.forEach(entry => {
    if (entry.taskId === found.task.id) entry.taskId = "";
  }));
  saveData();
  el.taskDialog.close();
  render();
  showToast("待办已删除，原有日程记录已保留");
}

function cancelEditingEntry() {
  const day = getDay();
  const deleted = day.entries.find(entry => entry.id === state.editingEntryId);
  day.entries = day.entries.filter(entry => entry.id !== state.editingEntryId);
  if (deleted?.taskId) {
    const linked = findTask(deleted.taskId)?.task;
    if (linked && !["done", "closed"].includes(linked.status)) {
      applyAutomaticTaskStatus(linked);
      linked.updatedAt = new Date().toISOString();
    }
  }
  saveData();
  el.entryDialog.close();
  render();
  showToast("已取消日程安排，关联待办已回到待办栏");
}

function clearProjectGanttChrome() {
  if (!el.projectGanttChrome) return;
  el.projectGanttChrome.innerHTML = "";
  el.projectGanttChrome.classList.add("hidden");
}

function renderSchedule() {
  el.timeline.className = "timeline";
  if (state.taskView !== "project") {
    el.projectGanttScroll = null;
    el.projectGanttChartTrack = null;
    clearProjectGanttChrome();
  }
  if (state.taskView === "project") return renderProjectSchedule();
  if (state.taskView === "week") return renderWeekSchedule();
  if (state.taskView === "month") return renderMonthSchedule();
  renderDayTimeline();
}

function getAllCalendarEntries() {
  return Object.entries(state.data).flatMap(([dateKey, day]) =>
    (day.entries || [])
      .filter(entry => entry.entryType === "calendar" || !entry.taskId)
      .map(entry => ({ dateKey, entry }))
  ).sort((a, b) => `${a.dateKey} ${a.entry.start}`.localeCompare(`${b.dateKey} ${b.entry.start}`));
}

function getCalendarMeetingSummaries() {
  const groups = new Map();
  getAllCalendarEntries().forEach(({ dateKey, entry }) => {
    const title = String(entry.title || "").trim() || "未命名会议";
    const key = TodoListPolicy.normalizeTitle(title);
    const current = groups.get(key) || { title, entries: [], totalHours: 0 };
    current.entries.push({ dateKey, entry });
    current.totalHours += getEntryInvestedHours(dateKey, entry);
    groups.set(key, current);
  });
  return [...groups.values()].sort((a, b) => a.title.localeCompare(b.title, "zh-CN"));
}

function appendGanttRowPair(labelContainer, chartContainer, pair) {
  labelContainer.appendChild(pair.labelRow);
  chartContainer.appendChild(pair.chartRow);
}

function appendGanttGroupHeading(labelContainer, chartContainer, group, onToggle) {
  const collapsed = state.ganttCollapsedGroups.has(group.status);
  const heading = document.createElement("button");
  heading.className = "project-gantt-group-heading";
  heading.type = "button";
  heading.innerHTML = `<strong><i>${collapsed ? "▸" : "▾"}</i>${group.label}</strong><span>${group.count} 项</span>`;
  heading.addEventListener("click", onToggle);
  labelContainer.appendChild(heading);
  const spacer = document.createElement("div");
  spacer.className = "project-gantt-group-chart-spacer";
  chartContainer.appendChild(spacer);
  return !collapsed;
}

function renderProjectSchedule() {
  const allProjects = getProjectSummaries();
  const projects = ProjectCollapsePolicy.filterProjectsForStatus(allProjects, state.filter);
  const meetings = getCalendarMeetingSummaries();
  el.timeline.innerHTML = "";
  el.timeline.className = "project-gantt";
  if (!projects.length && !meetings.length) {
    el.projectGanttScroll = null;
    el.projectGanttChartTrack = null;
    clearProjectGanttChrome();
    el.timeline.innerHTML = `<div class="empty-state">当前状态下还没有可展示的项目进度</div>`;
    el.loggedHours.textContent = "0h";
    el.freeHours.textContent = "—";
    return;
  }
  const buckets = projectTimelineBuckets(projects, state.projectScale, meetings);
  const taskHours = projects.reduce((sum, project) => sum + project.totalHours, 0);
  const meetingHours = meetings.reduce((sum, meeting) => sum + meeting.totalHours, 0);
  el.loggedHours.textContent = `${trimNumber(taskHours + meetingHours)}h`;
  el.freeHours.textContent = meetings.length
    ? `${projects.length} 项 · ${meetings.length} 会议`
    : `${projects.length} 项`;
  const toolbar = document.createElement("div");
  toolbar.className = "project-gantt-toolbar";
  toolbar.innerHTML = `<div class="project-gantt-toolbar-main">
      <strong>甘特粒度</strong>
      <div class="project-scale-switcher">
        <button type="button" data-scale="day">日</button>
        <button type="button" data-scale="week">周</button>
        <button type="button" data-scale="month">月</button>
      </div>
    </div>
    <div class="gantt-legend">
      <span><i class="legend-span"></i>起止区间</span>
      <span><i class="legend-invested"></i>实际投入</span>
      <span><i class="legend-meeting"></i>会议投入</span>
      <span><i class="legend-start"></i>开始</span>
      <span><i class="legend-end"></i>结束</span>
      <span><i class="legend-cutoff"></i>目标截止</span>
      <span><i class="legend-today"></i>今天</span>
    </div>`;
  toolbar.querySelectorAll(".project-scale-switcher button").forEach(button => {
    button.classList.toggle("active", button.dataset.scale === state.projectScale);
    button.addEventListener("click", () => {
      state.projectScale = button.dataset.scale;
      state.projectViewNeedsAnchor = true;
      state.projectWindowStart = null;
      state.projectWindowEnd = null;
      state.projectGanttLastExtend = null;
      renderSchedule();
    });
  });
  el.projectGanttChrome.innerHTML = "";
  el.projectGanttChrome.appendChild(toolbar);
  el.projectGanttChrome.classList.remove("hidden");

  const ganttRoot = document.createElement("div");
  ganttRoot.className = "project-gantt-root";

  const rowsWrap = document.createElement("div");
  rowsWrap.className = "project-gantt-rows-wrap";

  const split = document.createElement("div");
  split.className = "project-gantt-split";
  split.style.setProperty("--gantt-label-width", `${GANTT_LABEL_WIDTH}px`);

  const labelPane = document.createElement("div");
  labelPane.className = "project-gantt-label-pane";
  const labelHeader = document.createElement("div");
  labelHeader.className = "project-gantt-label-header";
  labelHeader.textContent = "项目 / 任务";
  labelPane.appendChild(labelHeader);
  const labelBody = document.createElement("div");
  labelBody.className = "project-gantt-label-body";
  labelPane.appendChild(labelBody);

  const chartPane = document.createElement("div");
  chartPane.className = "project-gantt-chart-pane";

  const chartTrack = document.createElement("div");
  chartTrack.className = "project-gantt-chart-track";
  el.projectGanttChartTrack = chartTrack;

  const header = document.createElement("div");
  header.className = "project-gantt-days";
  const ganttBucketWidth = state.projectScale === "day" ? 44 : 72;
  header.style.gridTemplateColumns = `repeat(${buckets.length}, ${ganttBucketWidth}px)`;
  const todayBucketKey = projectBucketKey(toDateKey(new Date()), state.projectScale);
  const todayOffset = taskTimelineOffset(toDateKey(new Date()), buckets, state.projectScale);
  header.innerHTML = `${todayOffset === null ? "" : `<u class="gantt-today-line" style="left:${todayOffset}%" title="今天"></u>`}${buckets.map(bucket => `<span${bucket.key === todayBucketKey ? " class=\"is-today\"" : ""}>${bucket.label}</span>`).join("")}`;

  const body = document.createElement("div");
  body.className = "project-gantt-body";
  const ganttContentWidth = buckets.length * ganttBucketWidth;
  header.style.width = `${ganttContentWidth}px`;
  body.style.width = `${ganttContentWidth}px`;
  chartTrack.style.width = `${ganttContentWidth}px`;
  chartTrack.appendChild(header);

  projectStatusGroups(projects).forEach(group => {
    if (!group.projects.length) return;
    const expanded = appendGanttGroupHeading(labelBody, body, {
      status: group.status,
      label: group.label,
      count: group.projects.length
    }, () => toggleGanttGroup(group.status));
    if (!expanded) return;
    const labelGroup = document.createElement("div");
    labelGroup.className = `project-gantt-label-group ${group.status}`;
    const chartGroup = document.createElement("section");
    chartGroup.className = `project-gantt-chart-group ${group.status}`;
    chartGroup.style.width = `${ganttContentWidth}px`;
    group.projects.forEach(project => {
      const progress = ProjectSummaryPolicy.projectProgressPercent(project);
      if (ProjectCollapsePolicy.shouldRenderSingleRow(project)) {
        appendGanttRowPair(labelGroup, chartGroup, createProjectGanttRow(project.parent, buckets, state.projectScale));
        return;
      }
      const sectionCollapsed = state.projectCollapsedSections.has(project.parent.id);
      const parentInvested = [project.parent, ...project.children].flatMap(task =>
        getTaskScheduleEntries(task.id)
          .filter(item => getEntryInvestedHours(item.dateKey, item.entry) > 0)
          .map(item => item.dateKey)
      );
      appendGanttRowPair(labelGroup, chartGroup, createProjectGanttRow(project.parent, buckets, state.projectScale, project.parent.id, {
        progress,
        investedDateKeys: parentInvested,
        isParent: true,
        collapsed: sectionCollapsed
      }));
      if (!sectionCollapsed) {
        ProjectCollapsePolicy.visibleTreeItems({
          tasks: project.children,
          collapsedIds: state.projectCollapsedTasks
        }).forEach(task => appendGanttRowPair(labelGroup, chartGroup, createProjectGanttRow(task, buckets, state.projectScale, project.parent.id)));
      }
    });
    labelBody.appendChild(labelGroup);
    body.appendChild(chartGroup);
  });

  if (meetings.length) {
    const expanded = appendGanttGroupHeading(labelBody, body, {
      status: "meetings",
      label: "会议 / 日程",
      count: meetings.length
    }, () => toggleGanttGroup("meetings"));
    if (expanded) {
      const labelGroup = document.createElement("div");
      labelGroup.className = "project-gantt-label-group meetings";
      const chartGroup = document.createElement("section");
      chartGroup.className = "project-gantt-chart-group meetings";
      chartGroup.style.width = `${ganttContentWidth}px`;
      meetings.forEach(meeting => appendGanttRowPair(labelGroup, chartGroup, createCalendarGanttRow(meeting, buckets, state.projectScale)));
      labelBody.appendChild(labelGroup);
      body.appendChild(chartGroup);
    }
  }

  chartTrack.appendChild(body);
  chartPane.appendChild(chartTrack);
  split.appendChild(labelPane);
  split.appendChild(chartPane);
  rowsWrap.appendChild(split);

  const hscroll = document.createElement("div");
  hscroll.className = "project-gantt-hscroll";
  el.projectGanttScroll = hscroll;
  hscroll.addEventListener("scroll", handleProjectGanttScroll, { passive: true });
  const hscrollInner = document.createElement("div");
  hscrollInner.className = "project-gantt-hscroll-inner";
  hscrollInner.style.width = `${ganttContentWidth}px`;
  hscroll.appendChild(hscrollInner);

  ganttRoot.appendChild(rowsWrap);
  ganttRoot.appendChild(hscroll);
  el.timeline.appendChild(ganttRoot);
  bindProjectDrop(body, buckets, ganttBucketWidth);
  syncProjectGanttChartOffset(state.projectScrollLeft || 0);
  if (state.projectViewNeedsAnchor) {
    state.projectViewNeedsAnchor = false;
    requestAnimationFrame(() => {
      const currentKey = state.projectScale === "month"
        ? (state.projectAnchorDate || toDateKey(new Date())).slice(0, 7)
        : state.projectScale === "week"
          ? toDateKey(getMonday(fromDateKey(state.projectAnchorDate || toDateKey(new Date()))))
          : (state.projectAnchorDate || toDateKey(new Date()));
      const viewportWidth = getProjectGanttScroller().clientWidth || 1;
      const target = state.projectScale === "month"
        ? Math.max(0, ProjectViewPolicy.anchorScrollLeft({
          buckets,
          anchorKey: currentKey,
          bucketWidth: ganttBucketWidth
        }) - Math.round(viewportWidth * 0.24))
        : ProjectViewPolicy.centeredScrollLeft({
          buckets,
          anchorKey: currentKey,
          bucketWidth: ganttBucketWidth,
          viewportWidth
        });
      setProjectScrollLeft(target);
    });
  } else if (state.projectScrollLeft !== null) {
    const savedScrollLeft = state.projectScrollLeft;
    requestAnimationFrame(() => setProjectScrollLeft(savedScrollLeft));
  }
}

function ganttSegmentPolicyArgs(buckets, scale) {
  return {
    buckets,
    projectBucketKey: dateKey => projectBucketKey(dateKey, scale),
    scale,
    getMonday,
    fromDateKey
  };
}

function ganttSegmentLabel(segment, buckets) {
  if (segment.startIndex === undefined) return "有投入";
  return buckets[segment.startIndex].label === buckets[segment.endIndex].label
    ? buckets[segment.startIndex].label
    : `${buckets[segment.startIndex].label} ~ ${buckets[segment.endIndex].label}`;
}

function mapGanttSegments(segments, buckets) {
  return segments.map(segment => ({
    left: segment.leftRatio * 100,
    width: segment.widthRatio * 100,
    label: ganttSegmentLabel(segment, buckets)
  }));
}

function syncProjectGanttChartOffset(scrollLeft = state.projectScrollLeft || 0) {
  const next = Math.max(0, Number(scrollLeft) || 0);
  if (el.projectGanttChartTrack) el.projectGanttChartTrack.style.transform = `translateX(-${next}px)`;
}

function setProjectScrollLeft(value) {
  const next = Math.max(0, Number(value) || 0);
  const scroller = getProjectGanttScroller();
  if (scroller) scroller.scrollLeft = next;
  state.projectScrollLeft = next;
  syncProjectGanttChartOffset(next);
}

function createProjectGanttRow(task, buckets, scale = "day", rootId = "", options = {}) {
  const actual = taskActualTimelineParts(task, buckets, scale, options);
  const cutoff = task.dueDate ? taskTimelineOffset(task.dueDate, buckets, scale) : null;
  const showDueFlag = ProjectViewPolicy.shouldShowDueFlag(task.status) && cutoff !== null;
  const hasChildren = options.isParent || getChildTasks(task.id).length > 0;
  const collapsed = options.isParent ? Boolean(options.collapsed) : state.projectCollapsedTasks.has(task.id);
  const progress = options.progress ?? ProjectSummaryPolicy.taskProgressPercent({
    status: task.status,
    investedHours: getTaskDuration(task.id),
    scheduledHours: getTaskScheduledHours(task.id)
  });
  const labelRow = document.createElement("div");
  labelRow.className = `project-gantt-row-label ${task.status}${options.isParent ? " is-parent" : ""}`;
  labelRow.style.setProperty("--task-depth", getTaskDepth(task, rootId));
  labelRow.innerHTML = `<div class="project-gantt-title is-title-pin">
        ${hasChildren ? `<button class="project-collapse-button task-tree-toggle" type="button">${collapsed ? "▸" : "▾"}</button>` : ""}
        <strong title="${escapeHtml(task.title)}">${escapeHtml(task.title)}</strong>
      </div>`;
  const chartRow = document.createElement("div");
  chartRow.className = `project-gantt-row-chart ${task.status}${options.isParent ? " is-parent" : ""}`;
  chartRow.draggable = !["done", "closed"].includes(task.status);
  chartRow.addEventListener("dragstart", event => {
    event.dataTransfer.setData("text/task-id", task.id);
    event.dataTransfer.effectAllowed = "copy";
    chartRow.classList.add("dragging");
  });
  chartRow.addEventListener("dragend", () => chartRow.classList.remove("dragging"));
  chartRow.innerHTML = `<div class="project-gantt-lane">
      ${actual.span ? `<i class="gantt-span-track" style="left:${actual.span.left}%;width:${actual.span.width}%"></i>
      <i class="gantt-progress-fill" style="left:${actual.span.left}%;width:${actual.span.fill}%" title="进度 ${progress}%"></i>
      ${actual.span.fill > 0 && !options.isParent ? `<span class="gantt-progress-pct" style="left:${actual.span.left}%;width:${actual.span.fill}%">${progress}%</span>` : ""}` : ""}
      ${actual.segments.map(segment => `<i class="gantt-actual-bar" style="left:${segment.left}%;width:${segment.width}%" title="有投入：${escapeHtml(segment.label)}"></i>`).join("")}
      ${actual.start ? `<u class="gantt-start-marker" style="left:${actual.start.offset}%" title="开始：${actual.start.dateKey}"></u>` : ""}
      ${actual.end ? `<u class="gantt-end-marker" style="left:${actual.end.offset}%" title="结束：${actual.end.dateKey}"></u>` : ""}
      ${showDueFlag ? `<u class="gantt-cutoff-flag" style="left:${cutoff}%" title="目标截止：${formatDue(task)}"></u>` : ""}
    </div>`;
  const openTask = () => openTaskDialog(task);
  labelRow.querySelector(".task-tree-toggle")?.addEventListener("click", event => {
    event.stopPropagation();
    if (options.isParent) toggleProjectSection(task.id);
    else toggleProjectTask(task.id);
  });
  labelRow.addEventListener("dblclick", openTask);
  chartRow.addEventListener("dblclick", openTask);
  return { labelRow, chartRow };
}

function calendarMeetingTimelineParts(meeting, buckets, scale = "day") {
  const investedDateKeys = meeting.entries
    .filter(({ dateKey, entry }) => getEntryInvestedHours(dateKey, entry) > 0)
    .map(({ dateKey }) => dateKey);
  const segments = mapGanttSegments(
    ProjectViewPolicy.investmentSegments({
      investedDateKeys,
      ...ganttSegmentPolicyArgs(buckets, scale)
    }),
    buckets
  );
  return { segments };
}

function createCalendarGanttRow(meeting, buckets, scale = "day") {
  const parts = calendarMeetingTimelineParts(meeting, buckets, scale);
  const labelRow = document.createElement("div");
  labelRow.className = "project-gantt-row-label meeting";
  labelRow.innerHTML = `<div class="project-gantt-title is-title-pin is-meeting">
      <strong title="${escapeHtml(meeting.title)}">${escapeHtml(meeting.title)}</strong>
    </div>`;
  const chartRow = document.createElement("div");
  chartRow.className = "project-gantt-row-chart meeting";
  chartRow.innerHTML = `<div class="project-gantt-lane">
      ${parts.segments.map(segment => `<i class="gantt-meeting-bar" style="left:${segment.left}%;width:${segment.width}%" title="会议投入：${escapeHtml(segment.label)}"></i>`).join("")}
    </div>`;
  const openMeeting = () => {
    const first = meeting.entries[0];
    if (first) openEntryDialog(first.entry.start, first.entry);
  };
  labelRow.addEventListener("dblclick", openMeeting);
  chartRow.addEventListener("dblclick", openMeeting);
  return { labelRow, chartRow };
}

function closeEditingTask() {
  const task = state.editingTaskId ? findTask(state.editingTaskId)?.task : null;
  if (!task) return;
  el.taskDialog.close();
  toggleTaskCompletion(task);
}

function toggleTaskCompletion(task) {
  if (!task) return;
  const closing = !["done", "closed"].includes(task.status);
  const now = new Date().toISOString();
  const firstStartIso = getTaskScheduleInfo(task.id)?.firstStartIso || task.startOverrideAt || task.startedAt || "";
  const nextStatus = closing ? "done" : getAutomaticTaskStatus(task.id);
  updateTaskRecords(task.id, record => {
    record.status = nextStatus;
    record.completedAt = closing ? now : "";
    if (closing && !record.startedAt && firstStartIso) record.startedAt = firstStartIso;
    record.progress = closing ? 100 : ProjectSummaryPolicy.taskProgressPercent({
      status: nextStatus,
      investedHours: getTaskDuration(task.id),
      scheduledHours: getTaskScheduledHours(task.id)
    });
    record.updatedAt = now;
  });
  saveData();
  render();
  showToast(closing ? "任务已关闭" : "任务已恢复");
}

function taskTimelineOffset(dateKey, buckets, scale = "day") {
  const keys = buckets.map(bucket => bucket.key);
  const index = keys.indexOf(projectBucketKey(dateKey, scale));
  if (index < 0) return null;
  return buckets.length ? ((index + .5) / buckets.length) * 100 : 0;
}

function taskActualTimelineParts(task, buckets, scale = "day", options = {}) {
  const toBucket = dateKey => projectBucketKey(dateKey, scale);
  const investedDateKeys = options.investedDateKeys || getTaskScheduleEntries(task.id)
    .filter(item => getEntryInvestedHours(item.dateKey, item.entry) > 0)
    .map(item => item.dateKey);
  const segments = mapGanttSegments(
    ProjectViewPolicy.investmentSegments({
      investedDateKeys,
      ...ganttSegmentPolicyArgs(buckets, scale)
    }),
    buckets
  );
  const isEnded = ["done", "closed"].includes(task.status) || Boolean(task.completedAt);
  const boundary = ProjectViewPolicy.boundaryDateKeys({
    investedDateKeys,
    startedDateKey: task.startOverrideAt || task.startedAt
      ? toDateKey(new Date(task.startOverrideAt || task.startedAt))
      : "",
    completedDateKey: task.completedAt ? toDateKey(new Date(task.completedAt)) : "",
    isEnded
  });
  const progress = options.progress ?? ProjectSummaryPolicy.taskProgressPercent({
    status: task.status,
    investedHours: getTaskDuration(task.id),
    scheduledHours: getTaskScheduledHours(task.id)
  });
  const span = ProjectViewPolicy.progressSpan({
    startDateKey: boundary.start,
    endDateKey: boundary.end,
    todayKey: toDateKey(new Date()),
    isEnded,
    progress,
    ...ganttSegmentPolicyArgs(buckets, scale)
  });
  const startRatio = boundary.start
    ? ProjectViewPolicy.markerRatio({
      dateKey: ProjectViewPolicy.displayMarkerDateKey(boundary.start, -1, addDays, fromDateKey, toDateKey),
      buckets,
      projectBucketKey: toBucket,
      edge: "start"
    })
    : null;
  const endRatio = boundary.end
    ? ProjectViewPolicy.markerRatio({
      dateKey: ProjectViewPolicy.displayMarkerDateKey(boundary.end, -1, addDays, fromDateKey, toDateKey),
      buckets,
      projectBucketKey: toBucket,
      edge: "end"
    })
    : null;
  return {
    segments,
    span: span ? { left: span.leftRatio * 100, width: span.widthRatio * 100, fill: span.fillRatio * 100 } : null,
    start: startRatio === null ? null : { offset: startRatio * 100, dateKey: boundary.start },
    end: endRatio === null ? null : { offset: endRatio * 100, dateKey: boundary.end }
  };
}

function toggleProjectSection(projectId) {
  if (state.projectCollapsedSections.has(projectId)) state.projectCollapsedSections.delete(projectId);
  else state.projectCollapsedSections.add(projectId);
  renderSchedule();
}

function toggleProjectTask(taskId) {
  if (state.projectCollapsedTasks.has(taskId)) state.projectCollapsedTasks.delete(taskId);
  else state.projectCollapsedTasks.add(taskId);
  renderSchedule();
}

function getTaskDepth(task, rootId = "") {
  if (!task?.parentId || task.id === rootId) return 0;
  let depth = 0;
  let current = task;
  const visited = new Set();
  while (current?.parentId && current.id !== rootId && !visited.has(current.id)) {
    visited.add(current.id);
    depth += 1;
    current = findTask(current.parentId)?.task;
  }
  return Math.max(0, depth - (rootId ? 1 : 0));
}

function renderDayTimeline() {
  const day = getDay();
  el.timeline.innerHTML = "";
  HOURS.forEach(hour => {
    const row = document.createElement("div");
    row.className = "time-row";
    row.innerHTML = `<div class="time-label">${String(hour).padStart(2, "0")}:00</div><div class="time-slot" data-hour="${hour}"></div>`;
    const slot = row.querySelector(".time-slot");
    slot.addEventListener("click", event => event.target === slot && openEntryDialog(hour));
    slot.addEventListener("dragover", event => { event.preventDefault(); slot.classList.add("drag-over"); });
    slot.addEventListener("dragleave", () => slot.classList.remove("drag-over"));
    slot.addEventListener("drop", event => {
      event.preventDefault();
      clearScheduleDragOver();
      handleScheduleDropData(state.selectedDate, hour, event);
    });
    el.timeline.appendChild(row);
  });
  const layoutItems = layoutOverlappingEntries(day.entries);
  layoutItems.forEach(({ entry, column, columns }) => {
    const item = document.createElement("article");
    const top = (entry.start - HOURS[0]) * getHourHeight() + 3;
    const height = (entry.end - entry.start) * getHourHeight() - 6;
    item.className = `schedule-entry ${entry.color || "sage"}`;
    item.draggable = true;
    item.dataset.entryId = entry.id;
    if (columns >= 3) item.classList.add("dense");
    if (columns >= 4) item.classList.add("very-dense");
    item.style.top = `${top}px`;
    item.style.height = `${Math.max(height, 38)}px`;
    item.style.setProperty("--entry-column", column);
    item.style.setProperty("--entry-columns", columns);
    item.innerHTML = `<strong>${escapeHtml(entry.title)} <small class="schedule-entry-type">${entry.taskId ? "任务投入" : "会议 / 日程"}</small></strong>
      ${entry.note ? `<p>${escapeHtml(entry.note)}</p>` : ""}`;
    item.addEventListener("click", () => openEntryDialog(entry.start, entry));
    item.addEventListener("dragstart", event => {
      event.stopPropagation();
      event.dataTransfer.setData("text/entry-id", entry.id);
      event.dataTransfer.effectAllowed = "copy";
      item.classList.add("dragging");
    });
    item.addEventListener("dragend", () => item.classList.remove("dragging"));
    el.timeline.appendChild(item);
  });
  if (isToday(fromDateKey(state.selectedDate))) {
    const now = new Date();
    const current = now.getHours() + now.getMinutes() / 60;
    if (current >= HOURS[0] && current <= HOURS.at(-1) + 1) {
      const line = document.createElement("div");
      line.className = "current-time-line";
      line.style.top = `${(current - HOURS[0]) * getHourHeight()}px`;
      el.timeline.appendChild(line);
    }
  }
  const logged = day.entries.reduce((sum, entry) => sum + getEntryInvestedHours(state.selectedDate, entry), 0);
  const scheduled = day.entries.reduce((sum, entry) => sum + entry.end - entry.start, 0);
  el.loggedHours.textContent = `${trimNumber(logged)}h`;
  el.freeHours.textContent = `${trimNumber(Math.max(0, HOURS.length - scheduled))}h`;
}

function layoutOverlappingEntries(entries) {
  const sorted = [...entries].sort((a, b) => a.start - b.start || a.end - b.end);
  const clusters = [];
  let current = [];
  let clusterEnd = -Infinity;
  sorted.forEach(entry => {
    if (!current.length || entry.start < clusterEnd) {
      current.push(entry);
      clusterEnd = Math.max(clusterEnd, entry.end);
    } else {
      clusters.push(current);
      current = [entry];
      clusterEnd = entry.end;
    }
  });
  if (current.length) clusters.push(current);

  return clusters.flatMap(cluster => {
    const activeColumns = [];
    let maxColumns = 1;
    const assigned = cluster.map(entry => {
      for (let i = activeColumns.length - 1; i >= 0; i--) {
        if (activeColumns[i] && activeColumns[i].end <= entry.start) activeColumns[i] = null;
      }
      let column = activeColumns.findIndex(item => !item);
      if (column === -1) column = activeColumns.length;
      activeColumns[column] = entry;
      maxColumns = Math.max(maxColumns, activeColumns.filter(Boolean).length, column + 1);
      return { entry, column };
    });
    return assigned.map(item => ({ ...item, columns: maxColumns }));
  });
}

function renderWeekSchedule() {
  const monday = getMonday(fromDateKey(state.selectedDate));
  el.timeline.innerHTML = "";
  el.timeline.className = "week-schedule";
  let logged = 0;
  let scheduled = 0;
  for (let i = 0; i < 7; i++) {
    const date = addDays(monday, i);
    const key = toDateKey(date);
    const column = document.createElement("section");
    column.className = `week-schedule-day${key === state.selectedDate ? " selected" : ""}${i >= 5 ? " weekend" : ""}`;
    const dayEntries = WeekEntryPolicy.sortEntries(getDay(key).entries || []);
    const overviewItems = scheduleOverviewItemsForDate(key);
    column.innerHTML = `<h4>${WEEKDAY_NAMES[date.getDay()]} · ${date.getMonth() + 1}/${date.getDate()}</h4>
      <button type="button" class="week-add-task" data-date="${key}">＋ 新建待办</button>
      ${renderDayOverviewList(overviewItems, "week")}`;
    column.querySelector(".week-add-task").addEventListener("click", event => {
      event.stopPropagation();
      openTaskDialogForDate(key);
    });
    bindScheduleDrop(column, key, 9);
    bindDayOverviewList(column);
    const entries = dayEntries;
    entries.forEach(entry => {
      logged += getEntryInvestedHours(key, entry);
      scheduled += entry.end - entry.start;
    });
    if (!overviewItems.length) column.insertAdjacentHTML("beforeend", `<div class="empty-state">暂无任务</div>`);
    column.addEventListener("dblclick", event => {
      if (event.target === column) {
        state.selectedDate = key;
        render();
      }
    });
    el.timeline.appendChild(column);
  }
  el.loggedHours.textContent = `${trimNumber(logged)}h`;
  el.freeHours.textContent = `${trimNumber(Math.max(0, 7 * HOURS.length - scheduled))}h`;
}

function renderMonthSchedule() {
  const selected = fromDateKey(state.selectedDate);
  const first = new Date(selected.getFullYear(), selected.getMonth(), 1);
  const start = addDays(first, -first.getDay());
  el.timeline.innerHTML = "";
  el.timeline.className = "schedule-month-calendar";
  WEEKDAY_NAMES.forEach(name => {
    const head = document.createElement("div");
    head.className = "schedule-month-weekday";
    head.textContent = name;
    el.timeline.appendChild(head);
  });
  let logged = 0;
  for (let i = 0; i < 42; i++) {
    const date = addDays(start, i);
    const key = toDateKey(date);
    const entries = getDay(key).entries || [];
    const monthItems = scheduleOverviewItemsForDate(key);
    entries.forEach(entry => logged += getEntryInvestedHours(key, entry));
    const cell = document.createElement("section");
    cell.className = "schedule-month-cell";
    if (date.getMonth() !== selected.getMonth()) cell.classList.add("outside");
    if (key === state.selectedDate) cell.classList.add("selected");
    if (isToday(date)) cell.classList.add("today");
    cell.innerHTML = `<header><span>${date.getDate()}</span><span>${holidayLabel(key)}</span></header>
      ${renderDayOverviewList(monthItems, "month")}`;
    bindScheduleDrop(cell, key, 9);
    cell.addEventListener("click", () => {
      state.selectedDate = key;
      state.taskView = "day";
      el.viewSwitcher.querySelectorAll("button").forEach(item => item.classList.toggle("active", item.dataset.view === "day"));
      render();
    });
    bindDayOverviewList(cell);
    el.timeline.appendChild(cell);
  }
  el.loggedHours.textContent = `${trimNumber(logged)}h`;
  el.freeHours.textContent = "—";
}

function dueTasksForDate(dateKey) {
  return getAllTasks()
    .map(({ task }) => task)
    .filter(task => task.dueDate === dateKey && !["done", "closed"].includes(task.status) && !isHiddenFutureRecurringInstance(task));
}

function completedTasksForDate(dateKey) {
  return getAllTasks()
    .map(({ task }) => task)
    .filter(task => task.completedAt && toDateKey(new Date(task.completedAt)) === dateKey);
}

function taskTracesForDate(dateKey) {
  const traces = new Map();
  dueTasksForDate(dateKey).forEach(task => traces.set(task.id, { task }));
  (getDay(dateKey).entries || []).forEach(entry => {
    if (!entry.taskId) return;
    const found = findTask(entry.taskId)?.task;
    if (!found) return;
    traces.set(found.id, traces.get(found.id) || { task: found });
  });
  completedTasksForDate(dateKey).forEach(task => {
    traces.set(task.id, traces.get(task.id) || { task });
  });
  return RecurringPolicy.dedupeRecurringTasksForDisplay([...traces.values()].map(item => item.task))
    .map(task => ({ task }))
    .sort((a, b) => `${a.task.dueDate || ""} ${a.task.dueTime || ""}`.localeCompare(`${b.task.dueDate || ""} ${b.task.dueTime || ""}`));
}

function scheduleOverviewItemsForDate(dateKey) {
  const taskItems = new Map();
  const meetingItems = [];
  (getDay(dateKey).entries || []).slice().sort((a, b) => a.start - b.start).forEach(entry => {
    if (entry.entryType === "calendar" || !entry.taskId) {
      meetingItems.push({
        type: "meeting",
        title: String(entry.title || "").trim() || "未命名会议",
        kind: getEntryInvestedHours(dateKey, entry) > 0 ? "actual" : "planned",
        entryId: entry.id,
        start: entry.start
      });
      return;
    }
    const task = findTask(entry.taskId)?.task;
    if (!task) return;
    const existing = taskItems.get(task.id);
    const kind = getEntryInvestedHours(dateKey, entry) > 0 ? "actual" : "planned";
    if (!existing) {
      taskItems.set(task.id, {
        type: "task",
        title: String(entry.title || task.title || "").trim() || task.title,
        kind,
        task,
        entryId: entry.id,
        start: entry.start
      });
      return;
    }
    if (kind === "actual") existing.kind = "actual";
    if (entry.start < existing.start) {
      existing.start = entry.start;
      existing.entryId = entry.id;
      existing.title = String(entry.title || task.title || "").trim() || task.title;
    }
  });
  dueTasksForDate(dateKey).filter(task => task.dueTime).forEach(task => {
    if (taskItems.has(task.id)) return;
    taskItems.set(task.id, {
      type: "task",
      title: task.title,
      kind: "planned",
      task,
      entryId: "",
      start: scheduleTimeDecimal(task.dueTime, 99)
    });
  });
  return [...taskItems.values(), ...meetingItems].sort((a, b) =>
    `${String(a.start).padStart(5, "0")} ${a.title}`.localeCompare(`${String(b.start).padStart(5, "0")} ${b.title}`)
  );
}

function scheduleTimeDecimal(value, fallback = 99) {
  if (typeof value === "number") return value;
  if (!value) return fallback;
  const [hours, minutes = "0"] = String(value).split(":");
  const h = Number(hours);
  const m = Number(minutes);
  if (Number.isNaN(h)) return fallback;
  return h + (Number.isNaN(m) ? 0 : m / 60);
}

function overviewItemBadge(item) {
  if (item.type === "meeting") return "会议";
  return item.kind === "actual" ? "进行" : "计划";
}

function renderDayOverviewList(items, mode) {
  if (!items.length) return "";
  const lineClass = mode === "week" ? "week-task-line" : "month-task-line";
  const listClass = mode === "week" ? "week-task-list" : "month-task-list";
  return `<div class="${listClass}">
    ${items.map(item => `<div class="${lineClass} ${item.kind}${item.type === "meeting" ? " meeting" : ""}" draggable="${item.type === "task" && item.task && !["done", "closed"].includes(item.task.status)}" data-task-id="${item.task?.id || ""}" data-entry-id="${escapeHtml(item.entryId || "")}" title="${escapeHtml(item.title)}">
      <b>${overviewItemBadge(item)}</b><span>${escapeHtml(item.title)}</span>
    </div>`).join("")}
  </div>`;
}

function bindDayOverviewList(container) {
  container.querySelectorAll(".week-task-line, .month-task-line").forEach(item => {
    item.addEventListener("click", event => {
      event.stopPropagation();
      const foundEntry = item.dataset.entryId ? findEntry(item.dataset.entryId) : null;
      if (foundEntry) openEntryDialog(foundEntry.entry.start, foundEntry.entry);
      else {
        const task = findTask(item.dataset.taskId)?.task;
        if (task) openTaskDialog(task);
      }
    });
    item.addEventListener("dragstart", event => {
      event.stopPropagation();
      if (item.dataset.entryId) event.dataTransfer.setData("text/entry-id", item.dataset.entryId);
      else if (item.dataset.taskId) event.dataTransfer.setData("text/task-id", item.dataset.taskId);
      event.dataTransfer.effectAllowed = "copy";
      item.classList.add("dragging");
    });
    item.addEventListener("dragend", () => item.classList.remove("dragging"));
  });
}

function renderTaskTraceList(traces, mode) {
  if (!traces.length) return "";
  const limit = Infinity;
  const visible = traces.slice(0, limit);
  const extra = traces.length - visible.length;
  return `<div class="task-trace-list ${mode}" title="当天任务">
    ${visible.map(({ task }) => `<div class="task-trace-item ${task.status}" data-task-id="${task.id}" title="${escapeHtml(task.title)}">
      <strong>${escapeHtml(task.title)}</strong>
    </div>`).join("")}
    ${extra > 0 ? `<div class="due-task-more">+${extra} 项</div>` : ""}
  </div>`;
}

function holidayLabel(dateKey) {
  const holiday = CN_HOLIDAYS[dateKey];
  if (!holiday) return "";
  return `<em class="holiday-badge ${holiday.type}">${holiday.type === "workday" ? "班" : "休"} ${escapeHtml(holiday.name)}</em>`;
}

function renderDueTaskList(tasks, mode) {
  if (!tasks.length) return "";
  const limit = mode === "month" ? 3 : 8;
  const visible = tasks.slice(0, limit);
  const extra = tasks.length - visible.length;
  return `<div class="due-task-list ${mode}" title="当天截止任务">
    <div class="due-task-list-title">计划 / 截止</div>
    ${visible.map(task => `<div class="due-task-item ${task.status}" data-task-id="${task.id}" title="${escapeHtml(task.title)}">
      <span>${escapeHtml(task.title)}</span>
    </div>`).join("")}
    ${extra > 0 ? `<div class="due-task-more">+${extra} 项</div>` : ""}
  </div>`;
}

function renderCompletedTaskList(tasks, mode) {
  if (!tasks.length) return "";
  const limit = mode === "month" ? 2 : 6;
  const visible = tasks.slice(0, limit);
  const extra = tasks.length - visible.length;
  return `<div class="completed-task-list ${mode}" title="当天完成任务">
    <div class="due-task-list-title">完成</div>
    ${visible.map(task => `<div class="completed-task-item" data-task-id="${task.id}" title="${escapeHtml(task.title)}">
      <span>${escapeHtml(task.title)}</span>
    </div>`).join("")}
    ${extra > 0 ? `<div class="due-task-more">+${extra} 项</div>` : ""}
  </div>`;
}

function bindDueTaskList(container, dateKey) {
  container.querySelectorAll(".due-task-item, .completed-task-item, .task-trace-item").forEach(item => {
    const linked = findTask(item.dataset.taskId)?.task;
    item.draggable = Boolean(linked && !["done", "closed"].includes(linked.status));
    item.addEventListener("dragstart", event => {
      const taskId = item.dataset.taskId;
      event.dataTransfer.setData("text/task-id", taskId);
      event.dataTransfer.effectAllowed = "copy";
      item.classList.add("dragging");
    });
    item.addEventListener("dragend", () => item.classList.remove("dragging"));
    item.addEventListener("click", event => {
      event.stopPropagation();
      state.selectedDate = dateKey;
      state.taskView = "day";
      state.filter = "planned";
      el.viewSwitcher.querySelectorAll("button").forEach(button => button.classList.toggle("active", button.dataset.view === "day"));
      render();
      const found = findTask(item.dataset.taskId);
      if (found) openTaskDialog(found.task);
    });
  });
}

function bindScheduleDrop(target, dateKey, hour) {
  target.addEventListener("dragover", event => {
    event.preventDefault();
    target.classList.add("drag-over");
  });
  target.addEventListener("dragleave", () => target.classList.remove("drag-over"));
  target.addEventListener("drop", event => {
    event.preventDefault();
    event.stopPropagation();
    clearScheduleDragOver();
    handleScheduleDropData(dateKey, hour, event);
  });
}

function isAncestorTask(ancestorId, taskId) {
  if (!ancestorId || !taskId || ancestorId === taskId) return false;
  const seen = new Set();
  let current = findTask(taskId)?.task;
  while (current?.parentId && !seen.has(current.parentId)) {
    if (current.parentId === ancestorId) return true;
    seen.add(current.parentId);
    current = findTask(current.parentId)?.task;
  }
  return false;
}

function clearScheduleDragOver() {
  document.querySelectorAll(".drag-over").forEach(node => node.classList.remove("drag-over"));
}

function handleScheduleDropData(dateKey, hour, event) {
  const taskId = event.dataTransfer.getData("text/task-id");
  const entryId = event.dataTransfer.getData("text/entry-id");
  const found = findTask(taskId);
  if (found) return createEntryFromTask(found.task, hour, dateKey);
  if (entryId) return copyEntryToDate(entryId, dateKey, hour);
  return false;
}

function findEntry(entryId) {
  return Object.entries(state.data).flatMap(([dateKey, day]) => (day.entries || []).map(entry => ({ dateKey, entry })))
    .find(item => item.entry.id === entryId);
}

function copyEntryToDate(entryId, dateKey, hour) {
  const found = findEntry(entryId);
  if (!found) return;
  const placement = window.TaskWorkPolicy?.copyPlacement(found.entry, hour, 22);
  if (!placement) {
    showToast("该投入记录的时间范围无效，或目标时间不能放置");
    return false;
  }
  const entry = { ...found.entry, id: crypto.randomUUID(), ...placement };
  getDay(dateKey).entries.push(entry);
  if (entry.taskId) refreshTaskStatusForId(entry.taskId);
  saveData(); render();
  showToast(`已复制到 ${dateKey.slice(5)} ${formatTime(hour)}`);
  return true;
}

function bindProjectDrop(target, buckets, bucketWidth = 44) {
  target.addEventListener("dragover", event => { event.preventDefault(); target.classList.add("drag-over"); });
  target.addEventListener("dragleave", () => target.classList.remove("drag-over"));
  target.addEventListener("drop", event => {
    event.preventDefault();
    target.classList.remove("drag-over");
    const scroller = getProjectGanttScroller();
    const rect = (el.projectGanttChartTrack || target.closest(".project-gantt-chart-pane") || scroller).getBoundingClientRect();
    const scrollLeft = state.projectScrollLeft || 0;
    const index = Math.max(0, Math.min(buckets.length - 1, Math.floor((event.clientX - rect.left + scrollLeft) / bucketWidth)));
    const dateKey = buckets[index]?.key || state.selectedDate;
    const hour = 9;
    const taskId = event.dataTransfer.getData("text/task-id");
    const entryId = event.dataTransfer.getData("text/entry-id");
    const found = findTask(taskId);
    if (found) createEntryFromTask(found.task, hour, dateKey);
    else if (entryId) copyEntryToDate(entryId, dateKey, hour);
  });
}

function createEntryFromTask(task, hour, dateKey = state.selectedDate) {
  const placement = window.TaskWorkPolicy?.copyPlacement({ start: 0, end: 1 }, hour, 22);
  if (!placement) {
    showToast("该时间点不能放置新的投入记录");
    return false;
  }
  getDay(dateKey).entries.push({
    id: crypto.randomUUID(), entryType: "task_work", taskId: task.id, title: task.title,
    ...placement, note: "", color: "sage"
  });
  refreshTaskStatusForId(task.id);
  saveData(); render(); showToast(`已安排到 ${dateKey.slice(5)} ${formatTime(hour)}`);
  return true;
}

function openEntryDialog(hour, entry = null) {
  state.editingEntryId = entry?.id || null;
  state.selectedColor = entry?.color || "sage";
  el.entryEyebrow.textContent = entry ? "EDIT ENTRY" : "NEW ENTRY";
  el.entryDialogTitle.textContent = entry ? "编辑日程" : "添加日程";
  el.entryTitle.value = entry?.title || "";
  el.entryType.value = entry?.entryType || (entry?.taskId ? "task_work" : "calendar");
  fillEntryTaskOptions(entry);
  el.entryStart.value = entry?.start ?? hour;
  el.entryEnd.value = entry?.end ?? Math.min(hour + 1, 22);
  el.entryNote.value = entry?.note || "";
  updateEntryTypeControls();
  el.deleteEntryButton.classList.toggle("hidden", !entry);
  el.colorPicker.querySelectorAll("button").forEach(item => item.classList.toggle("selected", item.dataset.color === state.selectedColor));
  el.entryDialog.showModal();
  setTimeout(() => el.entryTitle.focus(), 50);
}

function saveEntry() {
  const payload = {
    title: el.entryTitle.value.trim(), start: Number(el.entryStart.value), end: Number(el.entryEnd.value),
    note: el.entryNote.value.trim(), color: state.selectedColor,
    entryType: el.entryType.value === "task_work" ? "task_work" : "calendar"
  };
  if (!payload.title || payload.end <= payload.start) return showToast("请检查事项和时间");
  const day = getDay();
  const existingEntry = state.editingEntryId ? day.entries.find(entry => entry.id === state.editingEntryId) : null;
  const previousTaskId = existingEntry?.taskId || "";
  if (payload.entryType !== "task_work") {
    finalizeEntrySave({ payload, existingEntry, previousTaskId, taskId: "" });
    return;
  }
  resolveEntryTaskLinkWithGuard(payload, existingEntry).then(taskId => {
    if (!taskId) return;
    finalizeEntrySave({ payload, existingEntry, previousTaskId, taskId });
  });
}

function finalizeEntrySave({ payload, existingEntry, previousTaskId, taskId }) {
  payload.taskId = taskId;
  const day = getDay();
  if (state.editingEntryId) Object.assign(existingEntry, payload);
  else day.entries.push({ id: crypto.randomUUID(), ...payload });
  [previousTaskId, payload.taskId].filter(Boolean).forEach(id => {
    refreshTaskStatusForId(id);
    if (payload.note) updateTaskRecords(id, task => { task.updatedAt = new Date().toISOString(); });
  });
  focusLinkedTaskFilter(payload.taskId);
  saveData(); el.entryDialog.close(); render();
  showToast(state.editingEntryId ? "日程已更新" : "日程已添加");
}

function resolveEntryTaskLinkWithGuard(entryPayload, existingEntry = null) {
  const selected = el.entryTaskLink.value;
  if (selected === "__create_parent__") {
    return promptEntryParentCreate(entryPayload, el.entryTaskCombobox.dataset.parentTitle || "");
  }
  if (selected && selected !== "__create__" && selected !== "") {
    const linked = findTask(selected)?.task;
    if (!linked || !TodoListPolicy.canLinkEntryToTask(linked, hasChildTasks)) {
      showToast("只能关联叶子待办，请选择没有子任务的具体待办");
      return Promise.resolve(null);
    }
    return Promise.resolve(selected);
  }
  if (existingEntry?.taskId) return Promise.resolve(existingEntry.taskId);
  const leafTasks = uniqueTasks(getAllTasks().map(({ task }) => task)).filter(isTodoListTask);
  const similar = TodoListPolicy.findSimilarTasks({
    title: entryPayload.title,
    tasks: leafTasks,
    hasChildTasks: taskId => hasChildTasks(taskId)
  });
  if (similar.length) return promptEntryLinkChoice(entryPayload, similar);
  return promptEntryCreateConfirm(entryPayload);
}

function promptEntryLinkChoice(entryPayload, similar) {
  return new Promise(resolve => {
    pendingEntrySave = { entryPayload, resolve, similar };
    el.entryLinkConfirmTitle.textContent = "发现相似待办";
    el.entryLinkConfirmMessage.textContent = `日程「${entryPayload.title}」与以下待办相似。请先尝试关联，避免重复创建。`;
    el.entryLinkConfirmOptions.innerHTML = similar.map(({ task }) => {
      const meta = TaskOptionPolicy.hierarchyMeta({ task, tasks: getAllTasks().map(({ task: item }) => item) });
      return `<button type="button" class="entry-link-confirm-option" data-task-id="${escapeHtml(task.id)}"><strong>${escapeHtml(task.title)}</strong><span>${escapeHtml(meta.path)} · ${escapeHtml(statusLabel(task.status))}</span></button>`;
    }).join("");
    el.entryLinkConfirmOptions.querySelectorAll("[data-task-id]").forEach(button => {
      button.addEventListener("click", () => {
        const taskId = button.dataset.taskId;
        pendingEntrySave = null;
        el.entryLinkConfirmDialog.close();
        resolve(taskId);
      }, { once: true });
    });
    el.entryLinkConfirmCreate.textContent = "确认新建待办";
    el.entryLinkConfirmDialog.showModal();
  });
}

function promptEntryCreateConfirm(entryPayload) {
  return new Promise(resolve => {
    pendingEntrySave = { entryPayload, resolve, similar: [] };
    el.entryLinkConfirmTitle.textContent = "新建待办并关联";
    el.entryLinkConfirmMessage.textContent = `未找到与「${entryPayload.title}」相似的已有待办。确认后将新建叶子待办并关联到这条日程。`;
    el.entryLinkConfirmOptions.innerHTML = "";
    el.entryLinkConfirmCreate.textContent = "确认新建";
    el.entryLinkConfirmDialog.showModal();
  });
}

function promptEntryParentCreate(entryPayload, suggestedParentTitle = "") {
  return new Promise(resolve => {
    pendingEntrySave = { entryPayload, resolve, similar: [], createMode: "parent" };
    el.entryLinkConfirmTitle.textContent = "新建父级并挂入当前事项";
    el.entryLinkConfirmMessage.textContent = `将创建一个父级任务，并把「${entryPayload.title}」作为具体子待办关联到当前日程。`;
    el.entryLinkConfirmOptions.innerHTML = `<label class="entry-parent-create-field">
      <span>父级任务名称</span>
      <input id="entryParentTaskTitle" maxlength="80" placeholder="例如：年度审计整改" />
    </label>`;
    el.entryLinkConfirmOptions.querySelector("#entryParentTaskTitle").value = suggestedParentTitle;
    el.entryLinkConfirmCreate.textContent = "创建父级并关联";
    el.entryLinkConfirmDialog.showModal();
    setTimeout(() => el.entryLinkConfirmOptions.querySelector("#entryParentTaskTitle")?.focus(), 0);
  });
}

function focusLinkedTaskFilter(taskId) {
  const linked = findTask(taskId)?.task;
  if (!linked || state.taskView === "month") return;
  state.filter = ["done", "closed"].includes(linked.status) ? "ended" : (isOngoingTask(linked) ? "in_progress" : state.filter);
  TodoListPolicy.saveFilter(state.filter);
}

function fillEntryTaskOptions(entry = null) {
  el.entryTaskLink.innerHTML = "";
  el.entryTaskLink.add(new Option("搜索并关联待办…", ""));
  el.entryTaskLink.add(new Option("新建待办并关联", "__create__"));
  el.entryTaskLink.add(new Option("新建父级并挂入当前事项", "__create_parent__"));
  getLeafTasksForEntryLink(entry).forEach(task => {
    el.entryTaskLink.add(new Option(task.title, task.id));
  });
  el.entryTaskLink.value = entry?.taskId || "";
  renderEntryTaskOptions("");
  syncEntryTaskTrigger();
}

function getLeafTasksForEntryLink(entry = null) {
  return getAllTasks().map(({ task }) => task).filter(task =>
    TodoListPolicy.canLinkEntryToTask(task, hasChildTasks) &&
    TaskOptionPolicy.shouldIncludeEntryTaskOption({
      task,
      isHiddenFutureRecurringInstance: isHiddenFutureRecurringInstance(task),
      isCurrentLinkedTask: entry?.taskId === task.id
    })
  );
}

let entryTaskActiveIndex = 0;
function bindEntryTaskCombobox() {
  el.entryTaskTrigger.addEventListener("click", toggleEntryTaskPopup);
  el.entryTaskSearch.addEventListener("input", () => { entryTaskActiveIndex = 0; renderEntryTaskOptions(el.entryTaskSearch.value); });
  el.entryTaskSearch.addEventListener("keydown", event => {
    const options = el.entryTaskOptions.querySelectorAll('[role="option"]');
    if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); entryTaskActiveIndex = Math.max(0, Math.min(Math.max(0, options.length - 1), entryTaskActiveIndex + (event.key === "ArrowDown" ? 1 : -1))); updateEntryTaskActiveOption(options); }
    else if (event.key === "Enter" && options[entryTaskActiveIndex]) { event.preventDefault(); chooseEntryTaskOption(options[entryTaskActiveIndex].dataset.value, options[entryTaskActiveIndex].dataset.parentTitle); }
    else if (event.key === "Escape") closeEntryTaskPopup();
  });
  el.entryTaskTrigger.addEventListener("keydown", event => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); toggleEntryTaskPopup(); }
    else if (event.key === "Escape") closeEntryTaskPopup();
  });
  [el.entryTaskTrigger, el.entryTaskSearch].forEach(control => control.addEventListener("keydown", event => { if (event.key === "Tab") closeEntryTaskPopup(); }));
  document.addEventListener("click", event => { if (!el.entryTaskCombobox.contains(event.target)) closeEntryTaskPopup(); });
}
function toggleEntryTaskPopup() {
  if (el.entryTaskLink.disabled) return;
  if (!el.entryTaskPopup.classList.contains("hidden")) return closeEntryTaskPopup();
  el.entryTaskPopup.classList.remove("hidden"); el.entryTaskTrigger.setAttribute("aria-expanded", "true"); el.entryTaskSearch.value = ""; renderEntryTaskOptions(""); setTimeout(() => el.entryTaskSearch.focus(), 0);
}
function closeEntryTaskPopup() { el.entryTaskPopup.classList.add("hidden"); el.entryTaskTrigger.setAttribute("aria-expanded", "false"); if (document.activeElement === el.entryTaskSearch) el.entryTaskTrigger.focus(); }
function renderEntryTaskOptions(query) {
  const tasks = getAllTasks().map(({ task }) => task);
  const results = TaskOptionPolicy.searchTaskCandidates({
    tasks,
    query,
    selectedId: el.entryTaskLink.value,
    leafOnly: true,
    hasChildTasks,
    isHiddenFutureRecurringInstance,
    statusText: task => statusLabel(task.status),
    dateText: task => task.dueDate || "未计划"
  });
  const items = results.map(({ task, meta }) => `<button type="button" class="entry-task-option" role="option" aria-selected="${el.entryTaskLink.value === task.id}" data-value="${escapeHtml(task.id)}" title="${escapeHtml(meta.path)}"><strong>${escapeHtml(task.title)}</strong><span><b>第${meta.depth}层${meta.kind}</b>${meta.parentPath ? ` · ${escapeHtml(meta.parentPath)}` : ""}</span><small>${escapeHtml(statusLabel(task.status))} · ${task.dueDate ? escapeHtml(task.dueDate.slice(5)) : "未计划"}${el.entryTaskLink.value === task.id ? " · ✓ 已关联" : ""}</small></button>`).join("");
  const parentTitle = query.trim();
  const create = `<button type="button" class="entry-task-option create-option" role="option" aria-selected="${el.entryTaskLink.value === "__create__"}" data-value="__create__">＋ 新建「${escapeHtml(el.entryTitle.value.trim() || "当前事项")}」并关联</button>
    <button type="button" class="entry-task-option create-option create-parent-option" role="option" aria-selected="${el.entryTaskLink.value === "__create_parent__"}" data-value="__create_parent__">＋ ${parentTitle ? `新建父级「${escapeHtml(parentTitle)}」并挂入当前事项` : "新建父级任务并挂入当前事项"}</button>`;
  el.entryTaskOptions.innerHTML = (items || `<div class="entry-task-no-results">无匹配叶子待办，可直接新建具体待办或新建父级后挂入</div>`) + create;
  const createParentOption = el.entryTaskOptions.querySelector('[data-value="__create_parent__"]');
  if (createParentOption) createParentOption.dataset.parentTitle = parentTitle;
  const current = [...el.entryTaskOptions.querySelectorAll('[role="option"]')].findIndex(option => option.getAttribute("aria-selected") === "true");
  entryTaskActiveIndex = current >= 0 ? current : 0;
  el.entryTaskOptions.querySelectorAll('[role="option"]').forEach(option => option.addEventListener("click", () => chooseEntryTaskOption(option.dataset.value, option.dataset.parentTitle)));
  updateEntryTaskActiveOption(el.entryTaskOptions.querySelectorAll('[role="option"]'));
}
function updateEntryTaskActiveOption(options) { options.forEach((option, index) => option.classList.toggle("active", index === entryTaskActiveIndex)); }
function chooseEntryTaskOption(value, parentTitle = "") {
  el.entryTaskLink.value = value;
  el.entryTaskCombobox.dataset.parentTitle = value === "__create_parent__" ? parentTitle : "";
  syncEntryTaskTrigger();
  closeEntryTaskPopup();
}
function syncEntryTaskTrigger() {
  const selected = el.entryTaskLink.options[el.entryTaskLink.selectedIndex];
  el.entryTaskTrigger.textContent = selected?.value && selected.value !== ""
    ? selected.textContent
    : "搜索并关联待办…";
}

function getCalendarEntriesForDate(dateKey) {
  return (getDay(dateKey).entries || [])
    .filter(entry => entry.entryType === "calendar" || !entry.taskId)
    .sort((a, b) => a.start - b.start);
}

function renderCalendarEntryList(entries, mode) {
  if (!entries.length) return "";
  return `<div class="calendar-entry-list ${mode}" title="会议和日程">
    ${entries.map(entry => `<div class="calendar-entry-item" data-entry-id="${entry.id}" title="${escapeHtml(entry.title)}">
      <span>会议 / 日程</span><strong>${escapeHtml(entry.title)}</strong><small>${formatTime(entry.start)}–${formatTime(entry.end)}</small>
    </div>`).join("")}
  </div>`;
}

function bindCalendarEntryList(container, dateKey) {
  container.querySelectorAll(".calendar-entry-item").forEach(item => {
    item.addEventListener("click", event => {
      event.stopPropagation();
      const entry = getDay(dateKey).entries.find(candidate => candidate.id === item.dataset.entryId);
      if (entry) openEntryDialog(entry.start, entry);
    });
  });
}

function updateEntryTypeControls() {
  const taskWork = el.entryType.value === "task_work";
  el.entryTaskLink.disabled = !taskWork;
  el.entryTaskLink.closest("label")?.classList.toggle("disabled-field", !taskWork);
  el.entryTaskCombobox.classList.toggle("disabled", !taskWork);
  el.entryTaskTrigger.disabled = !taskWork;
  if (!taskWork) el.entryTaskLink.value = "";
  else if (!el.entryTaskLink.value) el.entryTaskLink.value = "";
  syncEntryTaskTrigger();
}

function openTaskMergeDialog() {
  const source = findTask(state.editingTaskId)?.task;
  if (!source) return;
  const candidates = uniqueTasks(getAllTasks().map(({ task }) => task))
    .filter(task => task.id !== source.id && isTodoListTask(task) && !["done", "closed"].includes(task.status));
  if (!candidates.length) return showToast("没有可合并的目标待办");
  el.taskMergeMessage.textContent = `将把「${source.title}」的所有任务投入合并到另一个待办，并关闭当前待办。`;
  el.taskMergeTarget.innerHTML = candidates.map(task => {
    const path = TaskOptionPolicy.taskHierarchyPath({ task, tasks: candidates, separator: " › " });
    return `<option value="${escapeHtml(task.id)}">${escapeHtml(path || task.title)}</option>`;
  }).join("");
  el.taskMergeDialog.showModal();
}

function mergeTaskIntoTarget(sourceId, targetId) {
  if (!sourceId || !targetId || sourceId === targetId) return showToast("请选择不同的目标待办");
  const source = findTask(sourceId)?.task;
  const target = findTask(targetId)?.task;
  if (!source || !target || !isTodoListTask(source) || !isTodoListTask(target)) return showToast("只能合并叶子待办");
  Object.values(state.data).forEach(day => {
    (day.entries || []).forEach(entry => {
      if (entry.taskId === sourceId) entry.taskId = targetId;
    });
  });
  updateTaskRecords(sourceId, task => {
    task.status = "closed";
    task.updatedAt = new Date().toISOString();
    task.description = `${task.description || ""}${task.description ? "\n" : ""}已合并到：${target.title}`;
  });
  refreshTaskStatusForId(targetId);
  el.taskMergeDialog.close();
  el.taskDialog.close();
  saveData();
  render();
  showToast(`已合并到「${target.title}」`);
}

function createTaskFromEntryPayload(entryPayload, dateKey = state.selectedDate, description = "从当日日程快速创建，可在待办中继续补充。") {
  const now = new Date();
  const task = {
    id: crypto.randomUUID(),
    title: entryPayload.title,
    dueDate: dateKey,
    dueTime: formatTime(entryPayload.end),
    owner: "我",
    parentId: "",
    description,
    priority: "general_daily",
    progress: 0,
    status: "planned",
    startedAt: "",
    completedAt: "",
    businessBackground: "",
    problemReason: "",
    deliveryNote: "",
    recurrence: null,
    recurrenceGroupId: "",
    createdAtIso: now.toISOString(),
    updatedAt: now.toISOString(),
    createdAt: now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
  };
  getDay(dateKey).tasks.push(task);
  return task;
}

function createParentAndLeafFromEntryPayload(entryPayload, parentTitle, dateKey = state.selectedDate) {
  const parent = createTaskFromEntryPayload(
    { ...entryPayload, title: parentTitle },
    dateKey,
    "从具体日程事项归纳创建的父级任务，可继续添加相关子任务。"
  );
  parent.dueDate = "";
  parent.dueTime = "";
  parent.status = "planned";
  const leaf = createTaskFromEntryPayload(
    entryPayload,
    dateKey,
    `从当日日程创建，并归入父级任务「${parentTitle}」。`
  );
  leaf.parentId = parent.id;
  return leaf;
}

function createQuickUnplannedTask(title) {
  const now = new Date();
  const task = {
    id: crypto.randomUUID(),
    title,
    dueDate: "",
    dueTime: "",
    owner: "我",
    parentId: "",
    description: "",
    priority: "general_daily",
    progress: 0,
    status: "planned",
    startedAt: "",
    startOverrideAt: "",
    completedAt: "",
    businessBackground: "",
    problemReason: "",
    deliveryNote: "",
    recurrence: null,
    recurrenceGroupId: "",
    createdAtIso: now.toISOString(),
    updatedAt: now.toISOString(),
    createdAt: now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
  };
  getDay(state.selectedDate).tasks.unshift(task);
  el.quickTaskInput.value = "";
  state.filter = "unplanned";
  saveData();
  render();
  showToast("未计划待办已记录");
  setTimeout(() => el.quickTaskInput.focus(), 40);
}

function renderDayNote() {
  const note = getDay().note || "";
  el.dayNoteText.textContent = note;
  el.dayNoteButton.textContent = note ? "编辑备注" : "＋ 添加当天备注";
}

function openNoteDialog() {
  el.dayNoteInput.value = getDay().note || "";
  el.noteDialog.showModal();
  setTimeout(() => el.dayNoteInput.focus(), 50);
}

function fillTimeOptions() {
  for (let minutes = 7 * 60; minutes <= 22 * 60; minutes += 15) {
    const time = minutes / 60;
    el.entryStart.add(new Option(formatTime(time), String(time)));
    el.entryEnd.add(new Option(formatTime(time), String(time)));
  }
}

function getTaskDuration(taskId) {
  return Object.entries(state.data).reduce((sum, [dateKey, day]) =>
    sum + (day.entries || [])
      .filter(entry => entry.taskId === taskId)
      .reduce((subtotal, entry) => subtotal + getEntryInvestedHours(dateKey, entry), 0), 0);
}

function getTaskScheduledHours(taskId) {
  return Object.values(state.data).reduce((sum, day) =>
    sum + (day.entries || [])
      .filter(entry => entry.taskId === taskId)
      .reduce((subtotal, entry) => subtotal + entry.end - entry.start, 0), 0);
}

function getTaskProgressNotes(taskId) {
  return Object.entries(state.data).flatMap(([dateKey, day]) =>
    (day.entries || [])
      .filter(entry => entry.taskId === taskId && entry.note?.trim())
      .map(entry => ({
        dateKey,
        start: entry.start,
        end: entry.end,
        note: entry.note.trim(),
        at: scheduledDateTime(dateKey, entry.start)
      }))
  ).sort((a, b) => b.at - a.at);
}

function latestTaskProgressNote(taskId) {
  return getTaskProgressNotes(taskId)[0] || null;
}

function updateTaskProgressFromSchedule(task) {
  if (!task || ["done", "closed"].includes(task.status)) return false;
  const previous = task.progress || 0;
  const scheduled = getTaskScheduledHours(task.id);
  const invested = getTaskDuration(task.id);
  task.progress = ProjectSummaryPolicy.taskProgressPercent({
    status: task.status,
    investedHours: invested,
    scheduledHours: scheduled
  });
  return task.progress !== previous;
}

function hasScheduledEntry(taskId) {
  return Object.values(state.data).some(day => (day.entries || []).some(entry => entry.taskId === taskId));
}

function isOngoingTask(task) {
  if (!task || ["done", "closed"].includes(task.status)) return false;
  if (task.status === "in_progress") return true;
  return Boolean(getTaskScheduleInfo(task.id)?.hasStarted);
}

function getTaskScheduleInfo(taskId, now = new Date()) {
  if (!taskId) return null;
  const entries = Object.entries(state.data).flatMap(([dateKey, day]) =>
    (day.entries || [])
      .filter(entry => entry.taskId === taskId)
      .map(entry => ({
        dateKey,
        entry,
        start: scheduledDateTime(dateKey, entry.start),
        end: scheduledDateTime(dateKey, entry.end)
      }))
  ).sort((a, b) => a.start - b.start);
  if (!entries.length) return null;
  return {
    entries,
    firstStartIso: entries[0].start.toISOString(),
    hasStarted: entries.some(item => item.start <= now),
    hasFuture: entries.some(item => item.start > now)
  };
}

function getAutomaticTaskStatus(taskId, now = new Date()) {
  const found = findTask(taskId)?.task;
  const manualStart = found?.startOverrideAt ? new Date(found.startOverrideAt) : null;
  if (manualStart && manualStart <= now) return "in_progress";
  const entries = getTaskScheduleEntries(taskId);
  return window.TaskWorkPolicy?.statusForEntries(entries, now) || "planned";
}

function getAutomaticTaskStatusForPayload(taskId, payload, now = new Date()) {
  const manualStart = payload?.startOverrideAt ? new Date(payload.startOverrideAt) : null;
  if (manualStart && manualStart <= now) return "in_progress";
  if (!taskId) return "planned";
  const schedule = getTaskScheduleInfo(taskId, now);
  return schedule?.hasStarted ? "in_progress" : "planned";
}

function applyAutomaticTaskStatus(task, now = new Date()) {
  if (!task || ["done", "closed"].includes(task.status)) return false;
  if (task.completedAt) {
    const changed = task.status !== "done" || task.progress !== 100;
    task.status = "done";
    task.progress = 100;
    if (changed) task.updatedAt = now.toISOString();
    return changed;
  }
  const schedule = getTaskScheduleInfo(task.id, now);
  const manualStart = task.startOverrideAt ? new Date(task.startOverrideAt) : null;
  const manualStarted = manualStart && manualStart <= now;
  const nextStatus = manualStarted || schedule?.hasStarted ? "in_progress" : "planned";
  const nextStartedAt = task.startOverrideAt || schedule?.firstStartIso || "";
  let changed = task.status !== nextStatus || task.startedAt !== nextStartedAt;
  task.status = nextStatus;
  task.startedAt = nextStartedAt;
  if (updateTaskProgressFromSchedule(task)) changed = true;
  const beforeStatusProgress = task.progress || 0;
  if (nextStatus === "in_progress") updateTaskProgressFromSchedule(task);
  else if (!schedule?.hasStarted) task.progress = 0;
  if ((task.progress || 0) !== beforeStatusProgress) changed = true;
  if (changed) task.updatedAt = now.toISOString();
  return changed;
}

function refreshTaskStatusForId(taskId, now = new Date()) {
  let changed = false;
  findTaskRecords(taskId).forEach(({ task }) => {
    if (applyAutomaticTaskStatus(task, now)) changed = true;
  });
  return changed;
}

function syncTaskStatuses() {
  let changed = false;
  const now = new Date();
  getAllTasks().forEach(({ task }) => {
    if (applyAutomaticTaskStatus(task, now)) changed = true;
  });
  if (changed) saveData();
}

function getEntryInvestedHours(dateKey, entry, now = new Date()) {
  const start = scheduledDateTime(dateKey, entry.start);
  const end = scheduledDateTime(dateKey, entry.end);
  if (now <= start) return 0;
  let effectiveEnd = now < end ? now : end;
  if (entry.taskId) {
    const completedAt = findTask(entry.taskId)?.task.completedAt;
    if (completedAt) {
      const completed = new Date(completedAt);
      if (completed < effectiveEnd) effectiveEnd = completed;
    }
  }
  return Math.max(0, (effectiveEnd - start) / 3600000);
}

function scheduledDateTime(dateKey, decimalHour) {
  const date = fromDateKey(dateKey);
  const hour = Math.floor(decimalHour);
  const minute = Math.round((decimalHour - hour) * 60);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function isUnplannedTask(task) {
  if (!task || task.status !== "planned") return false;
  if (!isTodoListTask(task)) return false;
  if (isContainerOnlyTask(task)) return false;
  return !hasPlanningAnchor(task);
}

function isContainerOnlyTask(task) {
  if (!task || task.status !== "planned") return false;
  const children = getChildTasks(task.id);
  if (!children.length) return false;
  return !hasOwnPlanningAnchor(task) && children.some(child => hasPlanningAnchor(child));
}

function isTodoListTask(task) {
  return !!task && !hasChildTasks(task.id);
}

function hasChildTasks(taskId) {
  return getChildTasks(taskId).length > 0;
}

function hasPlanningAnchor(task, visited = new Set()) {
  if (!task || visited.has(task.id)) return false;
  visited.add(task.id);
  if (hasOwnPlanningAnchor(task)) return true;
  return getChildTasks(task.id).some(child => hasPlanningAnchor(child, visited));
}

function hasOwnPlanningAnchor(task) {
  if (!task) return false;
  if (task.status && task.status !== "planned") return true;
  if (task.dueDate || task.dueTime || task.startedAt || task.startOverrideAt || task.completedAt) return true;
  return !!getTaskScheduleInfo(task.id);
}

function getChildTasks(parentId) {
  if (!parentId) return [];
  return uniqueTasks(getAllTasks()
    .map(({ task }) => task)
    .filter(task => (task.parentId || task.parentTaskId || task.parentTask || task.parent || "") === parentId));
}

function matchesFilter(task, filter) {
  if (!isTodoListTask(task)) return false;
  if (filter === "all") return true;
  if (filter === "unplanned") return isUnplannedTask(task);
  if (filter === "ended") return task.status === "done" || task.status === "closed";
  if (filter === "planned") return task.status === "planned" && !isUnplannedTask(task) && !isContainerOnlyTask(task);
  return task.status === filter;
}

function statusLabel(status) {
  return { unplanned: "未计划", planned: "计划中", in_progress: "进行中", done: "已完成", closed: "已关闭" }[status] || "计划中";
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

function migratePriority(priority) {
  return {
    low: "follow_up",
    medium: "follow_up",
    high: "important_urgent",
    urgent: "important_urgent"
  }[priority] || (["general_daily", "kpi", "follow_up", "important_urgent", "paused"].includes(priority) ? priority : "general_daily");
}

function updateRecurringOptions() {
  el.recurringOptions.classList.toggle("hidden", !el.taskMonthlyRecurring.checked);
  if (el.taskMonthlyRecurring.checked && !el.taskRecurringUntil.value) {
    el.taskRecurringUntil.value = defaultRecurringUntil(el.taskDueDate.value || state.selectedDate);
  }
}

function defaultRecurringUntil(dateKey) {
  const date = fromDateKey(dateKey);
  date.setMonth(date.getMonth() + 11);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function ensureRecurringTasksForVisibleRange() {
  ensureRecurringTasksForMonth(RecurringPolicy.currentMonthKey());
}

function ensureRecurringTasksForMonth(targetMonth) {
  let changed = false;
  getRecurringTemplates().forEach(template => {
    const recurrence = template.recurrence;
    if (!recurrence || recurrence.frequency !== "monthly") return;
    const startMonth = template.dueDate.slice(0, 7);
    if (!RecurringPolicy.shouldGenerateRecurringMonth({
      targetMonth,
      currentMonth: RecurringPolicy.currentMonthKey(),
      startMonth,
      untilMonth: recurrence.until
    })) return;
    const groupId = template.recurrenceGroupId || template.id;
    const exists = getAllTasks().some(({ task }) =>
      task.id !== template.id &&
      (task.recurrenceGroupId === groupId || task.recurrenceGroupId === template.recurrenceGroupId) &&
      task.dueDate?.slice(0, 7) === targetMonth
    ) || template.dueDate.slice(0, 7) === targetMonth;
    if (exists) return;
    const dueDate = recurringDateForMonth(template.dueDate, targetMonth);
    const task = cloneRecurringTaskForMonth(template, dueDate, groupId);
    getDay(dueDate).tasks.push(task);
    changed = true;
  });
  if (changed) saveData();
}

function getRecurringTemplates() {
  const grouped = new Map();
  getAllTasks()
    .map(({ task }) => task)
    .filter(task => task.recurrence?.frequency === "monthly" && task.dueDate)
    .sort((a, b) => `${a.createdAtIso || ""}${a.dueDate}`.localeCompare(`${b.createdAtIso || ""}${b.dueDate}`))
    .forEach(task => {
      const key = task.recurrenceGroupId || task.id;
      if (!grouped.has(key)) grouped.set(key, task);
    });
  return [...grouped.values()];
}

function recurringDateForMonth(firstDateKey, targetMonth) {
  if (!firstDateKey) return "";
  const first = fromDateKey(firstDateKey);
  const [year, month] = targetMonth.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return toDateKey(new Date(year, month - 1, Math.min(first.getDate(), lastDay)));
}

function cloneRecurringTaskForMonth(template, dueDate, groupId) {
  const now = new Date();
  const createdAtIso = now.toISOString();
  return {
    ...template,
    id: crypto.randomUUID(),
    dueDate,
    parentId: resolveRecurringParentId(template.parentId, dueDate),
    status: "planned",
    progress: 0,
    startedAt: "",
    startOverrideAt: "",
    completedAt: "",
    createdAtIso,
    updatedAt: createdAtIso,
    createdAt: now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
    recurrenceGroupId: groupId,
    recurrence: { ...template.recurrence, dayOfMonth: template.dueDate ? Number(template.dueDate.slice(-2)) : null }
  };
}

function buildRecurringDates(firstDateKey, untilMonth) {
  const first = fromDateKey(firstDateKey);
  const [untilYear, untilMonthNumber] = untilMonth.split("-").map(Number);
  const lastMonth = new Date(untilYear, untilMonthNumber - 1, 1);
  const dates = [];
  let cursor = new Date(first.getFullYear(), first.getMonth(), 1);
  while (cursor <= lastMonth) {
    const lastDay = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const date = new Date(cursor.getFullYear(), cursor.getMonth(), Math.min(first.getDate(), lastDay));
    dates.push(toDateKey(date));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return dates;
}

function buildRecurringTasks(payload) {
  const now = new Date();
  const createdAtIso = now.toISOString();
  const base = {
    createdAtIso,
    updatedAt: createdAtIso,
    createdAt: now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
  };
  if (!payload.recurrence) return [{ id: crypto.randomUUID(), ...base, ...payload }];
  const groupId = crypto.randomUUID();
  return [{
    id: crypto.randomUUID(),
    ...base,
    ...payload,
    parentId: resolveRecurringParentId(payload.parentId, payload.dueDate),
    recurrenceGroupId: groupId,
    recurrence: { ...payload.recurrence, dayOfMonth: payload.dueDate ? Number(payload.dueDate.slice(-2)) : null },
    status: "planned",
    progress: 0,
    startedAt: "",
    completedAt: ""
  }];
}

function resolveRecurringParentId(selectedParentId, childDueDate) {
  if (!selectedParentId) return "";
  const selectedParent = findTask(selectedParentId)?.task;
  if (!selectedParent?.recurrenceGroupId) return selectedParentId;
  const targetMonth = childDueDate.slice(0, 7);
  const matchingParent = getAllTasks().find(({ task }) =>
    task.recurrenceGroupId === selectedParent.recurrenceGroupId &&
    task.dueDate?.slice(0, 7) === targetMonth
  );
  return matchingParent?.task.id || selectedParentId;
}

function formatElapsed(startedAt) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000));
  if (minutes < 60) return `${minutes} 分钟`;
  const hours = Math.floor(minutes / 60);
  return `${hours} 小时 ${minutes % 60} 分钟`;
}

function updateProgressAvailability() {
  const enabled = el.taskStatus.value === "in_progress" || el.taskStatus.value === "done";
  el.taskProgress.disabled = !enabled;
  if (el.taskStatus.value === "done") {
    el.taskProgress.value = 100;
    el.taskProgressValue.textContent = "100%";
  } else if (!enabled) {
    el.taskProgress.value = 0;
    el.taskProgressValue.textContent = "0%";
  }
}

function updateParentRequirements() {
  el.businessBackgroundLabel.querySelector("span").textContent = "业务背景（可选）";
  el.problemReasonLabel.querySelector("span").textContent = "问题原因（可选）";
  el.taskBusinessBackground.required = false;
  el.taskProblemReason.required = false;
}

function toLocalDateTimeInput(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function fromLocalDateTimeInput(value) {
  return value ? new Date(value).toISOString() : "";
}

function scheduledDateTimeIso(dateKey, decimalHour) {
  const date = fromDateKey(dateKey);
  date.setHours(Math.floor(decimalHour), decimalHour % 1 ? 30 : 0, 0, 0);
  return date.toISOString();
}

async function exportAllData(format = "xlsx") {
  const tasks = getAllTasks().map(({ task, dateKey }) => ({
    id: task.id, title: task.title, planDate: dateKey, dueDate: task.dueDate, dueTime: task.dueTime,
    owner: task.owner, parentId: task.parentId || null, priority: task.priority, status: task.status,
    progress: task.progress, startedAt: task.startedAt || null, startOverrideAt: task.startOverrideAt || null, completedAt: task.completedAt || null,
    workHours: getTaskDuration(task.id), businessBackground: task.businessBackground || "",
    problemReason: task.problemReason || "", deliveryNote: task.deliveryNote || "",
    description: task.description || "", createdAt: task.createdAtIso || null, updatedAt: task.updatedAt || null,
    recurrence: task.recurrence || null, recurrenceGroupId: task.recurrenceGroupId || null
  }));
  const schedules = Object.entries(state.data).flatMap(([date, day]) =>
    (day.entries || []).map(entry => ({
      date,
      plannedDurationHours: entry.end - entry.start,
      durationHours: getEntryInvestedHours(date, entry),
      ...entry
    }))
  );
  const notes = Object.entries(state.data).filter(([, day]) => day.note).map(([date, day]) => ({ date, note: day.note }));
  const data = {
    format: "today-planner-export", version: 1, exportedAt: new Date().toISOString(),
    tasks, schedules, notes
  };
  const extension = format === "xlsx" ? "xlsx" : "json";
  const filename = `今日日程-全部数据-${toDateKey(new Date())}.${extension}`;
  if (window.desktopAPI?.exportData) {
    const saved = await window.desktopAPI.exportData(filename, format, data);
    showToast(saved ? "全部数据已导出" : "已取消导出");
    return;
  }
  if (format === "xlsx") {
    showToast("Excel 导出请从桌面应用使用");
    return;
  }
  const content = JSON.stringify(data, null, 2);
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast("全部数据已导出");
}

function formatDue(task) {
  if (!task.dueDate) return "无固定目标时间";
  const date = fromDateKey(task.dueDate);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${task.dueTime || ""}`.trim();
}

function moveSelectedDate(days) { selectDate(addDays(fromDateKey(state.selectedDate), days)); }
function selectDate(date) {
  state.selectedDate = toDateKey(date);
  if (state.taskView === "project") {
    state.projectAnchorDate = isToday(date) ? toDateKey(new Date()) : state.selectedDate;
    if (isToday(date)) state.projectViewNeedsAnchor = true;
  }
  render();
  el.timelineWrap.scrollTop = 0;
}
function scrollToWorkday() {
  if (!isToday(fromDateKey(state.selectedDate))) return;
  el.timelineWrap.scrollTop = Math.max(0, (new Date().getHours() - HOURS[0] - 1) * getHourHeight());
}
function showToast(message) {
  clearTimeout(toastTimer);
  el.toast.textContent = message;
  el.toast.classList.add("show");
  toastTimer = setTimeout(() => el.toast.classList.remove("show"), 1800);
}
function getMonday(date) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - (copy.getDay() === 0 ? 6 : copy.getDay() - 1));
  copy.setHours(0, 0, 0, 0);
  return copy;
}
function addDays(date, days) { const copy = new Date(date); copy.setDate(copy.getDate() + days); return copy; }
function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function fromDateKey(key) { const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d); }
function isToday(date) { return toDateKey(date) === toDateKey(new Date()); }
function formatTime(value) {
  const hour = Math.floor(value);
  const minute = Math.round((value - hour) * 60);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
function formatHours(value) { return `${trimNumber(value)} 小时`; }
function trimNumber(value) { return Number.isInteger(value) ? value : value.toFixed(1); }
function getHourHeight() { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--hour-height")); }
function escapeHtml(value) { const div = document.createElement("div"); div.textContent = value; return div.innerHTML; }
