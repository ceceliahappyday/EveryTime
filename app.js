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
  filter: "planned",
  taskView: "day",
  editingTaskId: null,
  editingEntryId: null,
  selectedColor: "sage",
  data: loadData()
};

const el = {};
let toastTimer;
let timelineScrollBarTimer;
let taskListScrollBarTimer;
let persistentWritesEnabled = false;

document.addEventListener("DOMContentLoaded", async () => {
  [
    "todaySummary", "monthLabel", "monthPickerButton", "datePicker", "previousWeek", "nextWeek",
    "appVersionBadge",
    "todayButton", "weekDays", "taskCount", "taskList", "unplannedCount", "openCount", "doneCount", "closedCount", "exportButton",
    "plannedHours", "progressLabel", "progressBar", "scheduleTitle", "loggedHours", "freeHours",
    "timeline", "timelineWrap", "quickAddButton", "toggleCompact", "quickTaskForm", "quickTaskInput", "taskAddTrigger", "viewSwitcher",
    "taskTabs", "taskViewTitle", "taskDialog", "taskEditForm", "taskDialogEyebrow", "taskDialogTitle",
    "taskDetailSummary",
    "taskTitleInput", "taskDueDate", "taskDueTime", "taskOwner", "taskParent", "taskPriority",
    "taskProgress", "taskProgressValue", "taskStatus", "taskMonthlyRecurring", "taskRecurringUntil",
    "recurringOptions", "taskActualStart", "taskActualEnd",
    "taskBusinessBackground", "taskProblemReason", "taskDeliveryNote", "businessBackgroundLabel",
    "problemReasonLabel", "taskDescription",
    "deleteTaskButton", "entryDialog", "entryForm", "entryEyebrow", "entryDialogTitle", "entryTitle",
    "entryTaskLink", "entryStart", "entryEnd", "entryNote", "colorPicker", "deleteEntryButton", "dayNoteButton",
    "dayNoteText", "noteDialog", "noteForm", "dayNoteInput", "toast", "pinWindow", "desktopLock", "glassMode",
    "updateProgress", "updateProgressText", "updateProgressBar",
    "exportDialog", "exportForm", "exportFormat", "minimizeWindow", "closeWindow",
    "progressReviewButton", "progressReviewDialog", "progressReviewForm", "progressReviewList",
    "settingsButton", "settingsDialog", "settingsForm", "settingGlass", "settingPinned", "settingLocked",
    "settingCompact", "settingStartAtLogin", "settingsAppVersion", "settingsDataPath", "settingsExportPath"
  ].forEach(id => el[id] = document.getElementById(id));

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
    day.tasks.forEach(task => {
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
      task.startOverrideAt ||= "";
    });
  });
  saveData();
}

function ensureEntryTaskLinks() {
  let changed = false;
  Object.entries(state.data).forEach(([dateKey, day]) => {
    (day.entries || []).forEach(entry => {
      if (entry.taskId || !entry.title?.trim()) return;
      const task = createTaskFromEntryPayload({
        title: entry.title,
        start: entry.start,
        end: entry.end,
        note: entry.note || ""
      }, dateKey, "从日程自动补建，确保左侧待办状态与右侧日程一致。");
      entry.taskId = task.id;
      changed = true;
    });
  });
  if (changed) saveData();
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
    state.taskView = button.dataset.view;
    el.viewSwitcher.querySelectorAll("button").forEach(item => item.classList.toggle("active", item === button));
    render();
  });

  el.taskTabs.addEventListener("click", event => {
    const button = event.target.closest("button[data-filter]");
    if (!button) return;
    state.filter = button.dataset.filter;
    el.taskTabs.querySelectorAll("button").forEach(item => item.classList.toggle("active", item === button));
    renderTasks();
  });

  el.previousWeek.addEventListener("click", () => moveSelectedDate(-7));
  el.nextWeek.addEventListener("click", () => moveSelectedDate(7));
  el.todayButton.addEventListener("click", () => selectDate(new Date()));
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
    startAtLogin: el.settingStartAtLogin.checked
  };
  const saved = await window.desktopAPI.saveSettings(nextSettings);
  document.body.classList.toggle("compact", !!saved?.compact);
  localStorage.setItem("today-planner-compact", saved?.compact ? "1" : "0");
  el.settingsDialog.close();
  render();
  showToast("设置已保存");
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
  renderWeek();
  renderTasks();
  renderSchedule();
  renderDayNote();
}

function renderWeek() {
  const monday = getMonday(fromDateKey(state.selectedDate));
  el.weekDays.innerHTML = "";
  for (let i = 0; i < 5; i++) {
    const date = addDays(monday, i);
    const key = toDateKey(date);
    const day = state.data[key];
    const button = document.createElement("button");
    button.className = "day-button";
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

function renderTasks() {
  const titles = { day: "当天待办", week: "本周待办", month: "月度计划", project: "项目清单" };
  el.taskViewTitle.textContent = titles[state.taskView];
  el.taskList.className = `task-list ${state.taskView}-view`;
  el.taskList.innerHTML = "";
  el.taskTabs.classList.remove("hidden");
  el.taskTabs.querySelectorAll("button").forEach(item => item.classList.toggle("active", item.dataset.filter === state.filter));
  const allVisibleTasks = getAllTasks()
    .map(({ task }) => task)
    .filter(task => !isHiddenFutureRecurringInstance(task));

  if (state.taskView === "project") {
    renderProjectTaskList(allVisibleTasks);
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
    datesInMonth(fromDateKey(state.selectedDate)).forEach(dateKey => {
      const tasks = tasksForDateScope(dateKey).filter(task => matchesFilter(task, state.filter));
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
  const byDue = (a, b) => `${a.dueDate || "9999-12-31"} ${a.dueTime || ""}`.localeCompare(`${b.dueDate || "9999-12-31"} ${b.dueTime || ""}`);
  tasks.filter(task => !task.parentId || !ids.has(task.parentId)).sort(byDue).forEach(parent => {
    result.push(parent);
    tasks.filter(task => task.parentId === parent.id).sort(byDue).forEach(child => result.push(child));
  });
  tasks.filter(task => !result.includes(task)).forEach(task => result.push(task));
  return result;
}

function renderProjectTaskList(tasks) {
  el.taskTabs.classList.add("hidden");
  const projects = getProjectSummaries(tasks);
  el.taskCount.textContent = projects.length;
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
  projects.forEach(project => el.taskList.appendChild(createProjectCard(project)));
}

function createProjectCard(project) {
  const card = document.createElement("article");
  card.className = "project-card";
  const progress = ProjectSummaryPolicy.projectProgressPercent(project);
  const firstStart = project.firstStartIso ? formatDateTime(project.firstStartIso) : "未开始";
  const completed = project.lastCompletedIso ? formatDateTime(project.lastCompletedIso) : "未完成";
  card.innerHTML = `
    <div>
      <strong>${escapeHtml(project.parent.title)}</strong>
      <span>${project.taskCount} 个任务 · 完成 ${project.doneCount} 个 · ${formatHours(project.totalHours)}</span>
      <small>开始 ${firstStart} · 最近完成 ${completed}</small>
      <div class="task-progress-track" title="项目进度 ${progress}%"><i style="width:${progress}%"></i></div>
    </div>
    <button class="task-menu" title="查看项目详情">•••</button>`;
  card.querySelector(".task-menu").addEventListener("click", event => {
    event.stopPropagation();
    openTaskDialog(project.parent);
  });
  card.addEventListener("dblclick", () => openTaskDialog(project.parent));
  return card;
}

function getProjectSummaries(tasks = getAllTasks().map(({ task }) => task)) {
  const visible = uniqueTasks(tasks).filter(task => !isHiddenFutureRecurringInstance(task));
  const visibleIds = new Set(visible.map(task => task.id));
  const roots = visible
    .filter(task => !task.parentId || !visibleIds.has(task.parentId))
    .sort((a, b) => `${a.dueDate || "9999-12-31"} ${a.dueTime || ""}`.localeCompare(`${b.dueDate || "9999-12-31"} ${b.dueTime || ""}`));
  return roots.map(root => {
    const descendants = getDescendantTasks(root.id).filter(task => visibleIds.has(task.id));
    const children = descendants.length ? descendants : [root];
    return ProjectSummaryPolicy.summarizeProject({
      parent: root,
      children,
      getTaskDuration
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

function projectTimelineDays(projects) {
  const points = projects.flatMap(project => project.children.flatMap(task => taskTimelineDateKeys(task)));
  const fallback = state.selectedDate;
  const min = points.length ? points.sort()[0] : fallback;
  const max = points.length ? points.sort().at(-1) : fallback;
  const start = addDays(fromDateKey(min), -1);
  const end = addDays(fromDateKey(max), 1);
  const days = [];
  for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
    days.push(toDateKey(cursor));
  }
  return days.slice(0, 90);
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

function taskTimelineSpan(task, days) {
  const points = taskTimelineDateKeys(task);
  const first = points.length ? points.sort()[0] : days[0];
  const last = task.completedAt ? toDateKey(new Date(task.completedAt)) : (task.dueDate || points.sort().at(-1) || first);
  const startIndex = Math.max(0, days.indexOf(first));
  const endIndex = Math.max(startIndex, days.indexOf(last));
  const left = days.length ? (startIndex / days.length) * 100 : 0;
  const width = days.length ? ((endIndex - startIndex + 1) / days.length) * 100 : 100;
  return { left, width: Math.max(width, 4) };
}

function taskEntryOffset(dateKey, days) {
  const index = Math.max(0, days.indexOf(dateKey));
  return days.length ? ((index + .5) / days.length) * 100 : 0;
}

function createTaskCard(task) {
  const duration = getTaskDuration(task.id);
  const schedule = getTaskScheduleInfo(task.id);
  const visualStatus = isUnplannedTask(task) ? "unplanned" : task.status;
  const card = document.createElement("article");
  card.className = `task-card ${visualStatus}`;
  card.draggable = visualStatus === "unplanned" || task.status === "planned" || task.status === "in_progress";
  card.dataset.taskId = task.id;
  card.innerHTML = `
    <button class="task-check" title="标记完成"></button>
    <div class="task-body">
      <strong>${escapeHtml(task.title)}</strong>
      <div class="task-meta">
        <span class="priority-badge ${task.priority || "general_daily"}">${priorityLabel(task.priority)}</span>
        <span>${formatDue(task)}</span>
        <span>${statusLabel(visualStatus)}</span>
        ${duration ? `<span class="task-duration">${formatHours(duration)}</span>` : ""}
        ${task.recurrence?.frequency === "monthly" ? `<span>↻ 每月重复</span>` : ""}
        ${task.status === "planned" && schedule ? `<span>已安排 ${formatDateTime(schedule.firstStartIso)}</span>` : ""}
      </div>
      ${task.status === "in_progress" || task.progress > 0 ? `<div class="task-progress-track" title="进度 ${task.progress || 0}%"><i style="width:${task.progress || 0}%"></i></div>` : ""}
    </div>
    <button class="task-menu" title="编辑待办">•••</button>`;

  card.querySelector(".task-check").addEventListener("click", event => {
    event.stopPropagation();
    task.status = task.status === "done" ? getAutomaticTaskStatus(task.id) : "done";
    task.progress = task.status === "done" ? 100 : Math.min(task.progress || 0, 95);
    task.completedAt = ["done", "closed"].includes(task.status) ? new Date().toISOString() : "";
    task.updatedAt = new Date().toISOString();
    saveData(); render(); showToast(task.status === "done" ? "任务已完成" : "任务已恢复");
  });
  card.querySelector(".task-menu").addEventListener("click", event => {
    event.stopPropagation();
    openTaskDialog(task);
  });
  card.querySelector(".task-body").addEventListener("dblclick", () => openTaskDialog(task));
  card.addEventListener("dragstart", event => {
    card.classList.add("dragging");
    event.dataTransfer.setData("text/task-id", task.id);
    event.dataTransfer.effectAllowed = "copy";
  });
  card.addEventListener("dragend", () => card.classList.remove("dragging"));
  return card;
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
  return uniqueTasks(tasks);
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
  const parent = task.parentId ? findTask(task.parentId)?.task : null;
  const duration = getTaskDuration(task.id);
  const schedule = getTaskScheduleInfo(task.id);
  const latestProgress = latestTaskProgressNote(task.id);
  const rows = [
    ["状态", statusLabel(task.status)],
    ["优先级", priorityLabel(task.priority)],
    ["责任人", task.owner || "未指定"],
    ["目标", formatDue(task)],
    ["任务归属", parent ? parent.title : "主计划"],
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
  el.taskParent.innerHTML = `<option value="">不选择，作为主计划</option>`;
  getAllTasks()
    .filter(({ task }) => !task.parentId && !["done", "closed"].includes(task.status) && task.id !== editingTask?.id)
    .filter(({ task }) => !isHiddenFutureRecurringInstance(task))
    .sort((a, b) => `${a.task.dueDate} ${a.task.dueTime}`.localeCompare(`${b.task.dueDate} ${b.task.dueTime}`))
    .forEach(({ task }) => {
      const option = new Option(`${task.dueDate.slice(5)} · ${task.title}`, task.id);
      el.taskParent.add(option);
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
  if (payload.dueTime && !payload.dueDate) return showTaskFieldError(el.taskDueDate, "填写目标时间时，请同时选择目标日期");
  if (payload.dueDate && !payload.dueTime) payload.dueTime = "18:00";
  if (payload.recurrence && !payload.dueDate) return showTaskFieldError(el.taskDueDate, "月度固定任务需要选择首次目标日期");
  if (payload.recurrence && !payload.recurrence.until) {
    return showTaskFieldError(el.taskRecurringUntil, "请选择月度规则有效至哪个月");
  }
  if (payload.recurrence && payload.recurrence.until < payload.dueDate.slice(0, 7)) {
    return showTaskFieldError(el.taskRecurringUntil, "结束月份不能早于首次截止月份");
  }
  if (!["done", "closed"].includes(payload.status)) {
    payload.status = getAutomaticTaskStatusForPayload(state.editingTaskId, payload);
  }
  if (payload.status === "in_progress" && !payload.startedAt) payload.startedAt = getTaskScheduleInfo(state.editingTaskId)?.firstStartIso || new Date().toISOString();
  if (["done", "closed"].includes(payload.status) && !payload.completedAt) payload.completedAt = new Date().toISOString();
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

function renderSchedule() {
  el.timeline.className = "timeline";
  if (state.taskView === "project") return renderProjectSchedule();
  if (state.taskView === "week") return renderWeekSchedule();
  if (state.taskView === "month") return renderMonthSchedule();
  renderDayTimeline();
}

function renderProjectSchedule() {
  const projects = getProjectSummaries();
  el.timeline.innerHTML = "";
  el.timeline.className = "project-gantt";
  if (!projects.length) {
    el.timeline.innerHTML = `<div class="empty-state">还没有可展示的项目进度</div>`;
    el.loggedHours.textContent = "0h";
    el.freeHours.textContent = "—";
    return;
  }
  const days = projectTimelineDays(projects);
  const totalHours = projects.reduce((sum, project) => sum + project.totalHours, 0);
  el.loggedHours.textContent = `${trimNumber(totalHours)}h`;
  el.freeHours.textContent = `${projects.length} 项`;
  const header = document.createElement("div");
  header.className = "project-gantt-days";
  header.style.gridTemplateColumns = `180px repeat(${days.length}, minmax(34px, 1fr))`;
  header.innerHTML = `<span>任务</span>${days.map(day => `<span>${day.slice(5).replace("-", "/")}</span>`).join("")}`;
  el.timeline.appendChild(header);
  projects.forEach(project => {
    const progress = ProjectSummaryPolicy.projectProgressPercent(project);
    const section = document.createElement("section");
    section.className = "project-gantt-section";
    section.innerHTML = `<header>
      <div>
        <h3>${escapeHtml(project.parent.title)}</h3>
        <p>${project.taskCount} 个任务 · 完成 ${project.doneCount} 个 · ${formatHours(project.totalHours)} · 进度 ${progress}%</p>
      </div>
      <button class="soft-button" type="button">详情</button>
    </header>`;
    section.querySelector("button").addEventListener("click", () => openTaskDialog(project.parent));
    project.children.forEach(task => section.appendChild(createProjectGanttRow(task, days)));
    el.timeline.appendChild(section);
  });
}

function createProjectGanttRow(task, days) {
  const row = document.createElement("div");
  row.className = `project-gantt-row ${task.status}`;
  const span = taskTimelineSpan(task, days);
  const entries = getTaskScheduleEntries(task.id);
  row.innerHTML = `
    <div class="project-gantt-label">
      <strong>${escapeHtml(task.title)}</strong>
      <span>${statusLabel(task.status)} · ${formatHours(getTaskDuration(task.id))}</span>
    </div>
    <div class="project-gantt-lane">
      <i style="left:${span.left}%;width:${span.width}%"></i>
      ${entries.map(item => `<em style="left:${taskEntryOffset(item.dateKey, days)}%" title="${item.dateKey} ${formatTime(item.entry.start)}-${formatTime(item.entry.end)}"></em>`).join("")}
    </div>`;
  row.addEventListener("dblclick", () => openTaskDialog(task));
  return row;
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
      event.preventDefault(); slot.classList.remove("drag-over");
      const found = findTask(event.dataTransfer.getData("text/task-id"));
      if (found) createEntryFromTask(found.task, hour);
    });
    el.timeline.appendChild(row);
  });
  const layoutItems = layoutOverlappingEntries(day.entries);
  layoutItems.forEach(({ entry, column, columns }) => {
    const item = document.createElement("article");
    const top = (entry.start - HOURS[0]) * getHourHeight() + 3;
    const height = (entry.end - entry.start) * getHourHeight() - 6;
    item.className = `schedule-entry ${entry.color || "sage"}`;
    if (columns >= 3) item.classList.add("dense");
    if (columns >= 4) item.classList.add("very-dense");
    item.style.top = `${top}px`;
    item.style.height = `${Math.max(height, 38)}px`;
    item.style.setProperty("--entry-column", column);
    item.style.setProperty("--entry-columns", columns);
    item.innerHTML = `<strong>${escapeHtml(entry.title)}</strong>
      <span>${formatTime(entry.start)} – ${formatTime(entry.end)} · ${formatHours(entry.end - entry.start)}</span>
      ${entry.note ? `<p>${escapeHtml(entry.note)}</p>` : ""}`;
    item.addEventListener("click", () => openEntryDialog(entry.start, entry));
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
  for (let i = 0; i < 5; i++) {
    const date = addDays(monday, i);
    const key = toDateKey(date);
    const column = document.createElement("section");
    column.className = `week-schedule-day${key === state.selectedDate ? " selected" : ""}`;
    const taskTraces = taskTracesForDate(key);
    column.innerHTML = `<h4>${WEEKDAY_NAMES[date.getDay()]} · ${date.getMonth() + 1}/${date.getDate()}</h4>
      <button type="button" class="week-add-task" data-date="${key}">＋ 新建待办</button>
      ${renderTaskTraceList(taskTraces, "week")}`;
    column.querySelector(".week-add-task").addEventListener("click", event => {
      event.stopPropagation();
      openTaskDialogForDate(key);
    });
    bindScheduleDrop(column, key, 9);
    const entries = [...getDay(key).entries].sort((a, b) => a.start - b.start);
    entries.forEach(entry => {
      logged += getEntryInvestedHours(key, entry);
      scheduled += entry.end - entry.start;
    });
    if (!taskTraces.length) column.insertAdjacentHTML("beforeend", `<div class="empty-state">暂无任务</div>`);
    bindDueTaskList(column, key);
    column.addEventListener("dblclick", event => {
      if (event.target === column) {
        state.selectedDate = key;
        render();
      }
    });
    el.timeline.appendChild(column);
  }
  el.loggedHours.textContent = `${trimNumber(logged)}h`;
  el.freeHours.textContent = `${trimNumber(Math.max(0, 5 * HOURS.length - scheduled))}h`;
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
    const taskTraces = taskTracesForDate(key);
    entries.forEach(entry => logged += getEntryInvestedHours(key, entry));
    const cell = document.createElement("section");
    cell.className = "schedule-month-cell";
    if (date.getMonth() !== selected.getMonth()) cell.classList.add("outside");
    if (key === state.selectedDate) cell.classList.add("selected");
    if (isToday(date)) cell.classList.add("today");
    cell.innerHTML = `<header><span>${date.getDate()}</span><span>${holidayLabel(key)}</span></header>
      ${renderTaskTraceList(taskTraces, "month")}
      `;
    bindScheduleDrop(cell, key, 9);
    cell.addEventListener("click", () => {
      state.selectedDate = key;
      state.taskView = "day";
      el.viewSwitcher.querySelectorAll("button").forEach(item => item.classList.toggle("active", item.dataset.view === "day"));
      render();
    });
    bindDueTaskList(cell, key);
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
  return [...traces.values()].sort((a, b) => `${a.task.dueDate || ""} ${a.task.dueTime || ""}`.localeCompare(`${b.task.dueDate || ""} ${b.task.dueTime || ""}`));
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
    target.classList.remove("drag-over");
    const found = findTask(event.dataTransfer.getData("text/task-id"));
    if (found) createEntryFromTask(found.task, hour, dateKey);
  });
}

function createEntryFromTask(task, hour, dateKey = state.selectedDate) {
  getDay(dateKey).entries.push({
    id: crypto.randomUUID(), taskId: task.id, title: task.title,
    start: hour, end: Math.min(hour + 1, 22), note: "", color: "sage"
  });
  applyAutomaticTaskStatus(task);
  saveData(); render(); showToast(`已安排到 ${dateKey.slice(5)} ${formatTime(hour)}`);
}

function openEntryDialog(hour, entry = null) {
  state.editingEntryId = entry?.id || null;
  state.selectedColor = entry?.color || "sage";
  el.entryEyebrow.textContent = entry ? "EDIT ENTRY" : "NEW ENTRY";
  el.entryDialogTitle.textContent = entry ? "编辑日程" : "添加日程";
  el.entryTitle.value = entry?.title || "";
  fillEntryTaskOptions(entry);
  el.entryStart.value = entry?.start ?? hour;
  el.entryEnd.value = entry?.end ?? Math.min(hour + 1, 22);
  el.entryNote.value = entry?.note || "";
  el.deleteEntryButton.classList.toggle("hidden", !entry);
  el.colorPicker.querySelectorAll("button").forEach(item => item.classList.toggle("selected", item.dataset.color === state.selectedColor));
  el.entryDialog.showModal();
  setTimeout(() => el.entryTitle.focus(), 50);
}

function saveEntry() {
  const payload = {
    title: el.entryTitle.value.trim(), start: Number(el.entryStart.value), end: Number(el.entryEnd.value),
    note: el.entryNote.value.trim(), color: state.selectedColor
  };
  if (!payload.title || payload.end <= payload.start) return showToast("请检查事项和时间");
  const day = getDay();
  const existingEntry = state.editingEntryId ? day.entries.find(entry => entry.id === state.editingEntryId) : null;
  const previousTaskId = existingEntry?.taskId || "";
  payload.taskId = resolveEntryTaskLink(payload, existingEntry);
  if (state.editingEntryId) Object.assign(existingEntry, payload);
  else day.entries.push({ id: crypto.randomUUID(), ...payload });
  [previousTaskId, payload.taskId].filter(Boolean).forEach(taskId => {
    const linked = findTask(taskId)?.task;
    if (linked && !["done", "closed"].includes(linked.status)) {
      applyAutomaticTaskStatus(linked);
      if (payload.note) linked.updatedAt = new Date().toISOString();
    }
  });
  focusLinkedTaskFilter(payload.taskId);
  saveData(); el.entryDialog.close(); render();
  showToast(state.editingEntryId ? "日程已更新" : "日程已添加");
}

function focusLinkedTaskFilter(taskId) {
  const linked = findTask(taskId)?.task;
  if (!linked || state.taskView === "month") return;
  state.filter = ["done", "closed"].includes(linked.status) ? "ended" : linked.status;
}

function fillEntryTaskOptions(entry = null) {
  el.entryTaskLink.innerHTML = "";
  el.entryTaskLink.add(new Option("自动创建为待办（推荐）", "__create__"));
  getAllTasks()
    .filter(({ task }) => TaskOptionPolicy.shouldIncludeEntryTaskOption({
      task,
      isHiddenFutureRecurringInstance: isHiddenFutureRecurringInstance(task),
      isCurrentLinkedTask: entry?.taskId === task.id
    }))
    .sort((a, b) => `${a.task.dueDate} ${a.task.dueTime}`.localeCompare(`${b.task.dueDate} ${b.task.dueTime}`))
    .forEach(({ task }) => {
      el.entryTaskLink.add(new Option(TaskOptionPolicy.entryTaskOptionLabel({
        task,
        selectedDate: state.selectedDate,
        hasChildren: hasChildTasks(task.id)
      }), task.id));
    });
  el.entryTaskLink.value = entry?.taskId || "__create__";
}

function resolveEntryTaskLink(entryPayload, existingEntry = null) {
  const selected = el.entryTaskLink.value;
  if (selected && selected !== "__create__") return selected;
  if (existingEntry?.taskId) return existingEntry.taskId;
  return createTaskFromEntryPayload(entryPayload).id;
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
  if (!scheduled || !invested) {
    if (task.status === "planned") task.progress = 0;
    return task.progress !== previous;
  }
  const autoProgress = Math.min(95, Math.max(5, Math.round(invested / scheduled * 95)));
  task.progress = Math.max(task.progress || 0, autoProgress);
  return task.progress !== previous;
}

function hasScheduledEntry(taskId) {
  return Object.values(state.data).some(day => (day.entries || []).some(entry => entry.taskId === taskId));
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
  const schedule = getTaskScheduleInfo(taskId, now);
  return schedule?.hasStarted ? "in_progress" : "planned";
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
  if (nextStatus === "in_progress") task.progress = Math.max(task.progress || 0, 5);
  else if (!schedule?.hasStarted) task.progress = 0;
  if ((task.progress || 0) !== beforeStatusProgress) changed = true;
  if (changed) task.updatedAt = now.toISOString();
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
  return getAllTasks()
    .map(({ task }) => task)
    .filter(task => task.parentId === parentId);
}

function matchesFilter(task, filter) {
  if (!isTodoListTask(task)) return false;
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
