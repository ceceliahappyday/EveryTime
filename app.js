const WORK_HOURS_STORAGE_KEY = "today-planner-work-hours";
const WEEKDAY_NAMES = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const MONTH_WEEKDAY_NAMES = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
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

const initialTaskFilter = typeof TodoListPolicy !== "undefined" ? TodoListPolicy.loadSavedFilter() : "in_progress";
const state = {
  selectedDate: toDateKey(new Date()),
  listKind: initialTaskFilter === "meeting" ? "meeting" : "todo",
  filter: initialTaskFilter === "meeting" ? "in_progress" : initialTaskFilter,
  lastTodoFilter: initialTaskFilter === "meeting" ? "in_progress" : initialTaskFilter,
  meetingFilter: "all",
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
  ganttArrangeConfig: null,
  ganttArrangePreview: null,
  ganttArrangeAbort: null,
  ganttArrangeKeepOpen: false,
  projectCollapsedSections: new Set(),
  projectCollapsedTasks: new Set(),
  todoCollapsedSections: new Set(),
  editingTaskId: null,
  editingParentTaskId: null,
  editingEntryId: null,
  editingEntryDateKey: null,
  taskSubtaskDrafts: [],
  selectedColor: "sage",
  workStartHour: ScheduleHoursPolicy?.DEFAULT_WORK_START ?? 9,
  workEndHour: ScheduleHoursPolicy?.DEFAULT_WORK_END ?? 18,
  ganttLabelWidth: null,
  data: loadData()
};

const el = {};
let toastTimer;
let timelineScrollBarTimer;
let projectGanttScrollTimer;
let taskListScrollBarTimer;
let persistentWritesEnabled = false;
let pendingEntrySave = null;
let pendingCloseTaskId = null;
let pendingSuccessorRollback = null;
let successorDialogCommitted = false;
let syncingAttentionMode = false;
let taskListSearchTimer = null;

document.addEventListener("DOMContentLoaded", async () => {
  [
    "todaySummary", "monthLabel", "monthPickerButton", "datePicker", "dateControls", "dateNavPrev", "dateNavNext",
    "appVersionBadge",
    "taskPanel", "todayButton", "weekDays", "taskCount", "taskList", "taskListSearch", "taskSearchWrap", "continueYesterdayButton", "unplannedCount", "openCount", "doneCount", "closedCount", "memoCount", "meetingCount", "exportButton",
    "plannedHours", "progressLabel", "progressBar", "scheduleTitle", "loggedHours", "freeHours",
    "timeline", "timelineWrap", "projectGanttChrome", "quickAddButton", "quickTaskForm", "quickTaskInput", "taskAddTrigger", "panelAiImageInput", "workspaceSplitHandle", "viewSwitcher",
    "taskTabs", "meetingTabs", "allCount", "meetingAllCount", "meetingPlannedCount", "meetingDoingCount", "meetingEndedCount",
    "taskViewTitle", "listKindTodo", "listKindMeeting", "listKindMenu", "listKindMenuButton", "listKindMenuLabel", "listKindMenuPanel", "taskDialog", "taskEditForm", "taskDialogEyebrow", "taskDialogTitle",
    "taskDetailSummary", "followUpDraftHint", "taskDialogScroll", "taskDialogCloseButton", "taskDialogCancelButton",
    "taskCreateKindField", "taskCreateKind",
    "taskTabsWrap", "taskTabsMore", "taskTabsMoreButton", "taskTabsMoreMenu",
    "taskTitleInput", "taskDueDateTime", "taskMeetingEndField", "taskMeetingEndDateTime", "taskOwner", "taskParentField", "taskParent", "taskParentTrigger", "taskParentPopup", "taskParentSearch", "taskParentOptions", "taskParentCombobox", "taskPriority",
    "taskProgress", "taskProgressValue", "taskStatus", "taskMonthlyRecurring", "taskRecurringUntil",
    "taskFollowUpOption", "taskFollowUpTracking", "taskFollowUpTrackingLabel",
    "recurringOptions", "taskActualStart", "taskActualEnd",
    "taskBusinessBackground", "taskProblemReason", "taskDeliveryNote", "businessBackgroundLabel",
    "problemReasonLabel", "taskDescription", "taskTitleField", "taskDueDateField", "taskDeliveryField",
    "taskSubtaskList", "taskSubtaskDraftInput", "taskSubtasksSection",
    "deleteTaskButton", "closeTaskButton", "mergeTaskButton", "entryDialog", "entryForm", "entryEyebrow", "entryDialogTitle", "entryTitle", "entryType",
    "entryLinkConfirmDialog", "entryLinkConfirmTitle", "entryLinkConfirmMessage", "entryLinkConfirmOptions", "entryLinkConfirmCancel", "entryLinkConfirmCreate",
    "taskCloseConfirmDialog", "taskCloseConfirmTitle", "taskCloseConfirmMessage", "taskCloseCompletedAt", "taskCloseCompletionNote", "taskCloseOnlyButton", "taskCloseSuccessorButton",
    "taskMergeDialog", "taskMergeForm", "taskMergeMessage", "taskMergeTarget", "taskMergeSearch", "taskMergeOptions",
    "entryTaskLink", "entryTaskCombobox", "entryTaskTrigger", "entryTaskPopup", "entryTaskSearch", "entryTaskOptions", "entryStart", "entryEnd", "entryOwner", "entryNote", "colorPicker", "deleteEntryButton", "dayNoteButton",
    "dayNoteText", "noteDialog", "noteForm", "dayNoteInput", "toast",
    "updateProgress", "updateProgressText", "updateProgressBar",
    "exportDialog", "exportForm", "exportFormat", "importButton", "minimizeWindow", "maximizeWindow", "closeWindow", "aiAssistantButton", "aiDialog", "aiForm", "aiPrompt", "aiPeriodStart", "aiPeriodEnd", "aiResult", "aiStatus", "aiCopyButton", "aiExportTablesButton", "aiQuickActions",
    "aiChatLog", "aiAttachment", "aiAttachmentPreview", "aiAttachmentClear", "aiImageInput", "aiAttachImageButton", "aiSubmitButton", "aiScreenshotHintButton",
    "taskAiDropzone", "taskAiDropzoneBody", "taskAiDropzoneStatus", "taskAiImageInput", "taskAiPickImageButton",
    "aiBatchDraftDialog", "aiBatchDraftForm", "aiBatchDraftTitle", "aiBatchDraftHint", "aiBatchDraftList", "aiBatchSelectAllButton", "aiBatchCreateButton",
    "progressReviewButton", "progressReviewDialog", "progressReviewForm", "progressReviewList",
    "taskPanelToggle",
    "focusViewChrome", "focusViewButton", "focusViewMenu",
    "glassToggleButton",
    "topbarMain", "headerToolsSlot", "headerTools", "headerOverflow", "headerMoreButton", "headerMoreMenu", "headerActions",
    "settingsButton", "settingsDialog", "settingsForm", "settingGlass", "settingPinned", "settingLocked",
    "settingCompact", "settingStartAtLogin", "settingWorkStartHour", "settingWorkEndHour",
    "settingAiEnabled", "settingAiApiKey", "settingAiProvider", "settingAiModel", "aiDetectModelsButton", "aiKeyStatus",
    "settingsAppVersion", "checkUpdateButton", "settingsDataPath", "settingsExportPath"
  ].forEach(id => el[id] = document.getElementById(id));

  await initPersistentStorage();
  migrateData();
  ensureEntryTaskLinks();
  ensureRecurringTasksForVisibleRange();
  persistentWritesEnabled = true;
  saveData();
  applyStoredWorkHours();
  fillWorkHourSettingOptions();
  fillTimeOptions();
  bindEvents();
  if (localStorage.getItem("today-planner-compact") === "1") document.body.classList.add("compact");
  bindUiScale();
  bindWindowResize();
  bindHeaderOverflow();
  bindTaskPanelToggle();
  bindFocusViewMenu();
  applyTaskPanelWidth(loadTaskPanelWidth());
  bindWorkspaceSplitResize();
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
      entry.owner ||= "";
      entry.color ||= "sage";
    });
    day.tasks.forEach(task => {
      task.parentId ||= task.parentTaskId || task.parentTask || task.parent || "";
      task.dueDate ??= dateKey;
      task.dueTime ??= `${String(ScheduleHoursPolicy?.DEFAULT_WORK_END ?? 18).padStart(2, "0")}:00`;
      task.owner ||= "我";
      task.parentId ||= "";
      task.description ||= "";
      task.priority = migratePriority(task.priority);
      // monthly_fixed is UI-only; never persist it. Repair any earlier mistaken writes.
      if (task.priority === "monthly_fixed") task.priority = "general_daily";
      task.progress = Number(task.progress || (task.status === "done" ? 100 : 0));
      const knownStatuses = new Set(["planned", "in_progress", "tracking", "done", "closed"]);
      if (!knownStatuses.has(task.status)) task.status = "planned";
      task.startedAt ||= "";
      task.completedAt ||= "";
      task.createdAtIso ||= new Date(`${dateKey}T09:00:00`).toISOString();
      task.updatedAt ||= task.createdAtIso;
      task.businessBackground ||= "";
      task.problemReason ||= "";
      task.deliveryNote ||= "";
      task.recurrence ||= null;
      task.recurrenceGroupId ||= "";
      task.followUpFromTaskId ||= "";
      task.memoFromTaskId ||= "";
      task.setupIncomplete = Boolean(task.setupIncomplete);
      if (task.status === "closed") {
        task.status = "done";
        task.completedAt ||= task.updatedAt || new Date().toISOString();
      }
      if (task.completedAt && !TaskStatusPolicy.isTrackingStatus(task)) {
        task.status = "done";
        task.progress = 100;
      }
      task.startOverrideAt ||= "";
    });
  });
  if (typeof ScheduleHierarchyRepairPolicy?.repairPlannerData === "function") {
    ScheduleHierarchyRepairPolicy.repairPlannerData(state.data, {
      createId: () => crypto.randomUUID(),
      now: new Date()
    });
  }
  if (typeof ScheduleMeetingDemotePolicy?.demoteMeetingEventTasks === "function") {
    ScheduleMeetingDemotePolicy.demoteMeetingEventTasks(state.data);
  }
  saveData();
}

function ensureEntryTaskLinks() {
  // Historical entries without a task link remain calendar-only records.
  // New task links are created explicitly from the entry type selector.
}

function saveData() {
  invalidateRecurringCatalogCache();
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
  bindDialogDismissControls();
  el.exportButton.addEventListener("click", () => el.exportDialog.showModal());
  el.importButton?.addEventListener("click", () => importAllData());
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
  el.quickAddButton?.addEventListener("click", () => openNewFromQuickAdd());
  el.quickTaskForm.addEventListener("submit", event => {
    event.preventDefault();
    openNewFromQuickAdd();
  });
  el.taskAddTrigger?.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    openNewFromQuickAdd();
  });
  el.quickTaskInput?.addEventListener("keydown", event => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    openNewFromQuickAdd();
  });
  el.taskCreateKind?.addEventListener("change", () => syncTaskCreateKindUi());
  el.panelAiImageInput?.addEventListener("change", async () => {
    const file = el.panelAiImageInput.files?.[0];
    el.panelAiImageInput.value = "";
    if (file) await extractAndCreateTaskFromImage({ file, source: "task-dialog" });
  });
  el.taskPanel?.addEventListener("paste", event => {
    handlePanelScreenshotPaste(event);
  });

  el.viewSwitcher.addEventListener("click", event => {
    const button = event.target.closest("button[data-view]");
    if (!button) return;
    applyTaskView(button.dataset.view, { expand: false });
  });

  el.taskTabs.addEventListener("click", event => {
    const button = event.target.closest("button[data-filter]");
    if (!button) return;
    applyTaskFilter(button.dataset.filter);
  });
  el.meetingTabs?.addEventListener("click", event => {
    const button = event.target.closest("button[data-meeting-filter]");
    if (!button) return;
    applyMeetingFilter(button.dataset.meetingFilter);
  });
  el.taskTabsMoreMenu?.addEventListener("click", event => {
    const button = event.target.closest("button[data-filter]");
    if (!button) return;
    applyTaskFilter(button.dataset.filter);
    closeTaskTabsMoreMenu();
  });
  el.taskTabsMoreButton?.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    const open = el.taskTabsMoreMenu?.hidden;
    if (open) openTaskTabsMoreMenu();
    else closeTaskTabsMoreMenu();
  });
  document.addEventListener("pointerdown", event => {
    if (el.taskTabsMore?.contains(event.target)) return;
    closeTaskTabsMoreMenu();
  });
  window.addEventListener("resize", () => {
    syncTaskPanelDensity();
    adaptTaskTabsOverflow();
  }, { passive: true });
  if (typeof ResizeObserver === "function") {
    if (el.taskPanel) {
      new ResizeObserver(() => {
        syncTaskPanelDensity();
        adaptTaskTabsOverflow();
      }).observe(el.taskPanel);
    } else if (el.taskTabsWrap) {
      new ResizeObserver(() => adaptTaskTabsOverflow()).observe(el.taskTabsWrap);
    }
  }

  el.taskListSearch?.addEventListener("input", () => {
    state.taskListSearch = el.taskListSearch.value;
    state.showContinueYesterdayOnly = false;
    el.continueYesterdayButton?.classList.remove("active");
    el.taskSearchWrap?.classList.toggle("has-query", Boolean((el.taskListSearch.value || "").trim()));
    clearTimeout(taskListSearchTimer);
    taskListSearchTimer = setTimeout(() => {
      const selectionStart = el.taskListSearch.selectionStart;
      renderTasks();
      el.taskListSearch.focus({ preventScroll: true });
      if (selectionStart !== null) el.taskListSearch.setSelectionRange(selectionStart, selectionStart);
    }, 120);
  });
  el.taskListSearch?.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    if ((el.taskListSearch.value || "").trim()) {
      el.taskListSearch.value = "";
      state.taskListSearch = "";
      el.taskSearchWrap?.classList.remove("has-query");
      renderTasks();
    }
  });

  el.continueYesterdayButton?.addEventListener("click", () => {
    state.listKind = "todo";
    state.showContinueYesterdayOnly = !state.showContinueYesterdayOnly;
    el.continueYesterdayButton.classList.toggle("active", state.showContinueYesterdayOnly);
    if (state.showContinueYesterdayOnly) {
      state.filter = "all";
      state.lastTodoFilter = "all";
      TodoListPolicy.saveFilter(state.filter);
      el.taskTabs.querySelectorAll("button").forEach(item => item.classList.toggle("active", item.dataset.filter === "all"));
    }
    renderTasks();
  });

  el.listKindTodo?.addEventListener("click", () => applyListKind("todo"));
  el.listKindMeeting?.addEventListener("click", () => applyListKind("meeting"));
  el.listKindMenuButton?.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    if (el.listKindMenuPanel?.hidden) openListKindMenu();
    else closeListKindMenu();
  });
  el.listKindMenuPanel?.addEventListener("click", event => {
    const button = event.target.closest("button[data-list-kind]");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    applyListKind(button.dataset.listKind === "meeting" ? "meeting" : "todo");
    closeListKindMenu();
  });
  document.addEventListener("pointerdown", event => {
    if (el.listKindMenu?.contains(event.target)) return;
    if (el.listKindMenuPanel?.contains(event.target)) return;
    closeListKindMenu();
  });
  window.addEventListener("resize", () => {
    if (!el.listKindMenuPanel?.hidden) positionListKindMenuPanel();
  }, { passive: true });

  el.mergeTaskButton?.addEventListener("click", () => openTaskMergeDialog());
  bindTaskMergePicker();
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
      const existingParent = findTaskByNormalizedTitle(parentTitle);
      if (existingParent) {
        const existingLeaf = findLeafUnderParentByTitle(existingParent.id, entryPayload.title);
        if (existingLeaf) {
          pendingEntrySave = null;
          el.entryLinkConfirmDialog.close();
          showToast(`已关联到「${existingParent.title}」下的已有子待办，未重复创建`);
          resolve(existingLeaf.id);
          return;
        }
      }
      task = createParentAndLeafFromEntryPayload(entryPayload, parentTitle);
      showToast(existingParent
        ? `已在已有父级「${existingParent.title}」下新建子待办`
        : `已新建父级「${parentTitle}」并挂入子待办`);
    } else {
      task = createTaskFromEntryPayload(entryPayload);
    }
    pendingEntrySave = null;
    el.entryLinkConfirmDialog.close();
    resolve(task.id);
  });

  el.previousWeek = el.dateNavPrev;
  el.nextWeek = el.dateNavNext;

  el.dateNavPrev?.addEventListener("click", () => navigateCalendar(-1));
  el.dateNavNext?.addEventListener("click", () => navigateCalendar(1));
  el.todayButton.addEventListener("click", () => goToTodayDayView());
  el.monthPickerButton.addEventListener("click", () => el.datePicker.showPicker ? el.datePicker.showPicker() : el.datePicker.click());
  el.datePicker.addEventListener("change", () => el.datePicker.value && selectDate(fromDateKey(el.datePicker.value)));

  document.addEventListener("keydown", event => {
    if (!NavigationPolicy.shouldShowDateNav(state.taskView)) return;
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.target.closest("dialog[open], input, textarea, select, [contenteditable='true']")) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      navigateCalendar(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      navigateCalendar(1);
    } else if (event.key === "t" || event.key === "T") {
      event.preventDefault();
      selectDate(new Date());
    }
  });

  el.taskEditForm.addEventListener("submit", event => {
    event.preventDefault();
    // Only the primary save button should create/update tasks.
    if (event.submitter?.hasAttribute?.("data-close-dialog")) {
      closeDialogById(event.submitter.getAttribute("data-close-dialog"));
      return;
    }
    saveTask();
  });
  el.taskDialogCloseButton?.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    closeDialogById("taskDialog");
  });
  el.taskDialogCancelButton?.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    closeDialogById("taskDialog");
  });
  el.taskDialog?.addEventListener("close", () => {
    if (!successorDialogCommitted) abandonPendingSuccessorRollback();
    successorDialogCommitted = false;
    if (suppressParentReviewAdvance) return;
    if (parentReviewAdvanceOnClose) {
      parentReviewAdvanceOnClose = false;
      scheduleParentReviewAdvance();
      return;
    }
    if (parentReviewPausedForFollowUp) {
      parentReviewPausedForFollowUp = false;
      scheduleParentReviewAdvance();
    }
  });
  el.deleteTaskButton.addEventListener("click", deleteEditingTask);
  el.closeTaskButton.addEventListener("click", closeEditingTask);
  el.taskCloseOnlyButton?.addEventListener("click", () => confirmCloseTaskChoice("only"));
  el.taskCloseSuccessorButton?.addEventListener("click", () => confirmCloseTaskChoice("successor"));
  el.taskFollowUpTracking?.addEventListener("change", () => syncAttentionMode("checkbox"));
  el.taskCloseConfirmDialog?.addEventListener("close", () => {
    const cancelledId = pendingCloseTaskId;
    pendingCloseTaskId = null;
    if (cancelledId && parentReviewResumeTaskId === cancelledId) {
      parentReviewResumeTaskId = null;
      pendingParentReviewQueue.unshift(cancelledId);
      scheduleParentReviewAdvance();
    }
  });
  el.taskProgress.addEventListener("input", () => el.taskProgressValue.textContent = `${el.taskProgress.value}%`);
  el.taskStatus.addEventListener("change", () => {
    syncAttentionMode("status");
    updateProgressAvailability();
  });
  el.taskParent.addEventListener("change", updateParentRequirements);
  bindTaskParentCombobox();
  el.taskPriority.addEventListener("change", () => {
    syncMonthlyRecurringFromPriority();
    updateRecurringOptions();
    restoreTaskStatusOptions({
      status: el.taskStatus?.value || "planned",
      priority: el.taskPriority.value
    });
    updateProgressAvailability();
  });
  el.taskMonthlyRecurring?.addEventListener("change", updateRecurringOptions);
  [el.taskActualStart, el.taskActualEnd].forEach(enableNativePicker);
  bindFlexibleDateTimeInput(el.taskDueDateTime, { kind: () => (isCreateMeetingKind() ? "start" : "end") });
  bindFlexibleDateTimeInput(el.taskMeetingEndDateTime, { kind: "end" });
  bindWorkHourDateTimeDefault(el.taskActualStart, "start");
  bindWorkHourDateTimeDefault(el.taskActualEnd, "end");
  document.querySelectorAll("[data-datetime-target]").forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();
      openDateTimePickerForInput(button.dataset.datetimeTarget);
    });
  });
  el.taskDueDateTime?.addEventListener("change", () => {
    ensureDueDateTimeUsesWorkEnd();
    const dueDate = getTaskDueParts().dueDate;
    if (isMonthlyPrioritySelected() && dueDate) {
      const currentUntil = el.taskRecurringUntil.value;
      if (!currentUntil || currentUntil < dueDate.slice(0, 7)) {
        el.taskRecurringUntil.value = defaultRecurringUntil(dueDate);
      }
    }
    if (!isCreateMeetingKind() || !el.taskMeetingEndDateTime) return;
    const startParts = parseDateTimeLocalParts(el.taskDueDateTime.value || "");
    const endParts = parseDateTimeLocalParts(el.taskMeetingEndDateTime.value || "");
    if (!startParts.dateKey || startParts.hour == null) return;
    const endEmpty = !String(el.taskMeetingEndDateTime.value || "").trim();
    const endInvalid = endParts.dateKey === startParts.dateKey && endParts.hour != null && endParts.hour <= startParts.hour;
    if (endEmpty || endInvalid) {
      el.taskMeetingEndDateTime.value = "";
      ensureMeetingEndDefault();
    }
  });
  el.taskSubtaskDraftInput?.addEventListener("keydown", event => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    commitTaskSubtaskDraft();
  });
  el.taskActualEnd.addEventListener("change", () => {
    updateProgressAvailability();
  });

  el.entryForm.addEventListener("submit", event => {
    event.preventDefault();
    saveEntry();
  });
  el.entryDialog.addEventListener("close", () => {
    state.editingEntryId = null;
    state.editingEntryDateKey = null;
  });
  el.entryType.addEventListener("change", updateEntryTypeControls);
  bindEntryTaskCombobox();
  el.entryStart.addEventListener("change", () => {
    if (Number(el.entryEnd.value) <= Number(el.entryStart.value)) {
      el.entryEnd.value = Math.min(Number(el.entryStart.value) + 1, 24);
    }
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

let uiScaleResizeTimer = 0;
let shellLayoutDragActive = false;
let shellLayoutDragWidth = 0;
let shellLayoutObserverWidth = 0;

const SHELL_FOCUS_MAX_WIDTH = 680;
const VIEW_EXPAND_WIDTHS = {
  day: 920,
  week: 920,
  month: 1000,
  project: 1200
};

function measureLayoutWidth() {
  const docWidth = document.documentElement?.clientWidth;
  const bodyWidth = document.body?.clientWidth;
  const inner = window.innerWidth;
  // Prefer layout viewport over innerWidth — Electron setBounds can leave
  // innerWidth stale for a frame (or longer) after a live drag.
  const width = docWidth || bodyWidth || inner || 0;
  return Math.round(width);
}

function syncShellLayoutClasses(widthHint) {
  const desktop = document.body.classList.contains("in-desktop");
  const width = Number.isFinite(widthHint) ? widthHint : measureLayoutWidth();
  const wasFocus = document.body.classList.contains("shell-focus");
  const narrow = desktop && width < 1180;
  const compact = desktop && width < 960;
  // Todo-only strip until dual-pane would squeeze the schedule (~680).
  const focus = desktop && width < SHELL_FOCUS_MAX_WIDTH;
  document.body.classList.toggle("shell-narrow", narrow);
  document.body.classList.toggle("shell-compact-topbar", compact);
  document.body.classList.toggle("shell-focus", focus);
  if (!focus) {
    document.body.classList.remove("task-panel-open");
    closeFocusViewMenu();
  }
  syncFocusSurfaceVisibility(focus, compact);
  if (wasFocus !== focus) {
    updateDateNavigationChrome();
    syncListKindSwitch();
  }
  // Focus toggle changes task-panel width from full-window ↔ split column;
  // density/tabs must resync or search/继续昨天 get clipped under the schedule.
  requestAnimationFrame(() => {
    syncTaskPanelDensity();
    adaptTaskTabsOverflow();
  });
  syncHeaderOverflow();
}

function syncFocusSurfaceVisibility(focus, compact) {
  const schedule = document.querySelector(".schedule-panel");
  const weekStrip = document.querySelector(".week-strip");
  // Author CSS `display:flex` can win over the UA [hidden] rule; pair the
  // attribute with an !important CSS hook, and keep schedule out of the tree
  // while focus mode is on so glass panels cannot ghost the calendar.
  if (schedule) {
    schedule.hidden = !!focus;
    schedule.setAttribute("aria-hidden", focus ? "true" : "false");
  }
  if (weekStrip) {
    const modeHidesWeek = document.body.classList.contains("month-mode")
      || document.body.classList.contains("week-mode")
      || document.body.classList.contains("project-mode");
    weekStrip.hidden = !!(focus || compact || modeHidesWeek);
  }
}

function scheduleShellLayoutSync(widthHint) {
  if (shellLayoutDragActive) {
    syncShellLayoutClasses(shellLayoutDragWidth);
    return;
  }
  syncShellLayoutClasses(widthHint);
}

function applyUiScale() {
  const scale = UiScalePolicy?.uiScaleForWindow?.({
    width: measureLayoutWidth(),
    height: window.innerHeight,
    compact: document.body.classList.contains("compact")
  }) ?? 1;
  document.documentElement.style.setProperty("--ui-scale", scale.toFixed(3));
  scheduleShellLayoutSync();
}

function syncHeaderOverflow() {
  if (!el.headerTools || !el.headerToolsSlot || !el.headerMoreMenu || !el.headerMoreButton) return;
  const desktop = document.body.classList.contains("in-desktop");
  const actions = el.headerActions;
  const topbar = document.querySelector(".topbar");
  const menuWasOpen = el.headerMoreMenu.getAttribute("aria-hidden") !== "true"
    && !el.headerMoreMenu.hasAttribute("hidden");

  const restoreToolsToSlot = () => {
    if (el.headerTools.parentElement !== el.headerToolsSlot) {
      el.headerToolsSlot.appendChild(el.headerTools);
    }
    setHeaderMoreButtonVisible(false);
    document.body.classList.remove("header-tools-overflow");
  };

  if (!desktop || !actions || !topbar) {
    restoreToolsToSlot();
    closeHeaderOverflowMenu();
    return;
  }

  // Measure with tools restored inline (Priority+ / overflow-toolbar pattern).
  restoreToolsToSlot();
  void topbar.offsetWidth;

  const gap = Number.parseFloat(getComputedStyle(actions).gap) || 6;
  const visibleWidth = node => {
    if (!node) return 0;
    const style = getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden") return 0;
    return Math.ceil(node.getBoundingClientRect().width) || node.offsetWidth || 0;
  };

  const moreWidth = 34;
  const toolsWidth = visibleWidth(el.headerTools);
  const settingsWidth = visibleWidth(el.settingsButton);
  const panelToggle = el.taskPanelToggle;
  const toggleWidth = visibleWidth(panelToggle);
  const viewWidth = visibleWidth(el.viewSwitcher);
  const windowWidth = visibleWidth(document.querySelector(".window-controls"));
  const brandWidth = visibleWidth(document.querySelector(".brand"));
  const dateWidth = visibleWidth(el.topbarMain || document.querySelector(".topbar-main"));
  const topbarPad = (() => {
    const style = getComputedStyle(topbar);
    return (Number.parseFloat(style.paddingLeft) || 0) + (Number.parseFloat(style.paddingRight) || 0);
  })();
  const topbarGap = Number.parseFloat(getComputedStyle(topbar).columnGap) || 10;

  // Budget left after reserved chrome that must never clip.
  const reservedTrailing = settingsWidth + moreWidth + windowWidth + gap * 2;
  const reservedLeading = viewWidth + brandWidth + dateWidth;
  const reservedGaps = topbarGap * 3;
  const availableForTools = topbar.clientWidth - topbarPad - reservedLeading - reservedTrailing - reservedGaps - toggleWidth;
  const toolsNeedRoom = toolsWidth > 0 && availableForTools < toolsWidth + gap;

  const forceOverflow = document.body.classList.contains("shell-narrow")
    || document.body.classList.contains("shell-compact-topbar")
    || document.body.classList.contains("shell-focus")
    || measureLayoutWidth() < 1180
    || toolsNeedRoom;

  if (forceOverflow) {
    if (el.headerTools.parentElement !== el.headerMoreMenu) {
      el.headerMoreMenu.appendChild(el.headerTools);
    }
    setHeaderMoreButtonVisible(true);
    document.body.classList.add("header-tools-overflow");
  }

  if (!forceOverflow && menuWasOpen) closeHeaderOverflowMenu();
  else if (forceOverflow && menuWasOpen) openHeaderOverflowMenu();
}

function setHeaderMoreButtonVisible(visible) {
  if (!el.headerMoreButton) return;
  el.headerMoreButton.hidden = !visible;
  el.headerMoreButton.setAttribute("aria-hidden", visible ? "false" : "true");
  el.headerMoreButton.classList.toggle("is-visible", visible);
}

function openHeaderOverflowMenu() {
  if (!el.headerMoreMenu || !el.headerMoreButton) return;
  if (!document.body.classList.contains("header-tools-overflow")) return;
  if (el.headerTools && el.headerTools.parentElement !== el.headerMoreMenu) {
    el.headerMoreMenu.appendChild(el.headerTools);
  }
  if (el.headerMoreMenu.parentElement !== document.body) {
    document.body.appendChild(el.headerMoreMenu);
  }
  el.headerMoreMenu.hidden = false;
  el.headerMoreMenu.setAttribute("aria-hidden", "false");
  el.headerMoreButton.setAttribute("aria-expanded", "true");
  positionHeaderOverflowMenu();
}

function positionHeaderOverflowMenu() {
  if (!el.headerMoreMenu || !el.headerMoreButton || el.headerMoreMenu.hidden) return;
  const rect = el.headerMoreButton.getBoundingClientRect();
  const menu = el.headerMoreMenu;
  menu.style.position = "fixed";
  menu.style.top = `${Math.round(rect.bottom + 6)}px`;
  menu.style.right = `${Math.max(8, Math.round(window.innerWidth - rect.right))}px`;
  menu.style.left = "auto";
  menu.style.zIndex = "5000";
}

function closeHeaderOverflowMenu() {
  if (!el.headerMoreMenu || !el.headerMoreButton) return;
  el.headerMoreMenu.hidden = true;
  el.headerMoreMenu.setAttribute("aria-hidden", "true");
  el.headerMoreButton.setAttribute("aria-expanded", "false");
}

function toggleHeaderOverflowMenu() {
  if (!el.headerMoreMenu || !el.headerMoreButton) return;
  if (!document.body.classList.contains("header-tools-overflow")) {
    // Space is tight enough to show the control; force a resync then open.
    syncHeaderOverflow();
    if (!document.body.classList.contains("header-tools-overflow")) return;
  }
  if (el.headerMoreMenu.hidden) openHeaderOverflowMenu();
  else closeHeaderOverflowMenu();
}

function bindHeaderOverflow() {
  if (!el.headerMoreButton) return;
  el.headerMoreButton.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    toggleHeaderOverflowMenu();
  });
  el.headerTools?.addEventListener("click", event => {
    if (!document.body.classList.contains("header-tools-overflow")) return;
    const button = event.target.closest("button");
    if (!button || button.id === "glassToggleButton") return;
    closeHeaderOverflowMenu();
  });
  document.addEventListener("pointerdown", event => {
    if (el.headerMoreButton?.contains(event.target)) return;
    if (el.headerMoreMenu?.contains(event.target)) return;
    if (el.headerOverflow?.contains(event.target)) return;
    closeHeaderOverflowMenu();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeHeaderOverflowMenu();
  });
  window.addEventListener("resize", () => {
    syncHeaderOverflow();
    positionHeaderOverflowMenu();
  }, { passive: true });
  const topbar = document.querySelector(".topbar");
  if (topbar && typeof ResizeObserver === "function") {
    const observer = new ResizeObserver(() => {
      syncHeaderOverflow();
      positionHeaderOverflowMenu();
    });
    observer.observe(topbar);
  }
  syncHeaderOverflow();
}

function updateGlassToggleChrome(glass) {
  if (!el.glassToggleButton) return;
  const on = !!glass;
  el.glassToggleButton.setAttribute("aria-pressed", on ? "true" : "false");
  el.glassToggleButton.classList.toggle("is-active", on);
  el.glassToggleButton.title = on ? "关闭玻璃背景" : "开启玻璃背景";
}

async function toggleGlassMode() {
  if (!window.desktopAPI) return;
  const next = !document.body.classList.contains("glass-mode");
  if (window.desktopAPI.saveSettings) {
    const saved = await window.desktopAPI.saveSettings({ glass: next });
    document.body.classList.toggle("glass-mode", !!saved?.glass);
    if (el.settingGlass) el.settingGlass.checked = !!saved?.glass;
    updateGlassToggleChrome(saved?.glass);
    showToast(saved?.glass ? "已开启玻璃背景" : "已关闭玻璃背景");
    return;
  }
  const glass = await window.desktopAPI.toggleGlass?.();
  if (glass !== undefined) {
    document.body.classList.toggle("glass-mode", !!glass);
    updateGlassToggleChrome(glass);
  }
}

function bindTaskPanelToggle() {
  el.taskPanelToggle?.addEventListener("click", () => {
    if (!document.body.classList.contains("shell-focus")) return;
    const open = document.body.classList.toggle("task-panel-open");
    el.taskPanelToggle.setAttribute("aria-pressed", open ? "true" : "false");
    el.taskPanelToggle.title = open ? "收起待办清单" : "显示待办清单";
  });
}

function closeFocusViewMenu() {
  if (!el.focusViewMenu || !el.focusViewButton) return;
  el.focusViewMenu.hidden = true;
  el.focusViewMenu.setAttribute("aria-hidden", "true");
  el.focusViewButton.setAttribute("aria-expanded", "false");
  if (el.focusViewChrome && el.focusViewMenu.parentElement !== el.focusViewChrome) {
    el.focusViewChrome.appendChild(el.focusViewMenu);
  }
}

function openFocusViewMenu() {
  if (!el.focusViewMenu || !el.focusViewButton) return;
  if (!document.body.classList.contains("shell-focus")) return;
  el.focusViewMenu.hidden = false;
  el.focusViewMenu.setAttribute("aria-hidden", "false");
  el.focusViewButton.setAttribute("aria-expanded", "true");
  const rect = el.focusViewButton.getBoundingClientRect();
  const menu = el.focusViewMenu;
  if (menu.parentElement !== document.body) document.body.appendChild(menu);
  menu.style.position = "fixed";
  menu.style.top = `${Math.round(rect.bottom + 6)}px`;
  menu.style.left = `${Math.max(8, Math.round(rect.left))}px`;
  menu.style.right = "auto";
  menu.style.zIndex = "5000";
}

function toggleFocusViewMenu() {
  if (!el.focusViewMenu) return;
  if (el.focusViewMenu.hidden) openFocusViewMenu();
  else closeFocusViewMenu();
}

function expandWindowForView(view) {
  const targetWidth = VIEW_EXPAND_WIDTHS[view] || VIEW_EXPAND_WIDTHS.day;
  const width = Math.max(window.outerWidth || window.innerWidth, targetWidth);
  const height = Math.max(window.outerHeight || window.innerHeight, 700);
  if (window.desktopAPI?.setWindowBounds) {
    window.desktopAPI.setWindowBounds({
      x: window.screenX,
      y: window.screenY,
      width,
      height
    });
    return;
  }
  try {
    window.resizeTo(width, height);
  } catch {}
}

function applyTaskView(view, { expand = false } = {}) {
  const previousView = state.taskView;
  state.taskView = view;
  state.projectViewNeedsAnchor = state.taskView === "project" && previousView !== "project";
  if (state.projectViewNeedsAnchor) state.projectAnchorDate = toDateKey(new Date());
  if (state.taskView === "project") {
    state.projectWindowStart = null;
    state.projectWindowEnd = null;
    state.projectGanttLastExtend = null;
  }
  el.viewSwitcher?.querySelectorAll("button[data-view]").forEach(item => {
    item.classList.toggle("active", item.dataset.view === view);
  });
  if (expand && document.body.classList.contains("shell-focus")) {
    expandWindowForView(view);
  }
  render();
}

function bindFocusViewMenu() {
  if (!el.focusViewButton || !el.focusViewMenu) return;
  el.focusViewButton.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    toggleFocusViewMenu();
  });
  el.focusViewMenu.addEventListener("click", event => {
    const button = event.target.closest("button[data-view]");
    if (!button) return;
    event.preventDefault();
    closeFocusViewMenu();
    applyTaskView(button.dataset.view, { expand: true });
  });
  document.addEventListener("pointerdown", event => {
    if (el.focusViewButton?.contains(event.target)) return;
    if (el.focusViewMenu?.contains(event.target)) return;
    closeFocusViewMenu();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeFocusViewMenu();
  });
}

function bindWindowResize() {
  if (!window.desktopAPI?.setWindowBounds && !window.desktopAPI?.resizeBy) return;
  const minWidth = 380;
  const minHeight = 520;
  document.querySelectorAll(".app-shell [data-resize-edge], .app-shell [data-resize-axis]").forEach(handle => {
    handle.addEventListener("pointerdown", event => {
      event.preventDefault();
      event.stopPropagation();
      const edge = handle.dataset.resizeEdge || ({
        x: "right",
        y: "bottom",
        both: "se"
      }[handle.dataset.resizeAxis] || "se");
      const startX = event.screenX;
      const startY = event.screenY;
      const startBounds = {
        x: window.screenX,
        y: window.screenY,
        width: window.outerWidth,
        height: window.outerHeight
      };
      const frameChromeX = Math.max(0, startBounds.width - measureLayoutWidth());
      shellLayoutDragActive = true;
      shellLayoutDragWidth = measureLayoutWidth();
      handle.setPointerCapture(event.pointerId);
      const move = moveEvent => {
        const dx = moveEvent.screenX - startX;
        const dy = moveEvent.screenY - startY;
        let x = startBounds.x;
        let y = startBounds.y;
        let width = startBounds.width;
        let height = startBounds.height;
        const resizeEast = edge === "right" || edge === "ne" || edge === "se";
        const resizeWest = edge === "left" || edge === "nw" || edge === "sw";
        const resizeSouth = edge === "bottom" || edge === "se" || edge === "sw";
        const resizeNorth = edge === "top" || edge === "ne" || edge === "nw";
        if (resizeEast) width = startBounds.width + dx;
        if (resizeWest) {
          width = startBounds.width - dx;
          x = startBounds.x + dx;
        }
        if (resizeSouth) height = startBounds.height + dy;
        if (resizeNorth) {
          height = startBounds.height - dy;
          y = startBounds.y + dy;
        }
        if (width < minWidth) {
          if (resizeWest) x -= minWidth - width;
          width = minWidth;
        }
        if (height < minHeight) {
          if (resizeNorth) y -= minHeight - height;
          height = minHeight;
        }
        if (window.desktopAPI.setWindowBounds) {
          window.desktopAPI.setWindowBounds({ x, y, width, height });
        } else {
          window.desktopAPI.resizeBy(width, height);
        }
        // Live drag must not wait for a possibly-stale window.innerWidth / resize event.
        shellLayoutDragWidth = Math.max(0, width - frameChromeX);
        syncShellLayoutClasses(shellLayoutDragWidth);
      };
      const finish = () => {
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", finish);
        handle.removeEventListener("pointercancel", finish);
        shellLayoutDragActive = false;
        // Keep the drag target width first — a stale resize/innerWidth must not
        // briefly restore the wide split layout after narrowing.
        syncShellLayoutClasses(shellLayoutDragWidth);
        requestAnimationFrame(() => {
          syncShellLayoutClasses();
          requestAnimationFrame(() => {
            syncShellLayoutClasses();
            applyUiScale();
          });
        });
      };
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", finish);
      handle.addEventListener("pointercancel", finish);
    });
  });
}

function updateMaximizeChrome(maximized) {
  if (!el.maximizeWindow) return;
  const on = !!maximized;
  el.maximizeWindow.classList.toggle("is-maximized", on);
  el.maximizeWindow.title = on ? "向下还原" : "最大化";
  el.maximizeWindow.setAttribute("aria-label", on ? "向下还原" : "最大化");
  el.maximizeWindow.textContent = on ? "❐" : "□";
  document.body.classList.toggle("window-maximized", on);
}

function bindUiScale() {
  applyUiScale();
  const onViewportResize = () => {
    // During custom edge-drag, trust the target width; stale window resize
    // events are what made wide→narrow differ from a cold narrow open.
    scheduleShellLayoutSync();
    clearTimeout(uiScaleResizeTimer);
    uiScaleResizeTimer = setTimeout(() => {
      if (shellLayoutDragActive) return;
      const scale = UiScalePolicy?.uiScaleForWindow?.({
        width: measureLayoutWidth(),
        height: window.innerHeight,
        compact: document.body.classList.contains("compact")
      }) ?? 1;
      document.documentElement.style.setProperty("--ui-scale", scale.toFixed(3));
    }, 80);
  };
  window.addEventListener("resize", onViewportResize, { passive: true });
  window.visualViewport?.addEventListener("resize", onViewportResize, { passive: true });
  if (typeof ResizeObserver === "function") {
    shellLayoutObserverWidth = measureLayoutWidth();
    const observer = new ResizeObserver(() => {
      const next = measureLayoutWidth();
      if (Math.abs(next - shellLayoutObserverWidth) < 1) return;
      shellLayoutObserverWidth = next;
      onViewportResize();
    });
    observer.observe(document.documentElement);
  }
}

async function initDesktop() {
  if (!window.desktopAPI) return;
  document.body.classList.add("in-desktop");
  const desktopSettings = await window.desktopAPI.getSettings?.();
  if (desktopSettings?.compact) {
    document.body.classList.add("compact");
    localStorage.setItem("today-planner-compact", "1");
    applyUiScale();
  }
  if (desktopSettings) applyStoredWorkHours(desktopSettings);
  const pinned = await window.desktopAPI.getPinned();
  document.body.classList.toggle("pinned", pinned);
  const syncLock = locked => {
    document.body.classList.toggle("desktop-locked", locked);
  };
  const syncGlass = glass => {
    document.body.classList.toggle("glass-mode", glass);
    updateGlassToggleChrome(glass);
    if (el.settingGlass) el.settingGlass.checked = !!glass;
  };
  syncGlass(await window.desktopAPI.getGlass());
  window.desktopAPI.onGlassChanged(syncGlass);
  syncLock(await window.desktopAPI.getLocked());
  window.desktopAPI.onLockChanged(syncLock);
  el.minimizeWindow.addEventListener("click", () => window.desktopAPI.minimize());
  el.maximizeWindow?.addEventListener("click", async () => {
    if (!window.desktopAPI?.toggleMaximize) return;
    const maximized = await window.desktopAPI.toggleMaximize();
    updateMaximizeChrome(maximized);
    applyUiScale();
  });
  window.desktopAPI.onMaximizeChanged?.(maximized => {
    updateMaximizeChrome(maximized);
    applyUiScale();
  });
  updateMaximizeChrome(await window.desktopAPI.isMaximized?.().catch(() => false));
  window.desktopAPI.onShellWidthChanged?.(width => {
    if (!Number.isFinite(width) || width <= 0) return;
    // Authoritative content width from main process — beats stale renderer innerWidth.
    if (shellLayoutDragActive) {
      shellLayoutDragWidth = width;
      syncShellLayoutClasses(width);
      return;
    }
    syncShellLayoutClasses(width);
  });
  el.closeWindow.addEventListener("click", () => window.desktopAPI.quit());
  el.glassToggleButton?.addEventListener("click", () => toggleGlassMode());
  el.settingsButton?.addEventListener("click", openSettingsDialog);
  el.settingGlass?.addEventListener("change", async () => {
    if (!window.desktopAPI?.saveSettings) return;
    const saved = await window.desktopAPI.saveSettings({ glass: el.settingGlass.checked });
    document.body.classList.toggle("glass-mode", !!saved?.glass);
    updateGlassToggleChrome(saved?.glass);
    showToast(saved?.glass ? "已开启玻璃背景" : "已关闭玻璃背景");
  });
  el.checkUpdateButton?.addEventListener("click", async () => {
    if (!window.desktopAPI?.checkForUpdates) {
      showToast("当前环境不支持检查更新");
      return;
    }
    showToast("正在检查更新…");
    try {
      await window.desktopAPI.checkForUpdates();
    } catch (error) {
      showToast(error?.message || "检查更新失败");
    }
  });
  el.aiAssistantButton?.addEventListener("click", openAiDialog);
  el.aiQuickActions?.addEventListener("click", event => {
    const screenshotHint = event.target.closest("#aiScreenshotHintButton, [data-ai-mode='screenshot']");
    if (screenshotHint) {
      el.aiStatus.textContent = "请粘贴或附加一张截图，然后发送；将直接创建 1 条待办。";
      el.aiImageInput?.click();
      return;
    }
    const button = event.target.closest("[data-ai-prompt]");
    if (!button) return;
    el.aiPrompt.value = button.dataset.aiPrompt;
    if (button.textContent.includes("本周")) setAiRangeForWeek();
    el.aiPrompt.focus();
  });
  el.aiForm?.addEventListener("submit", event => { event.preventDefault(); submitAiAssistant(); });
  el.aiCopyButton?.addEventListener("click", async event => {
    event.preventDefault();
    event.stopPropagation();
    const text = getAiCopyText();
    if (!text) {
      showToast("暂无可复制的 AI 结果");
      return;
    }
    const ok = await copyTextToClipboard(text);
    showToast(ok ? "AI 结果已复制" : "复制失败，请手动选择文本复制");
  });
  el.aiExportTablesButton?.addEventListener("click", () => exportLatestAiTables());
  el.aiAttachImageButton?.addEventListener("click", () => el.aiImageInput?.click());
  el.aiImageInput?.addEventListener("change", async () => {
    const file = el.aiImageInput.files?.[0];
    el.aiImageInput.value = "";
    if (file) await setAiAttachmentFromFile(file);
  });
  el.aiAttachmentClear?.addEventListener("click", clearAiAttachment);
  el.aiPrompt?.addEventListener("paste", event => handleAiImagePaste(event));
  el.aiPrompt?.addEventListener("keydown", event => {
    if (event.key !== "Enter") return;
    if (event.isComposing || event.keyCode === 229) return;
    // Enter / Ctrl+Enter / Cmd+Enter 发送；Shift+Enter 换行
    if (event.shiftKey && !event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    submitAiAssistant();
  });
  el.aiDialog?.addEventListener("dragover", event => {
    if (![...event.dataTransfer?.types || []].includes("Files")) return;
    event.preventDefault();
  });
  el.aiDialog?.addEventListener("drop", async event => {
    const file = [...(event.dataTransfer?.files || [])].find(item => item.type.startsWith("image/"));
    if (!file) return;
    event.preventDefault();
    await setAiAttachmentFromFile(file);
  });
  bindTaskAiDropzone();
  bindAiBatchDraftDialog();
  el.settingsForm?.addEventListener("submit", event => {
    event.preventDefault();
    saveDesktopSettings();
  });
  el.aiDetectModelsButton?.addEventListener("click", () => refreshAiProviderModels({ forceList: true }));
  el.settingAiApiKey?.addEventListener("change", () => refreshAiProviderModels({ forceList: true }));
  el.settingAiProvider?.addEventListener("change", () => refreshAiProviderModels({ forceList: true }));
  // in-desktop is required for shell-* classes; sync after desktop boot so a
  // cold narrow window matches a later wide→narrow drag.
  applyUiScale();
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
    if (payload.state === "idle") {
      el.updateProgress.classList.add("hidden");
      el.updateProgress.classList.remove("done", "error");
      el.updateProgressBar.style.width = "0%";
      return;
    }
    const percent = Math.max(0, Math.min(100, Number(payload.percent || 0)));
    el.updateProgress.classList.remove("hidden", "done", "error");
    el.updateProgress.classList.toggle("done", payload.state === "downloaded");
    el.updateProgress.classList.toggle("error", payload.state === "error");
    el.updateProgressText.textContent = payload.message || (
      payload.state === "checking" ? "正在检查更新…" : `正在下载更新… ${Math.round(percent)}%`
    );
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
  el.settingGlass.checked = !!settings?.glass;
  updateGlassToggleChrome(settings?.glass);
  el.settingPinned.checked = !!settings?.pinned;
  el.settingLocked.checked = !!settings?.locked;
  el.settingCompact.checked = document.body.classList.contains("compact") || !!settings?.compact;
  el.settingStartAtLogin.checked = !!settings?.startAtLogin;
  applyWorkHours({
    workStartHour: settings?.workStartHour ?? state.workStartHour,
    workEndHour: settings?.workEndHour ?? state.workEndHour
  });
  el.settingAiEnabled.checked = !!settings?.aiEnabled;
  el.settingAiApiKey.value = "";
  el.settingAiApiKey.placeholder = settings?.aiConfigured
    ? "已配置（输入新 Key 可替换）"
    : "粘贴 OpenAI / OpenRouter / DeepSeek / Anthropic / Gemini 等 Key";
  fillAiProviderOptions([{ id: settings?.aiProvider || "openai", name: settings?.aiProvider || "openai" }], settings?.aiProvider || "openai");
  fillAiModelOptions(settings?.aiModel ? [settings.aiModel] : ["gpt-4.1-mini"], settings?.aiModel || "gpt-4.1-mini");
  el.aiKeyStatus.textContent = settings?.aiConfigured
    ? "API Key 已配置。可点击「识别服务商并加载模型」刷新可用模型。"
    : "API Key 未配置。填写 Key 后可自动识别厂商并拉取可用模型。";
  el.settingsAppVersion.textContent = el.appVersionBadge?.textContent || await window.desktopAPI.getVersion?.().then(version => `v${version}`).catch(() => "读取失败");
  el.settingsDataPath.textContent = paths?.dataFile || "当前用户数据目录";
  el.settingsExportPath.textContent = paths?.exportDir || "文档目录";
  el.settingsDialog.showModal();
  if (settings?.aiConfigured) {
    refreshAiProviderModels({ providerId: settings.aiProvider || "", selectedModel: settings.aiModel || "" }).catch(() => {});
  }
}

function fillAiProviderOptions(providers = [], selectedId = "") {
  if (!el.settingAiProvider) return;
  const list = providers.length ? providers : [{ id: "openai", name: "OpenAI" }];
  el.settingAiProvider.innerHTML = list
    .map(item => `<option value="${escapeHtml(item.id)}"${item.id === selectedId ? " selected" : ""}>${escapeHtml(item.name)}</option>`)
    .join("");
  if (selectedId && ![...el.settingAiProvider.options].some(option => option.value === selectedId)) {
    el.settingAiProvider.add(new Option(selectedId, selectedId, true, true));
  }
}

function fillAiModelOptions(models = [], selectedId = "") {
  if (!el.settingAiModel) return;
  const list = models.length ? models : (selectedId ? [selectedId] : ["gpt-4.1-mini"]);
  el.settingAiModel.innerHTML = list
    .map(model => `<option value="${escapeHtml(model)}"${model === selectedId ? " selected" : ""}>${escapeHtml(model)}</option>`)
    .join("");
  if (selectedId && ![...el.settingAiModel.options].some(option => option.value === selectedId)) {
    el.settingAiModel.add(new Option(selectedId, selectedId, true, true));
  }
}

async function refreshAiProviderModels({ forceList = false, providerId = "", selectedModel = "" } = {}) {
  if (!window.desktopAPI?.aiDetectProvider || !window.desktopAPI?.aiListModels) return;
  const apiKey = el.settingAiApiKey?.value?.trim() || "";
  el.aiKeyStatus.textContent = forceList ? "正在识别服务商并加载模型…" : (el.aiKeyStatus.textContent || "正在识别服务商…");
  try {
    const detected = await window.desktopAPI.aiDetectProvider({
      apiKey,
      providerId: providerId || el.settingAiProvider?.value || ""
    });
    fillAiProviderOptions(detected.providers || [], detected.providerId || providerId || "openai");
    if (!detected.configured && !apiKey) {
      el.aiKeyStatus.textContent = detected.message || "API Key 未配置";
      return;
    }
    const listed = await window.desktopAPI.aiListModels({
      apiKey,
      providerId: el.settingAiProvider?.value || detected.providerId || ""
    });
    fillAiProviderOptions(listed.providers || detected.providers || [], listed.providerId || detected.providerId || "");
    fillAiModelOptions(listed.models || [], selectedModel || listed.selectedModel || "");
    el.aiKeyStatus.textContent = [detected.message, listed.message].filter(Boolean).join(" · ");
  } catch (error) {
    el.aiKeyStatus.textContent = error?.message || "识别服务商失败";
  }
}

async function saveDesktopSettings() {
  if (!window.desktopAPI?.saveSettings) return;
  const nextSettings = {
    glass: el.settingGlass.checked,
    pinned: el.settingPinned.checked,
    locked: el.settingLocked.checked,
    compact: el.settingCompact.checked,
    startAtLogin: el.settingStartAtLogin.checked,
    workStartHour: Number(el.settingWorkStartHour?.value ?? state.workStartHour),
    workEndHour: Number(el.settingWorkEndHour?.value ?? state.workEndHour),
    aiEnabled: el.settingAiEnabled.checked,
    aiProvider: el.settingAiProvider?.value || "openai",
    aiModel: el.settingAiModel?.value?.trim() || "gpt-4.1-mini",
    ...(el.settingAiApiKey.value.trim() ? { aiApiKey: el.settingAiApiKey.value.trim() } : {})
  };
  const saved = await window.desktopAPI.saveSettings(nextSettings);
  applyWorkHours({
    workStartHour: saved?.workStartHour ?? nextSettings.workStartHour,
    workEndHour: saved?.workEndHour ?? nextSettings.workEndHour
  });
  document.body.classList.toggle("glass-mode", !!saved?.glass);
  updateGlassToggleChrome(saved?.glass);
  document.body.classList.toggle("compact", !!saved?.compact);
  document.body.classList.toggle("pinned", !!saved?.pinned);
  document.body.classList.toggle("desktop-locked", !!saved?.locked);
  localStorage.setItem("today-planner-compact", saved?.compact ? "1" : "0");
  applyUiScale();
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

let aiChatMessages = [];
let aiPendingAttachment = null;
let aiExtractBusy = false;

function openAiDialog() {
  const date = fromDateKey(state.selectedDate);
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  el.aiPeriodStart.value = toDateKey(first);
  el.aiPeriodEnd.value = toDateKey(last);
  el.aiPrompt.value = "";
  clearAiAttachment();
  aiChatMessages = [];
  syncAiExportTablesButton();
  el.aiStatus.textContent = "在下方消息框输入后发送；回复会显示在同一框内。";
  if (el.aiResult) {
    el.aiResult.textContent = "";
    el.aiResult.classList.add("hidden");
  }
  el.aiDialog.showModal();
  setTimeout(() => el.aiPrompt?.focus(), 40);
}

function showAiMessageInBox(text = "") {
  const value = String(text || "");
  if (el.aiPrompt) {
    el.aiPrompt.value = value;
    el.aiPrompt.scrollTop = 0;
  }
  if (el.aiResult) el.aiResult.textContent = value;
}

function appendAiChat(role, text, meta = {}) {
  const tables = Array.isArray(meta.tables) ? meta.tables : [];
  const content = String(text || "").trim();
  aiChatMessages.push({ role, text: content, tables });
  if (role === "assistant") showAiMessageInBox(content);
  syncAiExportTablesButton();
}

function getAiCopyText() {
  const assistants = aiChatMessages
    .filter(item => item.role === "assistant")
    .map(item => item.text)
    .filter(text => String(text || "").trim());
  if (assistants.length) return assistants[assistants.length - 1];
  const fromBox = el.aiPrompt?.value?.trim() || "";
  if (fromBox) return fromBox;
  return el.aiResult?.textContent?.trim() || "";
}

async function copyTextToClipboard(text = "") {
  const value = String(text || "");
  if (!value) return false;
  if (window.desktopAPI?.writeClipboardText) {
    try {
      await window.desktopAPI.writeClipboardText(value);
      return true;
    } catch {
      /* fall through */
    }
  }
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const area = document.createElement("textarea");
    area.value = value;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-9999px";
    area.style.top = "0";
    document.body.appendChild(area);
    area.focus();
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

function getLatestAiTables() {
  for (let i = aiChatMessages.length - 1; i >= 0; i -= 1) {
    const tables = aiChatMessages[i]?.tables;
    if (tables?.length) return tables;
  }
  return [];
}

function syncAiExportTablesButton() {
  const tables = getLatestAiTables();
  if (!el.aiExportTablesButton) return;
  el.aiExportTablesButton.classList.toggle("hidden", !tables.length);
  el.aiExportTablesButton.textContent = tables.length
    ? `下载 Excel（${tables.length} 张表）`
    : "下载 Excel";
}

function buildFallbackAiTables(context = {}, question = "") {
  const tasks = Array.isArray(context.tasks) ? context.tasks : [];
  if (!tasks.length) return [];
  const openOnly = /未完成/.test(question);
  const list = openOnly
    ? tasks.filter(task => !["done", "closed"].includes(task.status))
    : tasks;
  if (!list.length) return [];
  return [{
    name: openOnly ? "未完成任务" : "任务明细",
    headers: ["任务", "状态", "优先级", "责任人", "截止日期", "计划工时", "投入工时"],
    rows: list.map(task => [
      task.title || "",
      statusLabel(task.status),
      priorityLabel(task.priority),
      task.owner || "",
      task.dueDate || "",
      Number(task.scheduledHours || 0),
      Number(task.actualHours || 0)
    ])
  }];
}

async function exportAiTables(tables = []) {
  const list = Array.isArray(tables) ? tables : [];
  if (!list.length) {
    showToast("当前没有可下载的表格");
    return;
  }
  const filename = `EveryTime-AI表格-${toDateKey(new Date())}.xlsx`;
  if (!window.desktopAPI?.exportTables) {
    showToast("请在桌面版下载 Excel 表格");
    return;
  }
  try {
    const saved = await window.desktopAPI.exportTables(filename, list);
    showToast(saved ? "Excel 表格已保存" : "已取消保存");
  } catch (error) {
    showToast(error?.message || "表格导出失败");
  }
}

function exportLatestAiTables() {
  return exportAiTables(getLatestAiTables());
}

function clearAiAttachment() {
  aiPendingAttachment = null;
  if (el.aiAttachment) el.aiAttachment.classList.add("hidden");
  if (el.aiAttachmentPreview) el.aiAttachmentPreview.removeAttribute("src");
}

async function setAiAttachmentFromFile(file) {
  try {
    aiPendingAttachment = await readImageAsAttachment(file);
    if (el.aiAttachmentPreview) el.aiAttachmentPreview.src = aiPendingAttachment.dataUrl;
    el.aiAttachment?.classList.remove("hidden");
    el.aiStatus.textContent = "已附加截图。发送后将直接创建 1 条待办。";
  } catch (error) {
    showToast(error?.message || "无法读取图片");
  }
}

function handleAiImagePaste(event) {
  const items = [...(event.clipboardData?.items || [])];
  const imageItem = items.find(item => item.type.startsWith("image/"));
  if (!imageItem) return;
  const file = imageItem.getAsFile();
  if (!file) return;
  event.preventDefault();
  setAiAttachmentFromFile(file);
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
    .map(entry => ({ date, title: entry.title, entryType: entry.entryType || "calendar", start: formatTime(entry.start), end: formatTime(entry.end), note: entry.note || "", owner: entry.owner || "", taskId: entry.taskId || "" })));
  return { period: { start: startKey, end: endKey }, tasks, calendarEntries: entries, dayNotes: Object.entries(state.data).filter(([date, day]) => date >= startKey && date <= endKey && day.note).map(([date, day]) => ({ date, note: day.note })) };
}

async function submitAiAssistant() {
  if (aiExtractBusy || el.aiPrompt?.disabled) return;
  if (aiPendingAttachment) {
    await extractAndCreateTaskFromImage({
      attachment: aiPendingAttachment,
      note: el.aiPrompt.value.trim(),
      source: "ai-dialog"
    });
    return;
  }
  await askAi();
}

async function askAi() {
  const question = el.aiPrompt.value.trim();
  if (!question) {
    el.aiStatus.textContent = "请先输入问题，或附加截图后发送。";
    return;
  }
  if (!window.desktopAPI?.aiAsk) {
    el.aiStatus.textContent = "请在桌面版使用 AI 助手。";
    return;
  }
  const startKey = el.aiPeriodStart.value || "1900-01-01";
  const endKey = el.aiPeriodEnd.value || "2999-12-31";
  const context = buildAiContext(startKey, endKey);
  appendAiChat("user", question);
  el.aiStatus.textContent = "正在整理本地任务数据并请求 AI…";
  el.aiPrompt.disabled = true;
  try {
    const result = await window.desktopAPI.aiAsk({ question, rangeLabel: `${startKey} 至 ${endKey}`, context });
    const rawText = typeof result === "string" ? result : (result?.text || "");
    const parsed = (typeof AiAnswerPolicy !== "undefined" && AiAnswerPolicy.parseAssistantAnswer)
      ? AiAnswerPolicy.parseAssistantAnswer(rawText)
      : { displayText: rawText, tables: [] };
    let tables = parsed.tables || [];
    if (!tables.length && (AiAnswerPolicy?.wantsTableExport?.(question) || /表格|明细|清单|汇总/.test(question))) {
      tables = buildFallbackAiTables(context, question);
    }
    appendAiChat("assistant", parsed.displayText || rawText, { tables });
    el.aiStatus.textContent = tables.length
      ? `已完成。可下载 Excel（${tables.length} 张表）。清空或改写后可继续提问。`
      : "已完成。清空或改写后可继续提问。";
  } catch (error) {
    el.aiStatus.textContent = error?.message || "AI 请求失败";
    appendAiChat("assistant", "请检查设置中的 API Key、模型名称和网络连接。");
  } finally {
    el.aiPrompt.disabled = false;
    el.aiPrompt.focus();
  }
}

function bindTaskAiDropzone() {
  const zone = el.taskAiDropzone;
  const body = el.taskAiDropzoneBody;
  if (!zone || !body) return;
  el.taskAiPickImageButton?.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    el.taskAiImageInput?.click();
  });
  body.addEventListener("click", () => el.taskAiImageInput?.click());
  body.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      el.taskAiImageInput?.click();
    }
  });
  el.taskAiImageInput?.addEventListener("change", async () => {
    const file = el.taskAiImageInput.files?.[0];
    el.taskAiImageInput.value = "";
    if (file) await extractAndCreateTaskFromImage({ file, source: "task-dialog" });
  });
  zone.addEventListener("dragover", event => {
    if (![...event.dataTransfer?.types || []].includes("Files")) return;
    event.preventDefault();
    zone.classList.add("dragover");
  });
  zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));
  zone.addEventListener("drop", async event => {
    zone.classList.remove("dragover");
    const file = [...(event.dataTransfer?.files || [])].find(item => item.type.startsWith("image/"));
    if (!file) return;
    event.preventDefault();
    await extractAndCreateTaskFromImage({ file, source: "task-dialog" });
  });
  el.taskDialog?.addEventListener("paste", event => {
    if (el.taskAiDropzone?.classList.contains("hidden")) return;
    const items = [...(event.clipboardData?.items || [])];
    const imageItem = items.find(item => item.type.startsWith("image/"));
    if (!imageItem) return;
    const file = imageItem.getAsFile();
    if (!file) return;
    event.preventDefault();
    extractAndCreateTaskFromImage({ file, source: "task-dialog" });
  });
}

function setTaskAiDropzoneStatus(message = "", kind = "") {
  if (!el.taskAiDropzoneStatus) return;
  const text = String(message || "").trim();
  el.taskAiDropzoneStatus.textContent = text;
  el.taskAiDropzoneStatus.classList.toggle("hidden", !text);
  el.taskAiDropzoneStatus.classList.toggle("busy", kind === "busy");
  el.taskAiDropzoneStatus.classList.toggle("error", kind === "error");
}

async function readImageAsAttachment(fileOrBlob) {
  if (!fileOrBlob) throw new Error("未找到图片");
  const type = String(fileOrBlob.type || "").toLowerCase();
  if (type && !type.startsWith("image/")) throw new Error("请选择图片文件");
  const dataUrl = await compressImageToDataUrl(fileOrBlob);
  const parsed = (typeof AiTaskDraftPolicy !== "undefined" && AiTaskDraftPolicy.stripDataUrl)
    ? AiTaskDraftPolicy.stripDataUrl(dataUrl)
    : (() => {
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/i);
      return { mimeType: match?.[1] || "image/png", base64: match?.[2] || "" };
    })();
  if (!parsed.base64) throw new Error("图片读取失败");
  return {
    mimeType: parsed.mimeType || type || "image/png",
    base64: parsed.base64,
    dataUrl
  };
}

function compressImageToDataUrl(fileOrBlob, { maxEdge = 1600, maxBytes = 1.2 * 1024 * 1024 } = {}) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(fileOrBlob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("无法压缩图片"));
        return;
      }
      ctx.drawImage(image, 0, 0, width, height);
      let quality = 0.86;
      let dataUrl = canvas.toDataURL("image/jpeg", quality);
      while (dataUrl.length > maxBytes * 1.37 && quality > 0.5) {
        quality -= 0.08;
        dataUrl = canvas.toDataURL("image/jpeg", quality);
      }
      resolve(dataUrl);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("图片加载失败"));
    };
    image.src = objectUrl;
  });
}

function isSetupIncompleteTask(task) {
  return Boolean(task?.setupIncomplete);
}

function promoteSetupIncompleteSections(sections = []) {
  const incomplete = [];
  const seen = new Set();
  sections.forEach(section => {
    section.tasks = (section.tasks || []).filter(item => {
      if (!item || item.entryId || item.kind === "meeting") return true;
      if (!isSetupIncompleteTask(item)) return true;
      if (!seen.has(item.id)) {
        seen.add(item.id);
        incomplete.push(item);
      }
      return false;
    });
  });
  const next = sections.filter(section => section.tasks.length);
  if (incomplete.length) {
    incomplete.sort((a, b) => String(b.createdAtIso || "").localeCompare(String(a.createdAtIso || "")));
    next.unshift({ key: "setupIncomplete", label: "待完善", tasks: incomplete });
  }
  return next;
}

function resolveAiDraftKind(draft = {}) {
  const raw = String(draft.kind || "").trim().toLowerCase();
  if (raw === "meeting") return "meeting";
  if (raw === "task") return "task";
  if (typeof AiTaskDraftPolicy?.normalizeItemKind === "function") {
    return AiTaskDraftPolicy.normalizeItemKind(draft, draft.title);
  }
  return "task";
}

function createTaskFromAiDraft(draft = {}, { persist = true } = {}) {
  const now = new Date();
  // Screenshot / batch create only commits the title; user fills the rest later.
  const task = {
    id: crypto.randomUUID(),
    title: String(draft.title || "").trim().slice(0, 80),
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
    createdFromAiScreenshot: true,
    setupIncomplete: true,
    createdAtIso: now.toISOString(),
    updatedAt: now.toISOString(),
    createdAt: now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
  };
  if (!task.title) throw new Error("截图中未能识别出待办名称");
  getDay(state.selectedDate).tasks.unshift(task);
  if (persist) {
    state.listKind = "todo";
    state.filter = "all";
    TodoListPolicy.saveFilter?.(state.filter);
    saveData();
    render();
  }
  return { type: "task", task, title: task.title };
}

function createMeetingFromAiDraft(draft = {}, { persist = true } = {}) {
  const title = String(draft.title || "").trim().slice(0, 80);
  if (!title) throw new Error("截图中未能识别出会议名称");
  const dateKey = String(draft.dueDate || "").trim() || state.selectedDate;
  const workStart = Number(ScheduleHoursPolicy?.DEFAULT_WORK_START ?? 9);
  const dueTime = String(draft.dueTime || "").trim();
  let start = workStart;
  if (dueTime) {
    const hour = Number(dueTime.slice(0, 2));
    if (Number.isFinite(hour)) start = Math.max(0, Math.min(21, hour));
  }
  const end = Math.min(22, start + 1);
  const entry = {
    id: crypto.randomUUID(),
    title,
    entryType: "calendar",
    start,
    end,
    owner: String(draft.owner || "").trim().slice(0, 80),
    note: String(draft.businessBackground || "").trim().slice(0, 800),
    color: "amber",
    taskId: "",
    createdFromAiScreenshot: true
  };
  getDay(dateKey).entries.push(entry);
  if (persist) {
    state.listKind = "meeting";
    state.meetingFilter = "all";
    saveData();
    render();
  }
  return { type: "meeting", entry, dateKey, title };
}

function createItemsFromAiDrafts(drafts = []) {
  const created = [];
  drafts.forEach(draft => {
    try {
      const kind = resolveAiDraftKind(draft);
      if (kind === "meeting") created.push(createMeetingFromAiDraft(draft, { persist: false }));
      else created.push(createTaskFromAiDraft(draft, { persist: false }));
    } catch {}
  });
  if (!created.length) throw new Error("没有可创建的事项");
  const hasTask = created.some(item => item.type === "task");
  const hasMeeting = created.some(item => item.type === "meeting");
  if (hasTask && !hasMeeting) {
    state.listKind = "todo";
    state.filter = "all";
    TodoListPolicy.saveFilter?.(state.filter);
  } else if (hasMeeting && !hasTask) {
    state.listKind = "meeting";
    state.meetingFilter = "all";
  } else {
    state.listKind = "todo";
    state.filter = "all";
    TodoListPolicy.saveFilter?.(state.filter);
  }
  saveData();
  render();
  return created;
}

function createTasksFromAiDrafts(drafts = []) {
  return createItemsFromAiDrafts(drafts);
}

function summarizeAiCreatedItems(created = []) {
  const tasks = created.filter(item => item.type === "task");
  const meetings = created.filter(item => item.type === "meeting");
  const parts = [];
  if (tasks.length) parts.push(`${tasks.length} 条待办`);
  if (meetings.length) parts.push(`${meetings.length} 条会议`);
  return parts.join("、") || "0 条";
}

let pendingAiBatchDrafts = [];
let pendingAiBatchSource = "task-dialog";
let pendingParentReviewQueue = [];
let parentReviewAdvanceOnClose = false;
let suppressParentReviewAdvance = false;
let parentReviewResumeTaskId = null;
let parentReviewPausedForFollowUp = false;

function beginParentReviewQueue(tasks = []) {
  pendingParentReviewQueue = (tasks || []).map(task => task?.id).filter(Boolean);
  parentReviewResumeTaskId = null;
  openNextParentReviewTask();
}

function scheduleParentReviewAdvance() {
  if (!pendingParentReviewQueue.length) {
    parentReviewAdvanceOnClose = false;
    return;
  }
  requestAnimationFrame(() => openNextParentReviewTask());
}

function openNextParentReviewTask() {
  while (pendingParentReviewQueue.length) {
    const id = pendingParentReviewQueue.shift();
    const task = findTask(id)?.task;
    if (!task || TaskStatusPolicy.isEndedStatus(task.status)) continue;
    openTaskDialog(task, {
      mode: "parentReview",
      queueLeft: pendingParentReviewQueue.length
    });
    return true;
  }
  parentReviewAdvanceOnClose = false;
  return false;
}

function priorityOptionsHtml(selected = "general_daily") {
  const safeSelected = selected === "follow_up" ? "general_daily" : selected;
  return [
    ["general_daily", "一般日常"],
    ["kpi", "KPI"],
    ["important_urgent", "重要紧急"],
    ["paused", "中止暂停"]
  ].map(([value, label]) =>
    `<option value="${value}"${value === safeSelected ? " selected" : ""}>${label}</option>`
  ).join("");
}

function getAiBatchParentCandidateTasks() {
  return uniqueTasks(getAllTasks().map(({ task }) => task));
}

function suggestAiBatchParent(title = "", priority = "") {
  if (typeof TaskOptionPolicy?.suggestParentForTitle !== "function") return null;
  return TaskOptionPolicy.suggestParentForTitle({
    title,
    priority,
    tasks: getAiBatchParentCandidateTasks(),
    isHiddenFutureRecurringInstance
  });
}

function aiBatchParentOptionsHtml(selectedId = "", extraIds = []) {
  const tasks = getAiBatchParentCandidateTasks();
  const byId = new Map(tasks.map(task => [task.id, task]));
  const browse = TaskOptionPolicy.parentPickerBrowseCandidates({
    tasks,
    selectedId,
    isHiddenFutureRecurringInstance,
    limit: 60
  }).map(item => item.task);
  const seen = new Set();
  const list = [];
  const push = task => {
    if (!task?.id || seen.has(task.id) || ["done", "closed"].includes(task.status)) return;
    if (isHiddenFutureRecurringInstance(task)) return;
    seen.add(task.id);
    list.push(task);
  };
  if (selectedId && byId.has(selectedId)) push(byId.get(selectedId));
  (extraIds || []).forEach(id => {
    if (id && byId.has(id)) push(byId.get(id));
  });
  browse.forEach(push);
  return [
    `<option value="">不选择，作为顶层任务</option>`,
    ...list.flatMap(task => {
      const path = TaskOptionPolicy.taskHierarchyPath({ task, tasks }) || String(task.title || "").trim();
      if (!TodoListPolicy.hasDisplayTitle(path)) return [];
      const selected = task.id === selectedId ? " selected" : "";
      return [`<option value="${escapeHtml(task.id)}"${selected}>${escapeHtml(path)}</option>`];
    })
  ].join("");
}

function syncAiBatchSharedParentOptions(preferredIds = []) {
  if (!el.aiBatchSharedParent) return;
  const current = el.aiBatchSharedParent.value || "";
  el.aiBatchSharedParent.innerHTML = aiBatchParentOptionsHtml(current, preferredIds);
  if (current && [...el.aiBatchSharedParent.options].some(option => option.value === current)) {
    el.aiBatchSharedParent.value = current;
  }
}

function openAiBatchDraftDialog(drafts = [], source = "task-dialog") {
  pendingAiBatchDrafts = drafts.map(draft => ({
    kind: resolveAiDraftKind(draft),
    title: String(draft.title || "").trim(),
    dueDate: draft.dueDate || "",
    dueTime: draft.dueTime || "",
    owner: draft.owner || "",
    businessBackground: draft.businessBackground || "",
    confidence: draft.confidence,
    selected: true
  }));
  pendingAiBatchSource = source;
  if (el.aiBatchDraftTitle) {
    el.aiBatchDraftTitle.textContent = drafts.length > 1
      ? `确认 ${drafts.length} 条事项`
      : "确认事项";
  }
  if (el.aiBatchDraftHint) {
    el.aiBatchDraftHint.textContent = "请核对名称与类型（任务 / 会议）。任务会进待办顶部待完善；会议会写入日程。";
  }
  renderAiBatchDraftList();
  el.aiBatchDraftDialog?.showModal();
}

function renderAiBatchDraftList() {
  if (!el.aiBatchDraftList) return;
  el.aiBatchDraftList.innerHTML = pendingAiBatchDrafts.map((draft, index) => `
    <section class="ai-batch-card ai-batch-card-title-only" data-index="${index}">
      <div class="ai-batch-card-top">
        <label class="ai-batch-select">
          <input type="checkbox" data-field="selected" ${draft.selected ? "checked" : ""} />
          <span>创建此条</span>
        </label>
        <span class="form-hint">把握 ${Math.round((Number(draft.confidence) || 0) * 100)}%</span>
      </div>
      <label>
        <span>类型</span>
        <select data-field="kind">
          <option value="task"${draft.kind !== "meeting" ? " selected" : ""}>任务</option>
          <option value="meeting"${draft.kind === "meeting" ? " selected" : ""}>会议</option>
        </select>
      </label>
      <label><span>名称</span><input type="text" data-field="title" maxlength="80" value="${escapeHtml(draft.title || "")}" /></label>
    </section>
  `).join("");
}

function collectAiBatchDraftsFromForm() {
  if (!el.aiBatchDraftList) return [];
  return [...el.aiBatchDraftList.querySelectorAll(".ai-batch-card")].map(card => {
    const read = field => card.querySelector(`[data-field="${field}"]`);
    const selected = Boolean(read("selected")?.checked);
    const title = String(read("title")?.value || "").trim().slice(0, 80);
    const index = Number(card.dataset.index);
    const base = pendingAiBatchDrafts[index] || {};
    return {
      selected,
      kind: String(read("kind")?.value || base.kind || "task") === "meeting" ? "meeting" : "task",
      title,
      dueDate: base.dueDate || "",
      dueTime: base.dueTime || "",
      owner: base.owner || "",
      businessBackground: base.businessBackground || "",
      confidence: base.confidence
    };
  }).filter(item => item.selected && item.title);
}

function bindAiBatchDraftDialog() {
  el.aiBatchSelectAllButton?.addEventListener("click", () => {
    el.aiBatchDraftList?.querySelectorAll('[data-field="selected"]').forEach(input => {
      input.checked = true;
    });
  });
  el.aiBatchDraftForm?.addEventListener("submit", event => {
    event.preventDefault();
    const drafts = collectAiBatchDraftsFromForm();
    if (!drafts.length) {
      showToast("请至少勾选一条有效事项");
      return;
    }
    try {
      const created = createItemsFromAiDrafts(drafts);
      el.aiBatchDraftDialog?.close();
      const summary = summarizeAiCreatedItems(created);
      showToast(`已创建 ${summary}`);
      if (pendingAiBatchSource === "ai-dialog") {
        appendAiChat("assistant", `已从截图创建 ${summary}。任务会置顶待完善；会议已写入对应日期日程。`);
        el.aiStatus.textContent = `已创建 ${summary}。`;
      }
    } catch (error) {
      showToast(error?.message || "创建失败");
    }
  });
}

async function extractAndCreateTaskFromImage({ file = null, attachment = null, note = "", source = "task-dialog" } = {}) {
  if (aiExtractBusy) {
    showToast("正在解析截图，请稍候");
    return null;
  }
  if (!window.desktopAPI?.aiExtractTask) {
    const message = "请在桌面版使用截图解析";
    if (source === "task-dialog") setTaskAiDropzoneStatus(message, "error");
    else el.aiStatus.textContent = message;
    showToast(message);
    return null;
  }
  aiExtractBusy = true;
  if (source === "task-dialog") setTaskAiDropzoneStatus("正在识别截图中的任务/会议…", "busy");
  else {
    el.aiStatus.textContent = "正在识别截图中的任务/会议…";
    appendAiChat("user", note ? `${note}\n（附截图）` : "（附截图，请提取任务或会议）");
  }
  try {
    const image = attachment || await readImageAsAttachment(file);
    const result = await window.desktopAPI.aiExtractTask({
      note,
      imageBase64: image.base64,
      mimeType: image.mimeType,
      today: state.selectedDate || toDateKey(new Date())
    });
    const drafts = Array.isArray(result?.drafts)
      ? result.drafts
      : (result?.draft ? [result.draft] : (result?.title ? [result] : []));
    if (!drafts.length) throw new Error("截图中未能识别出事项");
    if (el.taskDialog?.open) el.taskDialog.close();
    clearAiAttachment();
    if (source === "ai-dialog") el.aiPrompt.value = "";
    setTaskAiDropzoneStatus("");
    if (drafts.length === 1) {
      const created = createItemsFromAiDrafts([drafts[0]]);
      const item = created[0];
      const confidence = Number(drafts[0].confidence);
      const hint = Number.isFinite(confidence) && confidence < 0.55 ? "（把握较低，请核对）" : "";
      if (item.type === "meeting") {
        showToast(`已创建会议「${item.title}」${hint}`);
        if (source === "ai-dialog") {
          appendAiChat("assistant", `已识别为会议并创建「${item.title}」，可在会议清单或日/周/月历中查看。`);
          el.aiStatus.textContent = "已从截图创建会议。";
        }
      } else {
        showToast(`已创建待办「${item.title}」，请到清单顶部补充信息${hint}`);
        if (source === "ai-dialog") {
          appendAiChat("assistant", `已识别为待办并创建「${item.title}」（仅名称）。已置顶并用黄色感叹号标记，点进去即可补充信息。`);
          el.aiStatus.textContent = "已从截图创建待完善待办。";
        }
      }
      return created;
    }
    if (source === "ai-dialog") {
      appendAiChat("assistant", `识别到 ${drafts.length} 条事项（含任务/会议），请核对类型与名称后创建。`);
      el.aiStatus.textContent = `识别到 ${drafts.length} 条，请确认后创建。`;
    }
    openAiBatchDraftDialog(drafts, source);
    return drafts;
  } catch (error) {
    const message = error?.message || "截图解析失败";
    if (source === "task-dialog") setTaskAiDropzoneStatus(message, "error");
    else {
      el.aiStatus.textContent = message;
      appendAiChat("assistant", message);
    }
    showToast(message);
    return null;
  } finally {
    aiExtractBusy = false;
  }
}

function render() {
  invalidateRecurringCatalogCache();
  syncTaskStatuses();
  ensureRecurringTasksForVisibleRange();
  const date = fromDateKey(state.selectedDate);
  updateDateNavigationChrome();
  el.datePicker.value = state.selectedDate;
  el.scheduleTitle.textContent = state.taskView === "project" ? "项目进度 · 甘特总览" :
    state.taskView === "month" ? `${date.getFullYear()}年${date.getMonth() + 1}月 · 月历` :
    state.taskView === "week" ? `${getMonday(date).getMonth() + 1}月${getMonday(date).getDate()}日起 · 周历` :
    `${date.getMonth() + 1}月${date.getDate()}日 · ${WEEKDAY_NAMES[date.getDay()]}`;
  el.todaySummary.textContent = isToday(date) ? "专注当下，把事情一件件做好" : `查看 ${date.getMonth() + 1}月${date.getDate()}日 的工作安排`;
  document.body.classList.toggle("month-mode", state.taskView === "month");
  document.body.classList.toggle("week-mode", state.taskView === "week");
  document.body.classList.toggle("project-mode", state.taskView === "project");
  syncFocusSurfaceVisibility(
    document.body.classList.contains("shell-focus"),
    document.body.classList.contains("shell-compact-topbar")
  );
  el.viewSwitcher.querySelectorAll("button[data-view]").forEach(button => {
    button.classList.toggle("active", button.dataset.view === state.taskView);
  });
  renderWeek();
  renderTasks();
  renderSchedule();
  renderDayNote();
}

function renderWeek() {
  const monday = getMonday(fromDateKey(state.selectedDate));
  el.weekDays.innerHTML = "";
  const visibleIndexes = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(monday, i);
    const key = toDateKey(date);
    if (!ScheduleHoursPolicy.shouldShowWeekColumn({
      dayIndex: i,
      hasActivity: dayHasScheduleActivity(key) || key === state.selectedDate
    })) continue;
    visibleIndexes.push(i);
    const day = state.data[key];
    const button = document.createElement("button");
    button.className = "day-button";
    if (i >= 5) button.classList.add("weekend");
    if (key === state.selectedDate) button.classList.add("active");
    if (isToday(date)) button.classList.add("is-today");
    if (day && (day.tasks?.length || day.entries?.length || day.note)) button.classList.add("has-data");
    button.innerHTML = `<span class="day-number">${date.getDate()}</span><span class="day-name">
      <strong>${WEEKDAY_NAMES[date.getDay()]}</strong>
      <span>${date.getMonth() + 1}月</span></span><i class="day-dot"></i>`;
    button.addEventListener("click", () => selectDate(date));
    el.weekDays.appendChild(button);
  }
  el.weekDays.style.gridTemplateColumns = `repeat(${Math.max(visibleIndexes.length, 1)}, minmax(0, 1fr))`;
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
    allTasks.filter(task =>
      !isHiddenRecurringCatalogInstance(task) ||
      (isOngoingTask(task) && !RecurringPolicy.isMonthlyRecurringTask(task))
    ),
    RecurringPolicy.currentMonthKey()
  ).filter(isTodoListTask);
  const workLeafTasks = allLeafTasks.filter(isWorkLeafTask);
  const memoLeafTasks = allLeafTasks.filter(belongsInMemoList);
  const meetingItems = getMeetingListItems();
  const meetingMode = state.listKind === "meeting";

  updateTaskStats(workLeafTasks, memoLeafTasks, meetingItems);
  updateMeetingFilterCounts(meetingItems);

  const query = (state.taskListSearch || el.taskListSearch?.value || "").trim();
  const ownerSearch = TaskOptionPolicy.parseOwnerSearchQuery?.(query) || { ownerTokens: [], textQuery: query };
  const hasListSearch = Boolean(ownerSearch.textQuery || ownerSearch.ownerTokens?.length);
  const overlayMode = hasListSearch || state.showContinueYesterdayOnly;

  const searchAllTasks = () => {
    let hits;
    if (ownerSearch.textQuery) {
      hits = TaskOptionPolicy.searchTaskCandidates({
        tasks: allLeafTasks,
        query: ownerSearch.textQuery,
        selectedId: "",
        includeEnded: true,
        isHiddenFutureRecurringInstance: task => isHiddenRecurringCatalogInstance(task),
        statusText: task => statusLabel(task.status),
        dateText: task => task.dueDate || "未计划"
      }).map(item => item.task);
    } else {
      hits = [...allLeafTasks];
    }
    if (ownerSearch.ownerTokens?.length) {
      hits = hits.filter(task =>
        TaskOptionPolicy.matchesOwnerTokens?.(task.owner, ownerSearch.ownerTokens)
      );
    }
    return hits;
  };

  let visibleTasks = meetingMode && !overlayMode
    ? []
    : allLeafTasks.filter(task => matchesUnifiedTaskFilter(task, state.filter));
  if (hasListSearch) {
    visibleTasks = searchAllTasks();
  }

  syncListKindSwitch();
  syncTaskPanelDensity();
  el.taskList.className = "task-list unified-view";
  el.taskList.innerHTML = "";
  el.taskPanel?.classList.toggle("is-meeting-list", meetingMode && !overlayMode);
  el.taskPanel?.classList.toggle("is-overlay-list", overlayMode);
  if (el.taskTabs) el.taskTabs.hidden = meetingMode || overlayMode;
  if (el.meetingTabs) el.meetingTabs.hidden = !meetingMode || overlayMode;
  el.taskTabs?.querySelectorAll("button").forEach(item =>
    item.classList.toggle("active", item.dataset.filter === state.filter)
  );
  el.meetingTabs?.querySelectorAll("button[data-meeting-filter]").forEach(item =>
    item.classList.toggle("active", item.dataset.meetingFilter === state.meetingFilter)
  );
  el.continueYesterdayButton?.classList.toggle("active", state.showContinueYesterdayOnly);
  if (meetingMode || overlayMode) {
    closeTaskTabsMoreMenu();
    if (el.taskTabsMore) el.taskTabsMore.hidden = true;
  } else {
    requestAnimationFrame(() => adaptTaskTabsOverflow());
  }

  const entriesByDate = getWorkEntriesByDate();
  const yesterdayKey = shiftDateKey(state.selectedDate, -1);
  let linkedWorkItems = TodoListPolicy.parentLinkedWorkItems({
    entriesByDate,
    tasks: allTasks,
    selectedDate: state.selectedDate,
    yesterdayKey,
    hasChildTasks
  });
  if (hasListSearch) {
    if (ownerSearch.textQuery) {
      const normalizedQuery = TaskOptionPolicy.normalizeSearchText(ownerSearch.textQuery);
      const keywords = normalizedQuery.split(" ").filter(Boolean);
      linkedWorkItems = linkedWorkItems.filter(item => {
        const searchable = TaskOptionPolicy.normalizeSearchText(`${item.title} ${item.parentTitle} 进行中 ${item.dateKey}`);
        return keywords.every(keyword => searchable.includes(keyword));
      });
    }
    if (ownerSearch.ownerTokens?.length) {
      linkedWorkItems = linkedWorkItems.filter(item => {
        const parentOwner = findTask(item.taskId)?.task?.owner || "";
        return TaskOptionPolicy.matchesOwnerTokens?.(parentOwner, ownerSearch.ownerTokens);
      });
    }
  } else if (!["all", "in_progress"].includes(state.filter) && !state.showContinueYesterdayOnly) {
    linkedWorkItems = [];
  }

  let sections;
  if (hasListSearch) {
    const taskHits = visibleTasks.filter(task => !isMemoReminderTask(task));
    const memoHits = visibleTasks.filter(belongsInMemoList);
    const meetingHits = getMeetingListItems({ query });
    sections = [];
    if (taskHits.length || linkedWorkItems.length) {
      sections.push({
        key: "search-tasks",
        label: "待办",
        tasks: [...taskHits, ...linkedWorkItems]
      });
    }
    if (memoHits.length) {
      sections.push({ key: "search-memo", label: "待跟踪", tasks: memoHits });
    }
    if (meetingHits.length) {
      sections.push({
        key: "search-meetings",
        label: `会议（${meetingHits.length}）`,
        tasks: meetingHits
      });
    }
  } else if (state.showContinueYesterdayOnly) {
    const groups = TodoListPolicy.buildTodoGroups({
      tasks: workLeafTasks,
      selectedDate: state.selectedDate,
      yesterdayKey,
      entriesByDate,
      isOngoingTask,
      isUnplannedTask,
      hasChildTasks: taskId => hasChildTasks(taskId),
      includeSections: true
    });
    const continueTasks = [
      ...(groups.continueYesterday || []),
      ...linkedWorkItems.filter(item => item.isFromYesterday)
    ];
    const yesterdayMeetings = getMeetingListItems({ recentDays: 2, futureDays: 0 })
      .filter(item => item.dateKey === yesterdayKey);
    sections = [];
    if (continueTasks.length) {
      sections.push({ key: "continueYesterday", label: "继续昨天", tasks: continueTasks });
    }
    if (yesterdayMeetings.length) {
      sections.push({ key: "yesterday-meetings", label: "昨天的会议", tasks: yesterdayMeetings });
    }
  } else if (meetingMode) {
    const meetings = getMeetingListItems({ query }).filter(item =>
      state.meetingFilter === "all" || getMeetingPhase(item) === state.meetingFilter
    );
    const totalInvested = meetings.reduce((sum, item) => sum + item.investedHours, 0);
    const phaseLabel = {
      all: "全部会议",
      planned: "计划中的会议",
      in_progress: "进行中的会议",
      ended: "已结束的会议"
    }[state.meetingFilter] || "会议";
    sections = meetings.length
      ? [{
        key: "meeting",
        label: `${phaseLabel}（合计 ${trimNumber(totalInvested)}h）`,
        tasks: meetings
      }]
      : [];
  } else if (state.filter === "memo") {
    const memos = TodoListPolicy.sortByCreatedAtDesc(memoLeafTasks);
    sections = memos.length
      ? [{ key: "memo", label: "待跟踪", tasks: memos }]
      : [];
  } else {
    const workVisible = visibleTasks.filter(task => !isMemoReminderTask(task));
    const includeSections = state.filter === "all" || state.filter === "in_progress" || state.filter === "planned" || state.filter === "unplanned";
    const orderedVisible = state.filter === "unplanned"
      ? TodoListPolicy.sortByCreatedAtDesc(workVisible)
      : orderedTasks(workVisible);
    const groups = TodoListPolicy.buildTodoGroups({
      tasks: orderedVisible,
      selectedDate: state.selectedDate,
      yesterdayKey,
      entriesByDate,
      isOngoingTask,
      isUnplannedTask,
      hasChildTasks: taskId => hasChildTasks(taskId),
      includeSections
    });

    sections = TodoListPolicy.flattenGroups(groups).filter(section => section.label || section.tasks.length);
    if (state.filter === "all") {
      const remaining = sections.find(section => section.key === "remaining");
      if (remaining?.tasks.length) remaining.label = "其他任务";
      if (memoLeafTasks.length) {
        const trackingMemos = memoLeafTasks.filter(isMemoReminderTask);
        if (trackingMemos.length) {
          sections.push({
            key: "memo",
            label: "待跟踪",
            tasks: TodoListPolicy.sortByCreatedAtDesc(trackingMemos)
          });
        }
      }
    }
    if (linkedWorkItems.length) {
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

  if (!overlayMode && !meetingMode) {
    sections = promoteSetupIncompleteSections(sections);
  }

  const renderedCount = sections.reduce((sum, section) => sum + section.tasks.length, 0);
  el.taskCount.textContent = String(renderedCount);

  if (!renderedCount) {
    el.taskList.innerHTML = `<div class="empty-state">${state.showContinueYesterdayOnly
      ? "昨天没有可继续的任务或会议"
      : hasListSearch
        ? "没有匹配的待办或会议"
        : state.filter === "memo" && !meetingMode
          ? "暂无待跟踪事项<br>编辑待办时勾选「仅关注」（只提醒、不排投入），或关闭并新建后续后再勾选"
          : meetingMode
            ? `当前分类没有会议<br><button type="button" class="soft-button empty-create-meeting" id="emptyCreateMeeting">新建会议</button>`
            : "当前分类没有待办任务"}</div>`;
    el.taskList.querySelector("#emptyCreateMeeting")?.addEventListener("click", () => openNewFromQuickAdd("", { kind: "meeting" }));
    return;
  }

  sections.forEach(section => {
    const collapsible = !hasListSearch && state.filter === "all" && !state.showContinueYesterdayOnly && Boolean(section.label);
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
    section.tasks.forEach(item => {
      if (item.kind === "meeting") el.taskList.appendChild(createMeetingCard(item));
      else if (item.entryId) el.taskList.appendChild(createLinkedWorkCard(item));
      else el.taskList.appendChild(createTaskCard(item));
    });
  });
}

function getWorkEntriesByDate() {
  const map = {};
  Object.entries(state.data).forEach(([dateKey, day]) => {
    map[dateKey] = (day.entries || []).filter(entry => entry.entryType === "task_work");
  });
  return map;
}

function getMeetingPhase(item, now = new Date()) {
  const start = scheduledDateTime(item.dateKey, item.start);
  const end = scheduledDateTime(item.dateKey, item.end);
  if (now < start) return "planned";
  if (now < end) return "in_progress";
  return "ended";
}

function getMeetingListItems({ query = "", recentDays = 90, futureDays = 30 } = {}) {
  const selected = fromDateKey(state.selectedDate);
  const minKey = toDateKey(addDays(selected, -recentDays));
  const maxKey = toDateKey(addDays(selected, futureDays));
  const ownerSearch = TaskOptionPolicy.parseOwnerSearchQuery?.(query) || { ownerTokens: [], textQuery: query };
  const normalizedQuery = ownerSearch.textQuery
    ? TaskOptionPolicy.normalizeSearchText(ownerSearch.textQuery)
    : "";
  const keywords = normalizedQuery.split(" ").filter(Boolean);
  return getAllCalendarEntries()
    .filter(({ dateKey, entry }) => {
      if (dateKey < minKey || dateKey > maxKey) return false;
      const title = String(entry.title || "").trim();
      if (!TodoListPolicy.hasDisplayTitle(title)) return false;
      if (ownerSearch.ownerTokens?.length &&
          !TaskOptionPolicy.matchesOwnerTokens?.(entry.owner, ownerSearch.ownerTokens)) {
        return false;
      }
      if (!keywords.length) return true;
      const searchable = TaskOptionPolicy.normalizeSearchText(
        `${title} ${dateKey} ${entry.note || ""} ${entry.owner || ""} 会议`
      );
      return keywords.every(keyword => searchable.includes(keyword));
    })
    .map(({ dateKey, entry }) => {
      const item = {
        kind: "meeting",
        entryId: entry.id,
        dateKey,
        title: String(entry.title || "").trim(),
        note: entry.note || "",
        owner: entry.owner || "",
        start: entry.start,
        end: entry.end,
        investedHours: getEntryInvestedHours(dateKey, entry),
        plannedHours: Math.max(0, Number(entry.end) - Number(entry.start))
      };
      item.phase = getMeetingPhase(item);
      return item;
    })
    .sort((a, b) =>
      b.dateKey.localeCompare(a.dateKey) ||
      Number(a.start) - Number(b.start) ||
      a.title.localeCompare(b.title, "zh-CN")
    );
}

function updateMeetingFilterCounts(meetingItems = []) {
  const groups = { all: meetingItems.length, planned: 0, in_progress: 0, ended: 0 };
  meetingItems.forEach(item => {
    const phase = item.phase || getMeetingPhase(item);
    if (groups[phase] != null) groups[phase] += 1;
  });
  if (el.meetingAllCount) el.meetingAllCount.textContent = groups.all;
  if (el.meetingPlannedCount) el.meetingPlannedCount.textContent = groups.planned;
  if (el.meetingDoingCount) el.meetingDoingCount.textContent = groups.in_progress;
  if (el.meetingEndedCount) el.meetingEndedCount.textContent = groups.ended;
  if (el.meetingCount) el.meetingCount.textContent = groups.all;
}

function createMeetingCard(item) {
  const card = document.createElement("article");
  card.className = "task-card meeting-card has-priority";
  card.draggable = true;
  card.dataset.entryId = item.entryId;
  const timeText = `${formatTime(item.start)}–${formatTime(item.end)}`;
  const investText = `${trimNumber(item.investedHours)}h`;
  card.title = `${item.title} · ${item.dateKey} ${timeText} · 已投入 ${investText}`;
  card.innerHTML = `
    <span class="meeting-dot" aria-hidden="true"></span>
    <div class="task-body">
      <strong>${escapeHtml(item.title)}</strong>
      <span class="task-description">${escapeHtml(item.dateKey)} · ${escapeHtml(timeText)}</span>
    </div>
    <span class="priority-mark meeting-invest" title="已投入工时">${escapeHtml(investText)}</span>`;
  card.addEventListener("click", () => {
    const found = findEntry(item.entryId);
    if (found) openEntryDialog(found.entry.start, found.entry, found.dateKey);
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

function shiftDateKey(dateKey, deltaDays) {
  const date = fromDateKey(dateKey);
  return toDateKey(addDays(date, deltaDays));
}

function taskHasWorkHistory(taskId) {
  return TodoListPolicy.hasWorkHistory(taskId, getWorkEntriesByDate());
}

function matchesUnifiedTaskFilter(task, filter) {
  if (filter === "memo") return belongsInMemoList(task);
  if (isMemoReminderTask(task)) return filter === "all";
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
      const unplannedTasks = TodoListPolicy.sortByCreatedAtDesc(allVisibleTasks.filter(isUnplannedTask));
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
    const unplannedTasks = TodoListPolicy.sortByCreatedAtDesc(allVisibleTasks.filter(isUnplannedTask));
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
    requestTaskCompletion(project.parent);
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
  return { unplanned: "未计划", planned: "计划中", in_progress: "进行中", tracking: "待跟踪", ended: "已关闭" }[status] || "计划中";
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
    const summaryTasks = (leafTasks.length ? leafTasks : [root])
      .filter(task => !TaskStatusPolicy.isTrackingStatus(task));
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

const GANTT_LABEL_WIDTH_DEFAULT = 240;
const GANTT_LABEL_WIDTH_MIN = 160;
const GANTT_LABEL_WIDTH_MAX = 520;
const GANTT_LABEL_WIDTH_KEY = "today-planner-gantt-label-width";
const GANTT_LABEL_WIDTH = GANTT_LABEL_WIDTH_DEFAULT;

function clampGanttLabelWidth(width) {
  const value = Number(width);
  if (!Number.isFinite(value)) return GANTT_LABEL_WIDTH_DEFAULT;
  return Math.min(GANTT_LABEL_WIDTH_MAX, Math.max(GANTT_LABEL_WIDTH_MIN, Math.round(value)));
}

function getGanttLabelWidth() {
  if (state.ganttLabelWidth == null) state.ganttLabelWidth = loadGanttLabelWidth();
  return state.ganttLabelWidth;
}

function loadGanttLabelWidth() {
  try {
    return clampGanttLabelWidth(localStorage.getItem(GANTT_LABEL_WIDTH_KEY));
  } catch {
    return GANTT_LABEL_WIDTH_DEFAULT;
  }
}

function saveGanttLabelWidth(width) {
  const next = clampGanttLabelWidth(width);
  state.ganttLabelWidth = next;
  try { localStorage.setItem(GANTT_LABEL_WIDTH_KEY, String(next)); } catch {}
  return next;
}

function bindGanttLabelResize(handle, splits = []) {
  if (!handle) return;
  const targets = (Array.isArray(splits) ? splits : [splits]).filter(Boolean);
  handle.addEventListener("pointerdown", event => {
    if (event.button !== 0) return;
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = getGanttLabelWidth();
    handle.classList.add("is-dragging");
    document.body.classList.add("gantt-label-resizing");
    handle.setPointerCapture(event.pointerId);
    const applyWidth = width => {
      const next = `${width}px`;
      targets.forEach(split => split.style.setProperty("--gantt-label-width", next));
    };
    const onMove = moveEvent => {
      const next = clampGanttLabelWidth(startWidth + (moveEvent.clientX - startX));
      state.ganttLabelWidth = next;
      applyWidth(next);
    };
    const onUp = upEvent => {
      handle.classList.remove("is-dragging");
      document.body.classList.remove("gantt-label-resizing");
      try { handle.releasePointerCapture(upEvent.pointerId); } catch {}
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
      handle.removeEventListener("pointercancel", onUp);
      saveGanttLabelWidth(state.ganttLabelWidth);
    };
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
    handle.addEventListener("pointercancel", onUp);
  });
}

const TASK_PANEL_WIDTH_DEFAULT = 280;
const TASK_PANEL_WIDTH_MIN = 200;
const TASK_PANEL_WIDTH_MAX = 480;
const TASK_PANEL_WIDTH_KEY = "today-planner-task-panel-width";
/** Dual「待办清单 / 会议清单」only after the row can hold full labels at the narrow font. */
const LIST_KIND_DROPDOWN_MAX_WIDTH = 268;
/** Width where title/add chrome reach their comfortable full size. */
const TASK_PANEL_SCALE_FULL_WIDTH = 420;

function clampTaskPanelWidth(width) {
  const value = Number(width);
  if (!Number.isFinite(value)) return TASK_PANEL_WIDTH_DEFAULT;
  return Math.min(TASK_PANEL_WIDTH_MAX, Math.max(TASK_PANEL_WIDTH_MIN, Math.round(value)));
}

function loadTaskPanelWidth() {
  try {
    return clampTaskPanelWidth(localStorage.getItem(TASK_PANEL_WIDTH_KEY));
  } catch {
    return TASK_PANEL_WIDTH_DEFAULT;
  }
}

function saveTaskPanelWidth(width) {
  const next = clampTaskPanelWidth(width);
  state.taskPanelWidth = next;
  try { localStorage.setItem(TASK_PANEL_WIDTH_KEY, String(next)); } catch {}
  return next;
}

function applyTaskPanelWidth(width) {
  const next = clampTaskPanelWidth(width);
  state.taskPanelWidth = next;
  document.documentElement.style.setProperty("--task-panel-width", `${next}px`);
  syncTaskPanelDensity();
  return next;
}

function taskPanelScaleProgress(width) {
  const span = Math.max(1, TASK_PANEL_SCALE_FULL_WIDTH - TASK_PANEL_WIDTH_MIN);
  return Math.min(1, Math.max(0, (width - TASK_PANEL_WIDTH_MIN) / span));
}

function syncTaskPanelDensity() {
  const panel = el.taskPanel;
  if (!panel) return;
  const width = panel.clientWidth || state.taskPanelWidth || TASK_PANEL_WIDTH_DEFAULT;
  const t = taskPanelScaleProgress(width);
  // Narrow baseline matches the best-looking min column; widen in step with 新增事项.
  const titleSize = Math.round((14 + t * 6) * 10) / 10; // 14 → 20
  const addFont = Math.round((12 + t * 2.5) * 10) / 10; // 12 → 14.5
  const sideActionRem = (4.35 + t * 1.15).toFixed(2); // ~4.35 → 5.5
  const toolbarH = Math.round(28 + t * 4); // 28 → 32
  const quickBtn = Math.round(26 + t * 4); // 26 → 30
  panel.style.setProperty("--task-title-size", `${titleSize}px`);
  panel.style.setProperty("--task-add-font-size", `${addFont}px`);
  panel.style.setProperty("--task-side-action-w", `${sideActionRem}rem`);
  panel.style.setProperty("--task-toolbar-h", `${toolbarH}px`);
  panel.style.setProperty("--quick-add-size", `${quickBtn}px`);
  panel.classList.toggle("density-md", width < 360);
  panel.classList.toggle("density-sm", width < LIST_KIND_DROPDOWN_MAX_WIDTH);
  panel.classList.toggle("density-xs", width < 230);
  // Only the true min column uses the dropdown; otherwise always full dual titles.
  const useKindSelect = width < LIST_KIND_DROPDOWN_MAX_WIDTH;
  if (el.taskViewTitle) el.taskViewTitle.hidden = useKindSelect;
  if (el.listKindMenu) {
    el.listKindMenu.hidden = !useKindSelect;
    if (!useKindSelect) closeListKindMenu();
  }
  if (el.listKindTodo) el.listKindTodo.textContent = "待办清单";
  if (el.listKindMeeting) el.listKindMeeting.textContent = "会议清单";
  syncListKindMenu();
  if (el.continueYesterdayButton) {
    const label = el.continueYesterdayButton.querySelector(".task-side-label");
    if (label) label.textContent = width < 230 ? "昨天" : "继续昨天";
  }
  syncQuickAddChrome(width);
}

function syncQuickAddChrome(width = el.taskPanel?.clientWidth || state.taskPanelWidth || TASK_PANEL_WIDTH_DEFAULT) {
  // Add / search / continue-yesterday stay the same in todo and meeting lists.
  if (el.quickTaskInput && document.activeElement !== el.quickTaskInput) {
    el.quickTaskInput.placeholder = "新增";
    el.quickTaskInput.setAttribute("aria-label", "新增标题后选择任务或会议");
  }
  if (el.taskAddTrigger) {
    el.taskAddTrigger.title = "新建";
    el.taskAddTrigger.setAttribute("aria-label", "新建");
  }
  if (el.taskListSearch && !(el.taskListSearch.value || "").trim()) {
    el.taskListSearch.placeholder = width < 230 ? "搜索.../@" : "搜索.../@人";
    el.taskListSearch.setAttribute("aria-label", "搜索全部待办与会议，或 @责任人 / @参会人");
  }
}

function bindWorkspaceSplitResize() {
  const handle = el.workspaceSplitHandle;
  if (!handle || handle.dataset.bound === "1") return;
  handle.dataset.bound = "1";
  handle.addEventListener("pointerdown", event => {
    if (event.button !== 0) return;
    if (document.body.classList.contains("shell-focus")) return;
    if (document.body.classList.contains("project-mode")) return;
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = state.taskPanelWidth ?? loadTaskPanelWidth();
    handle.classList.add("is-dragging");
    document.body.classList.add("workspace-split-resizing");
    handle.setPointerCapture(event.pointerId);
    const onMove = moveEvent => {
      applyTaskPanelWidth(startWidth + (moveEvent.clientX - startX));
      adaptTaskTabsOverflow();
    };
    const onUp = upEvent => {
      handle.classList.remove("is-dragging");
      document.body.classList.remove("workspace-split-resizing");
      try { handle.releasePointerCapture(upEvent.pointerId); } catch {}
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
      handle.removeEventListener("pointercancel", onUp);
      saveTaskPanelWidth(state.taskPanelWidth);
      requestAnimationFrame(() => adaptTaskTabsOverflow());
    };
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
    handle.addEventListener("pointercancel", onUp);
  });
}

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
  syncProjectGanttChartOffset(scroller.scrollLeft);
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
  const incomplete = isSetupIncompleteTask(task);
  const visualStatus = isUnplannedTask(task) ? "unplanned" : task.status;
  const priority = task.priority || "general_daily";
  const statusBadge = incomplete ? null : TaskStatusPolicy.listSideBadge(task);
  const showPriority = !statusBadge && !incomplete && priority !== "general_daily";
  const sideBadge = statusBadge
    || (showPriority
      ? { className: `priority-mark ${priority}`, text: priorityShortLabel(priority), title: priorityLabel(priority) }
      : null);
  // Badge already shows 跟踪 — don't repeat 「· 跟踪」 in the name.
  const displayTitle = TaskStatusPolicy.listDisplayTitle?.(task) || String(task.title || "").trim();
  const card = document.createElement("article");
  card.className = `task-card ${visualStatus}${incomplete ? " setup-incomplete" : ""}`;
  card.dataset.taskId = task.id;
  card.draggable = !incomplete && (
    visualStatus === "unplanned"
    || TaskStatusPolicy.isSchedulableStatus(task.status)
    || isMemoReminderTask(task)
  );
  if (incomplete) card.title = `${displayTitle}（待完善：点击补充上级、时间等信息）`;
  else if (isMemoReminderTask(task)) card.title = `${displayTitle}（备忘：拖入日程将新建待办并开始投入）`;
  else card.title = displayTitle;
  if (sideBadge) card.classList.add("has-priority");
  card.innerHTML = incomplete
    ? `<button class="task-setup-warning" type="button" title="待完善信息，点击补充" aria-label="待完善信息">
        <span class="task-setup-warning-mark" aria-hidden="true">!</span>
      </button>
      <div class="task-body">
        <strong>${escapeHtml(displayTitle)}</strong>
      </div>`
    : `<button class="task-check" type="button" title="标记完成" aria-label="标记完成"></button>
      <div class="task-body">
        <strong>${escapeHtml(displayTitle)}</strong>
      </div>
      ${sideBadge ? `<span class="${sideBadge.className}" title="${escapeHtml(sideBadge.title)}">${escapeHtml(sideBadge.text)}</span>` : ""}`;

  if (incomplete) {
    card.querySelector(".task-setup-warning")?.addEventListener("click", event => {
      event.stopPropagation();
      openTaskDialog(task, { mode: "setupIncomplete" });
    });
  } else {
    card.querySelector(".task-check")?.addEventListener("click", event => {
      event.stopPropagation();
      requestTaskCompletion(task);
    });
  }
  card.addEventListener("click", event => {
    if (event.target.closest(".task-check, .task-setup-warning")) return;
    openTaskDialog(task, incomplete ? { mode: "setupIncomplete" } : {});
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
  card.title = `${item.title} · 所属计划：${item.parentTitle || ""}`;
  card.innerHTML = `
    <button class="task-check" type="button" title="标记此投入事项完成" aria-label="标记完成"></button>
    <div class="task-body">
      <strong>${escapeHtml(item.title)}</strong>
    </div>`;
  card.querySelector(".task-check").addEventListener("click", event => {
    event.stopPropagation();
    const task = materializeLinkedWorkLeaf(item);
    if (task) requestTaskCompletion(task);
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
  card.addEventListener("click", event => {
    if (event.target.closest(".task-check")) return;
    openConcreteTask(event);
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

function updateTaskStats(tasks, memoTasks = [], meetingItems = []) {
  tasks = uniqueTasks(tasks).filter(isWorkLeafTask);
  const memos = uniqueTasks(memoTasks).filter(belongsInMemoList);
  const trackingOnly = memos.filter(isMemoReminderTask);
  const meetings = Array.isArray(meetingItems) ? meetingItems : [];
  const groups = {
    unplanned: tasks.filter(isUnplannedTask),
    planned: tasks.filter(task =>
      task.status === "planned" && !isUnplannedTask(task) && !isContainerOnlyTask(task)),
    inProgress: tasks.filter(task => task.status === "in_progress"),
    ended: tasks.filter(task => task.status === "done" || task.status === "closed"),
    memo: memos,
    meeting: meetings
  };
  el.unplannedCount.textContent = groups.unplanned.length;
  el.openCount.textContent = groups.planned.length;
  el.doneCount.textContent = groups.inProgress.length;
  el.closedCount.textContent = groups.ended.length;
  if (el.memoCount) el.memoCount.textContent = groups.memo.length;
  if (el.meetingCount) el.meetingCount.textContent = groups.meeting.length;
  // 跟踪关注优先级任务已计入工作待办，全部计数只再叠加真正的备忘提醒
  el.allCount.textContent = tasks.length + trackingOnly.length;
  el.taskCount.textContent = tasks.length + trackingOnly.length;
  // 当天计划 = 工作日可用时长；完成进度 = 当日已投入时长 / 工作日时长。
  const workDayHours = Math.max(1, Number(state.workEndHour) - Number(state.workStartHour));
  const invested = taskDatesForView().reduce((sum, key) => {
    const day = getDay(key);
    return sum + (day.entries || []).reduce((sub, entry) => sub + getEntryInvestedHours(key, entry), 0);
  }, 0);
  const progress = Math.max(0, Math.min(100, Math.round(invested / workDayHours * 100)));
  el.progressLabel.textContent = `${progress}%`;
  el.progressBar.style.width = `${progress}%`;
  el.plannedHours.textContent = formatHours(workDayHours);
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

let recurringCatalogKeepIdsCache = null;
function getRecurringCatalogKeepIds() {
  if (recurringCatalogKeepIdsCache) return recurringCatalogKeepIdsCache;
  const tasks = getAllTasks().map(({ task }) => task);
  recurringCatalogKeepIdsCache = RecurringPolicy.canonicalRecurringKeepIds(
    tasks,
    RecurringPolicy.currentMonthKey()
  ).keepIds;
  return recurringCatalogKeepIdsCache;
}

function invalidateRecurringCatalogCache() {
  recurringCatalogKeepIdsCache = null;
}

function isHiddenRecurringCatalogInstance(task, options = {}) {
  if (!RecurringPolicy.isMonthlyRecurringTask?.(task) && !(task?.recurrence?.frequency === "monthly" && task.dueDate)) {
    return false;
  }
  if (options.keepCurrentLinked && options.selectedId && task.id === options.selectedId) return false;
  // Day/month cells still need future-only hiding; catalog/pickers collapse to one logical task.
  if (isHiddenFutureRecurringInstance(task)) return true;
  return RecurringPolicy.isNonCanonicalRecurringInstance(task, getRecurringCatalogKeepIds());
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

function restoreTaskStatusOptions(task) {
  let currentStatus = task?.status || el.taskStatus?.value || "planned";
  if (currentStatus === "closed") currentStatus = "done";
  // Automatic statuses must stay selectable when they are the current value;
  // disabling both lets the browser fall through to “已完成”.
  if (!task?.completedAt && currentStatus === "done" && !TaskStatusPolicy.isEndedStatus(task?.status)) {
    currentStatus = "planned";
  }
  if (currentStatus !== "tracking" && (task?.priority === "follow_up" || el.taskFollowUpTracking?.checked)) {
    currentStatus = "tracking";
  }
  // 待跟踪不在状态下拉中选择，只通过「仅关注」勾选。
  const plannedDisabled = (currentStatus === "planned" || currentStatus === "tracking") ? "" : " disabled";
  const progressDisabled = currentStatus === "in_progress" ? "" : " disabled";
  el.taskStatus.innerHTML = `
    <option value="planned"${plannedDisabled}>计划中（尚未排入日程）</option>
    <option value="in_progress"${progressDisabled}>进行中（已排入日程）</option>
    <option value="tracking" hidden>待跟踪</option>
    <option value="done">已完成 / 已关闭</option>`;

  if (["planned", "in_progress", "tracking", "done"].includes(currentStatus)) {
    el.taskStatus.value = currentStatus;
  } else {
    el.taskStatus.value = "planned";
  }
  if (el.taskStatus.value !== currentStatus && (currentStatus === "planned" || currentStatus === "in_progress")) {
    const option = el.taskStatus.querySelector(`option[value="${currentStatus}"]`);
    if (option) option.disabled = false;
    el.taskStatus.value = currentStatus;
  }
}

function handlePanelScreenshotPaste(event) {
  const items = [...(event.clipboardData?.items || [])];
  const imageItem = items.find(item => item.type?.startsWith("image/"));
  if (!imageItem) return;
  // Don't steal paste from AI chat / dialogs that handle images themselves.
  if (el.aiDialog?.open || el.taskDialog?.open || el.entryDialog?.open) return;
  const file = imageItem.getAsFile();
  if (!file) return;
  event.preventDefault();
  extractAndCreateTaskFromImage({ file, source: "task-dialog" });
}

function openNewFromQuickAdd(presetTitle = "", { kind = "task" } = {}) {
  const title = String(presetTitle || el.quickTaskInput?.value || "").trim();
  if (el.quickTaskInput) el.quickTaskInput.value = "";
  openTaskDialog(null, {
    createKind: kind === "meeting" ? "meeting" : "task",
    presetTitle: title
  });
}

function openNewMeetingFromQuickAdd(presetTitle = "") {
  openNewFromQuickAdd(presetTitle, { kind: "meeting" });
}

function openNewTaskFromQuickAdd(presetTitle = "") {
  openNewFromQuickAdd(presetTitle, { kind: "task" });
}

function isCreateMeetingKind() {
  return !state.editingTaskId && el.taskCreateKind?.value === "meeting";
}

function syncTaskCreateKindUi() {
  const creating = !state.editingTaskId;
  const meeting = creating && el.taskCreateKind?.value === "meeting";
  el.taskCreateKindField?.classList.toggle("hidden", !creating);
  el.taskMeetingEndField?.classList.toggle("hidden", !meeting);
  el.taskEditForm?.classList.toggle("create-kind-meeting", meeting);
  el.taskFollowUpOption?.classList.toggle("hidden", meeting);
  if (!creating) {
    el.taskMeetingEndField?.classList.add("hidden");
    el.taskFollowUpOption?.classList.remove("hidden");
    return;
  }
  if (el.taskDialogEyebrow) el.taskDialogEyebrow.textContent = meeting ? "NEW MEETING" : "NEW TASK";
  if (el.taskDialogTitle) el.taskDialogTitle.textContent = meeting ? "新建会议" : "新建待办";
  const titleLabel = el.taskTitleField?.querySelector("span");
  if (titleLabel) titleLabel.textContent = meeting ? "会议名称" : "待办名称";
  if (el.taskTitleInput) {
    el.taskTitleInput.placeholder = meeting ? "会议主题是什么？" : "需要完成什么？";
  }
  const dueLabel = el.taskDueDateField?.querySelector("span");
  if (dueLabel) dueLabel.textContent = meeting ? "开始日期时间" : "目标日期时间";
  if (meeting) ensureMeetingEndDefault();
  const ownerLabel = el.taskOwner?.closest("label")?.querySelector("span");
  if (ownerLabel) ownerLabel.textContent = meeting ? "参会人" : "责任人";
  if (el.taskOwner) {
    el.taskOwner.maxLength = meeting ? 80 : 30;
    el.taskOwner.placeholder = meeting ? "例如：我、王芳、李明（多人用逗号分隔）" : "例如：我、王芳";
  }
  const parentLabel = el.taskParentField?.querySelector(":scope > span");
  if (parentLabel) parentLabel.textContent = meeting ? "关联待办" : "归属上级任务";
  if (el.taskParentTrigger) {
    el.taskParentTrigger.textContent = meeting ? "搜索并关联待办（可选）…" : "搜索并选择上级任务…";
  }
  const bgLabel = el.businessBackgroundLabel?.querySelector("span");
  if (bgLabel) bgLabel.textContent = meeting ? "会议说明（可选）" : "背景与说明";
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function formatDateTimeDisplay(dateKey = "", time = "") {
  if (!dateKey) return "";
  const safeTime = normalizeTimeInput(time) || defaultWorkEndTime();
  return `${String(dateKey).replace(/\//g, "-")} ${safeTime}`;
}

function parseFlexibleDateTime(value = "") {
  const raw = String(value || "").trim().replace(/\s+/g, " ");
  if (!raw) return { dateKey: "", time: "", hour: null, minute: 0, display: "" };
  let match = raw.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})(?:[T\s]+(\d{1,2})(?::(\d{1,2}))?)?$/);
  if (!match) {
    match = raw.match(/^(\d{4})(\d{2})(\d{2})(?:\s*(\d{1,2})(?::?(\d{2}))?)?$/);
  }
  if (!match) return { dateKey: "", time: "", hour: null, minute: 0, display: raw };
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = match[4] == null || match[4] === "" ? null : Number(match[4]);
  const minute = match[5] == null || match[5] === "" ? (hour == null ? 0 : 0) : Number(match[5]);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) {
    return { dateKey: "", time: "", hour: null, minute: 0, display: raw };
  }
  if (hour != null && (hour < 0 || hour > 23 || minute < 0 || minute > 59)) {
    return { dateKey: "", time: "", hour: null, minute: 0, display: raw };
  }
  const dateKey = `${year}-${pad2(month)}-${pad2(day)}`;
  const time = hour == null ? "" : `${pad2(hour)}:${pad2(minute || 0)}`;
  return {
    dateKey,
    time,
    hour: hour == null ? null : hour,
    minute: hour == null ? 0 : (minute || 0),
    display: formatDateTimeDisplay(dateKey, time || defaultWorkEndTime())
  };
}

function parseDateTimeLocalParts(value = "") {
  const parsed = parseFlexibleDateTime(value);
  return {
    dateKey: parsed.dateKey || "",
    hour: parsed.hour,
    minute: parsed.minute || 0
  };
}

function normalizeDateTimeInputValue(input, { defaultKind = "end", fillTime = true } = {}) {
  if (!input) return null;
  const parsed = parseFlexibleDateTime(input.value || "");
  if (!parsed.dateKey) return null;
  const time = parsed.time || (fillTime ? (defaultKind === "start" ? defaultWorkStartTime() : defaultWorkEndTime()) : "");
  input.value = formatDateTimeDisplay(parsed.dateKey, time);
  return { dateKey: parsed.dateKey, time, hour: parsed.hour, minute: parsed.minute };
}

function bindFlexibleDateTimeInput(input, { kind = "end" } = {}) {
  if (!input || input.dataset.flexibleDateTimeBound === "1") return;
  input.dataset.flexibleDateTimeBound = "1";
  const resolveKind = () => (typeof kind === "function" ? kind() : kind);
  input.addEventListener("blur", () => {
    if (!String(input.value || "").trim()) return;
    normalizeDateTimeInputValue(input, { defaultKind: resolveKind(), fillTime: true });
  });
  input.addEventListener("keydown", event => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    normalizeDateTimeInputValue(input, { defaultKind: resolveKind(), fillTime: true });
    input.blur();
  });
}

function openDateTimePickerForInput(inputId) {
  const input = inputId ? document.getElementById(inputId) : null;
  if (!input) return;
  const parsed = parseFlexibleDateTime(input.value || "");
  const seed = parsed.dateKey
    ? `${parsed.dateKey}T${parsed.time || (inputId === "taskMeetingEndDateTime" ? defaultWorkEndTime() : defaultWorkEndTime())}`
    : defaultLocalDateTimeSeed(inputId === "taskDueDateTime" && isCreateMeetingKind() ? "start" : "end");
  const picker = document.createElement("input");
  picker.type = "datetime-local";
  picker.step = "60";
  picker.value = seed;
  picker.style.cssText = "position:fixed;opacity:0;pointer-events:none;width:0;height:0;left:0;top:0;";
  document.body.appendChild(picker);
  const apply = () => {
    if (picker.value) {
      const [dateKey = "", timePart = ""] = picker.value.split("T");
      input.value = formatDateTimeDisplay(dateKey, normalizeTimeInput(timePart));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
    picker.remove();
  };
  picker.addEventListener("change", apply, { once: true });
  picker.addEventListener("blur", () => setTimeout(() => picker.remove(), 0), { once: true });
  try { picker.showPicker?.(); } catch { picker.click(); }
}

function ensureMeetingEndDefault() {
  if (!el.taskMeetingEndDateTime) return;
  let startParts = parseDateTimeLocalParts(el.taskDueDateTime?.value || "");
  if (!startParts.dateKey || startParts.hour == null) {
    const dateKey = state.selectedDate || toDateKey(new Date());
    const workStart = Number(ScheduleHoursPolicy?.DEFAULT_WORK_START ?? 9);
    const hour = Math.min(21, Math.max(workStart, new Date().getHours()));
    if (!String(el.taskDueDateTime?.value || "").trim()) {
      el.taskDueDateTime.value = formatDateTimeDisplay(dateKey, `${pad2(hour)}:00`);
    }
    startParts = parseDateTimeLocalParts(el.taskDueDateTime?.value || "");
  }
  if (!startParts.dateKey || startParts.hour == null) return;
  if (String(el.taskMeetingEndDateTime.value || "").trim()) return;
  const endHour = Math.min(22, startParts.hour + 1);
  el.taskMeetingEndDateTime.value = formatDateTimeDisplay(
    startParts.dateKey,
    `${pad2(endHour)}:${pad2(startParts.minute || 0)}`
  );
}

function applyTaskFilter(filter) {
  if (!filter || filter === "meeting") return;
  state.listKind = "todo";
  state.lastTodoFilter = filter;
  state.filter = filter;
  state.showContinueYesterdayOnly = false;
  TodoListPolicy.saveFilter(state.filter);
  el.taskTabs?.querySelectorAll("button[data-filter]").forEach(item => {
    item.classList.toggle("active", item.dataset.filter === filter);
  });
  el.taskTabsMoreMenu?.querySelectorAll("button[data-filter]").forEach(item => {
    item.classList.toggle("active", item.dataset.filter === filter);
  });
  // Left status tabs only reshape the todo list; day/week/month calendars stay unfiltered.
  renderTasks();
  adaptTaskTabsOverflow();
}

function applyMeetingFilter(filter) {
  if (!filter) return;
  state.listKind = "meeting";
  state.meetingFilter = filter;
  state.showContinueYesterdayOnly = false;
  renderTasks();
}

function applyListKind(kind) {
  if (kind === "meeting") {
    state.listKind = "meeting";
    state.showContinueYesterdayOnly = false;
    if (!state.meetingFilter) state.meetingFilter = "all";
    renderTasks();
    return;
  }
  state.listKind = "todo";
  const restore = state.lastTodoFilter && state.lastTodoFilter !== "meeting"
    ? state.lastTodoFilter
    : "in_progress";
  applyTaskFilter(restore);
}

function syncListKindMenu() {
  const meeting = state.listKind === "meeting";
  if (el.listKindMenuLabel) el.listKindMenuLabel.textContent = meeting ? "会议清单" : "待办清单";
  el.listKindMenuPanel?.querySelectorAll("button[data-list-kind]").forEach(item => {
    const kind = item.dataset.listKind === "meeting" ? "meeting" : "todo";
    const active = kind === (meeting ? "meeting" : "todo");
    item.textContent = kind === "meeting" ? "会议清单" : "待办清单";
    item.classList.toggle("active", active);
    item.setAttribute("aria-selected", String(active));
  });
}

function positionListKindMenuPanel() {
  const panel = el.listKindMenuPanel;
  const trigger = el.listKindMenuButton;
  if (!panel || !trigger) return;
  const rect = trigger.getBoundingClientRect();
  const width = Math.max(96, Math.ceil(rect.width) + 24);
  let left = Math.round(rect.left);
  left = Math.min(left, Math.max(8, window.innerWidth - width - 8));
  panel.style.position = "fixed";
  panel.style.left = `${left}px`;
  panel.style.top = `${Math.round(rect.bottom + 4)}px`;
  panel.style.minWidth = `${width}px`;
  panel.style.right = "auto";
  panel.style.zIndex = "5000";
}

function closeListKindMenu() {
  if (!el.listKindMenuPanel || !el.listKindMenuButton) return;
  el.listKindMenuPanel.hidden = true;
  el.listKindMenuButton.setAttribute("aria-expanded", "false");
  el.listKindMenu?.classList.remove("is-open");
  if (el.listKindMenuPanel.parentElement !== el.listKindMenu && el.listKindMenu) {
    el.listKindMenu.appendChild(el.listKindMenuPanel);
  }
}

function openListKindMenu() {
  if (!el.listKindMenuPanel || !el.listKindMenuButton || el.listKindMenu?.hidden) return;
  syncListKindMenu();
  // Escape task-panel overflow:hidden / container containment so the menu can receive clicks.
  document.body.appendChild(el.listKindMenuPanel);
  el.listKindMenuPanel.hidden = false;
  positionListKindMenuPanel();
  el.listKindMenuButton.setAttribute("aria-expanded", "true");
  el.listKindMenu?.classList.add("is-open");
}

function syncListKindSwitch() {
  const meeting = state.listKind === "meeting";
  el.listKindTodo?.classList.toggle("active", !meeting);
  el.listKindMeeting?.classList.toggle("active", meeting);
  el.listKindTodo?.setAttribute("aria-selected", String(!meeting));
  el.listKindMeeting?.setAttribute("aria-selected", String(meeting));
  syncListKindMenu();
  el.taskPanel?.classList.toggle("is-meeting-list", meeting);
  if (el.taskListSearch) {
    el.taskListSearch.setAttribute(
      "aria-label",
      meeting ? "搜索会议标题，或 @参会人" : "搜索待办标题，或 @责任人"
    );
  }
  syncQuickAddChrome();
}

function closeTaskTabsMoreMenu() {
  if (!el.taskTabsMoreMenu || !el.taskTabsMoreButton) return;
  el.taskTabsMoreMenu.hidden = true;
  el.taskTabsMoreButton.setAttribute("aria-expanded", "false");
  el.taskTabsMore?.classList.remove("is-open");
}

function openTaskTabsMoreMenu() {
  if (!el.taskTabsMoreMenu || !el.taskTabsMoreButton) return;
  el.taskTabsMoreMenu.hidden = false;
  el.taskTabsMoreButton.setAttribute("aria-expanded", "true");
  el.taskTabsMore?.classList.add("is-open");
}

function adaptTaskTabsOverflow() {
  const wrap = el.taskTabsWrap;
  const tabs = el.taskTabs;
  const more = el.taskTabsMore;
  const menu = el.taskTabsMoreMenu;
  const moreBtn = el.taskTabsMoreButton;
  if (!wrap || !tabs || !more || !menu || !moreBtn) return;

  // Meeting tabs are a separate strip; never show the todo overflow "⋯" there.
  if (state.listKind === "meeting" || tabs.hidden) {
    closeTaskTabsMoreMenu();
    more.hidden = true;
    return;
  }

  const buttons = [...tabs.querySelectorAll("button[data-filter]")];
  if (!buttons.length) return;

  const preferredCollapse = new Set(["ended", "memo"]);
  buttons.forEach(btn => { btn.hidden = false; });
  more.hidden = true;
  closeTaskTabsMoreMenu();
  menu.innerHTML = "";
  moreBtn.textContent = "⋯";
  moreBtn.setAttribute("aria-label", "更多");
  moreBtn.classList.remove("has-active");

  const available = wrap.clientWidth;
  if (available <= 0) return;

  const gap = 2;
  const measureRow = (list) => list.reduce((sum, btn, i) => sum + btn.offsetWidth + (i ? gap : 0), 0);

  // 1) Prefer showing every tab when they fit.
  if (measureRow(buttons) <= available) return;

  // 2) Default overflow: only tuck 已结束 + 待跟踪.
  const primary = buttons.filter(btn => !preferredCollapse.has(btn.dataset.filter));
  const secondary = buttons.filter(btn => preferredCollapse.has(btn.dataset.filter));
  more.hidden = false;
  const moreWidth = more.offsetWidth + gap;
  const primaryWidth = measureRow(primary);

  let hiddenButtons = [];
  if (primaryWidth + moreWidth <= available) {
    secondary.forEach(btn => { btn.hidden = true; });
    hiddenButtons = secondary;
  } else {
    // 3) Still too tight: keep primary filters that fit, then more.
    secondary.forEach(btn => { btn.hidden = true; });
    hiddenButtons = [...secondary];
    let used = 0;
    let fit = 0;
    for (let i = 0; i < primary.length; i += 1) {
      const next = used + primary[i].offsetWidth + (i ? gap : 0);
      if (next + moreWidth > available) break;
      used = next;
      fit = i + 1;
    }
    fit = Math.max(1, fit);
    primary.forEach((btn, index) => {
      if (index >= fit) {
        btn.hidden = true;
        hiddenButtons.push(btn);
      }
    });
  }

  // Keep the active filter visible in the primary row when possible.
  const activeFilter = state.filter;
  const activeBtn = buttons.find(btn => btn.dataset.filter === activeFilter);
  if (activeBtn?.hidden) {
    activeBtn.hidden = false;
    hiddenButtons = hiddenButtons.filter(btn => btn !== activeBtn);
    // If active was a preferred-collapse tab, hide another primary to make room.
    if (preferredCollapse.has(activeFilter)) {
      const victims = primary.filter(btn => !btn.hidden && btn !== activeBtn);
      const victim = victims.at(-1);
      if (victim && measureRow(buttons.filter(b => !b.hidden)) + moreWidth > available) {
        victim.hidden = true;
        if (!hiddenButtons.includes(victim)) hiddenButtons.push(victim);
      }
    }
  }

  hiddenButtons = buttons.filter(btn => btn.hidden);
  if (!hiddenButtons.length) {
    more.hidden = true;
    return;
  }

  more.hidden = false;
  menu.innerHTML = hiddenButtons.map(btn => {
    const filter = btn.dataset.filter;
    const active = filter === activeFilter ? " active" : "";
    return `<button type="button" role="option" class="task-tabs-more-item${active}" data-filter="${filter}">${btn.innerHTML}</button>`;
  }).join("");

  if (hiddenButtons.some(btn => btn.dataset.filter === activeFilter)) {
    moreBtn.classList.add("has-active");
  }
}

function openTaskDialog(task = null, options = {}) {
  state.editingTaskId = task?.id || null;
  state.taskSubtaskDrafts = [];
  const followUpDraft = options.mode === "followUp";
  const successorDraft = options.mode === "successor";
  const parentReview = options.mode === "parentReview";
  const setupIncomplete = options.mode === "setupIncomplete" || isSetupIncompleteTask(task);
  if (parentReview) {
    parentReviewAdvanceOnClose = true;
  } else if (followUpDraft || successorDraft) {
    parentReviewAdvanceOnClose = false;
  } else {
    pendingParentReviewQueue = [];
    parentReviewAdvanceOnClose = false;
    parentReviewResumeTaskId = null;
    parentReviewPausedForFollowUp = false;
  }
  el.taskEditForm?.classList.toggle("follow-up-draft", followUpDraft || successorDraft || parentReview || setupIncomplete);
  if (el.followUpDraftHint) {
    if (parentReview) {
      const left = Number(options.queueLeft) || 0;
      el.followUpDraftHint.textContent = left
        ? `请补充上级任务（也可继续完善其余字段）。保存或关闭后将打开下一条，还剩 ${left} 条。`
        : "请补充上级任务（也可继续完善其余字段）。这是批量创建的最后一条。";
      el.followUpDraftHint.classList.remove("hidden");
    } else if (setupIncomplete) {
      el.followUpDraftHint.textContent = "截图识别只创建了名称。请补充上级、目标时间等信息后保存，黄色感叹号会消失。";
      el.followUpDraftHint.classList.remove("hidden");
    } else if (followUpDraft) {
      el.followUpDraftHint.textContent = "请确认待办名称与目标完成日期，并补充背景说明。上级任务已与关闭任务保持一致。";
      el.followUpDraftHint.classList.remove("hidden");
    } else if (successorDraft) {
      el.followUpDraftHint.textContent = "已继承原任务的优先级与上级。默认是一般后续任务；若只需提醒、不排投入，请勾选「仅关注」。";
      el.followUpDraftHint.classList.remove("hidden");
    } else {
      el.followUpDraftHint.classList.add("hidden");
    }
  }
  el.taskTitleField?.classList.toggle("follow-up-focus", followUpDraft || successorDraft);
  el.taskDueDateField?.classList.toggle("follow-up-focus", followUpDraft || successorDraft || setupIncomplete);
  el.businessBackgroundLabel?.classList.toggle("follow-up-focus", followUpDraft || successorDraft);
  el.taskParentField?.classList.toggle("follow-up-focus", parentReview || setupIncomplete || followUpDraft || successorDraft);
  el.taskParentCombobox?.classList.toggle("follow-up-focus", parentReview || setupIncomplete || followUpDraft || successorDraft);
  el.taskDialogEyebrow.textContent = followUpDraft
    ? "FOLLOW-UP"
    : successorDraft
      ? "SUCCESSOR"
      : parentReview
        ? "补充上级"
        : setupIncomplete
          ? "待完善"
          : (task ? "EDIT TASK" : "NEW TASK");
  el.taskDialogTitle.textContent = followUpDraft
    ? "完善备忘提醒"
    : successorDraft
      ? "完善后续任务"
      : parentReview
        ? "补充上级任务"
        : setupIncomplete
          ? "完善待办信息"
          : (task ? "编辑待办" : "新建待办");
  el.taskAiDropzone?.classList.toggle("hidden", Boolean(task) || followUpDraft || successorDraft || parentReview || setupIncomplete);
  setTaskAiDropzoneStatus("");
  if (el.taskCreateKind) {
    el.taskCreateKind.value = options.createKind === "meeting" ? "meeting" : "task";
  }
  if (el.taskMeetingEndDateTime) el.taskMeetingEndDateTime.value = "";
  el.taskTitleInput.value = TaskStatusPolicy.listDisplayTitle?.(task?.title || options.presetTitle || "")
    || task?.title
    || options.presetTitle
    || "";
  setTaskDueDateTime(task?.dueDate || "", task?.dueTime || "");
  el.taskOwner.value = task?.owner || (options.createKind === "meeting" ? "" : "我");
  const isMonthly = task?.recurrence?.frequency === "monthly" || task?.priority === "monthly_fixed";
  // 「跟踪关注」已从优先级下拉移除；仅关注改由任务状态「待跟踪」/后续窗勾选表达。
  const rawPriority = isMonthly ? "monthly_fixed" : (task?.priority || "general_daily");
  el.taskPriority.value = rawPriority === "follow_up" ? "general_daily" : rawPriority;
  syncMonthlyRecurringFromPriority();
  el.taskProgress.value = task?.progress || 0;
  el.taskProgressValue.textContent = `${task?.progress || 0}%`;
  if (task?.id) refreshTaskStatusForId(task.id);
  const statusTask = task?.id ? (findTask(task.id)?.task || task) : task;
  const meetingCreate = options.createKind === "meeting" || el.taskCreateKind?.value === "meeting";
  // 仅关注 = 待跟踪的唯一入口（任务表单显示；会议隐藏）
  el.taskFollowUpOption?.classList.toggle("hidden", meetingCreate);
  if (el.taskFollowUpTracking) {
    if (followUpDraft) {
      el.taskFollowUpTracking.checked = true;
    } else if (successorDraft) {
      // 后续默认一般任务：继承原优先级/上级；需要备忘时再勾选
      el.taskFollowUpTracking.checked = TaskStatusPolicy.isTrackingStatus(task);
    } else {
      el.taskFollowUpTracking.checked = TaskStatusPolicy.isTrackingStatus(statusTask)
        || statusTask?.priority === "follow_up";
    }
  }
  const statusForUi = (TaskStatusPolicy.isTrackingStatus(statusTask) || statusTask?.priority === "follow_up"
    || Boolean(el.taskFollowUpTracking?.checked))
    ? { ...statusTask, status: TaskStatusPolicy.TRACKING_STATUS }
    : statusTask;
  restoreTaskStatusOptions(statusForUi);
  if (!meetingCreate) syncAttentionMode("checkbox");
  el.taskActualStart.value = toLocalDateTimeInput(statusTask?.startOverrideAt || statusTask?.startedAt);
  el.taskActualEnd.value = toLocalDateTimeInput(statusTask?.completedAt);
  // UI merges background / reason / description; originals stay in data until user saves.
  el.taskBusinessBackground.value = mergeTaskContextText(task);
  el.taskProblemReason.value = task?.problemReason || "";
  el.taskDeliveryNote.value = task?.deliveryNote || "";
  el.taskDescription.value = task?.description || "";
  el.taskRecurringUntil.value = task?.recurrence?.until || defaultRecurringUntil(task?.dueDate || state.selectedDate);
  fillParentOptions(task);
  const parentId = task?.parentId || task?.parentTaskId || task?.parentTask || task?.parent || "";
  if (parentId) chooseTaskParentOption(parentId);
  else {
    el.taskParent.value = "";
    syncTaskParentTrigger();
  }
  el.deleteTaskButton.classList.toggle("hidden", !task);
  el.mergeTaskButton?.classList.toggle("hidden", !task);
  el.closeTaskButton.classList.toggle("hidden", !task || followUpDraft || successorDraft);
  el.closeTaskButton.textContent = task && TaskStatusPolicy.isEndedStatus(task.status) ? "恢复任务" : "关闭任务";
  // Re-apply parent after status/priority sync (combobox trigger can reset during option rebuild).
  if (parentId) chooseTaskParentOption(parentId);
  if (el.businessBackgroundLabel?.querySelector("span")) {
    el.businessBackgroundLabel.querySelector("span").textContent = (followUpDraft || successorDraft)
      ? "背景与说明（来自已关闭任务）"
      : "背景与说明";
  }
  const dueLabel = el.taskDueDateField?.querySelector("span");
  if (dueLabel) dueLabel.textContent = (followUpDraft || successorDraft) ? "目标完成日期时间" : "目标日期时间";
  el.taskDeliveryField?.classList.remove("follow-up-focus");
  const titleLabel = el.taskTitleField?.querySelector("span");
  if (titleLabel) titleLabel.textContent = (followUpDraft || successorDraft) ? "待办名称（可修改）" : "待办名称";
  updateProgressAvailability();
  updateParentRequirements();
  updateRecurringOptions();
  renderTaskSubtasks(task);
  renderTaskDetailSummary(task);
  // Keep create/edit focused on input fields: summary cards + subtasks are redundant here.
  el.taskDetailSummary?.classList.add("hidden");
  el.taskSubtasksSection?.classList.add("hidden");
  if (task || followUpDraft || successorDraft || parentReview || setupIncomplete) {
    el.taskCreateKindField?.classList.add("hidden");
    el.taskEditForm?.classList.remove("create-kind-meeting");
  } else {
    syncTaskCreateKindUi();
  }
  el.taskDialogScroll?.scrollTo?.(0, 0);
  el.taskDialog.showModal();
  setTimeout(() => {
    if (parentReview) {
      el.taskParentTrigger?.focus?.();
      el.taskParentTrigger?.click?.();
    } else if (followUpDraft || successorDraft) {
      el.taskTitleInput.focus();
      el.taskTitleInput.select?.();
    } else {
      el.taskTitleInput.focus();
    }
  }, 50);
}

function openTaskDialogForDate(dateKey) {
  state.selectedDate = dateKey;
  openTaskDialog();
  setTaskDueDateTime(dateKey, defaultWorkEndTime());
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
  if (task.followUpFromTaskId) {
    const source = findTask(task.followUpFromTaskId)?.task;
    rows.push(["跟踪来源", source?.title || task.followUpFromTaskId]);
  }
  el.taskDetailSummary.innerHTML = rows.map(([label, value]) =>
    `<div><span>${label}</span><strong>${escapeHtml(String(value))}</strong></div>`
  ).join("");
}

function fillParentOptions(editingTask) {
  state.editingParentTaskId = editingTask?.id || "";
  el.taskParent.innerHTML = `<option value="">不选择，作为顶层任务</option>`;
  const tasks = getAllTasks().map(({ task }) => task);
  TaskOptionPolicy.parentTaskOptionCandidates({
    tasks,
    editingTaskId: editingTask?.id || "",
    isHiddenFutureRecurringInstance: task => isHiddenRecurringCatalogInstance(task)
  }).forEach(task => {
    const path = TaskOptionPolicy.taskHierarchyPath({ task, tasks, separator: " › " });
    const date = task.dueDate ? task.dueDate.slice(5) : "未计划";
    el.taskParent.add(new Option(`${date} · ${path}`, task.id));
  });
  if (el.taskParentSearch) el.taskParentSearch.value = "";
  renderTaskParentOptions("");
  syncTaskParentTrigger();
}

let taskParentActiveIndex = 0;
function bindTaskParentCombobox() {
  if (!el.taskParentTrigger) return;
  el.taskParentTrigger.addEventListener("click", toggleTaskParentPopup);
  el.taskParentSearch?.addEventListener("input", () => {
    taskParentActiveIndex = 0;
    renderTaskParentOptions(el.taskParentSearch.value);
  });
  el.taskParentSearch?.addEventListener("keydown", event => {
    const options = el.taskParentOptions?.querySelectorAll('[role="option"]') || [];
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      taskParentActiveIndex = Math.max(0, Math.min(Math.max(0, options.length - 1), taskParentActiveIndex + (event.key === "ArrowDown" ? 1 : -1)));
      updateTaskParentActiveOption(options);
    } else if (event.key === "Enter" && options[taskParentActiveIndex]) {
      event.preventDefault();
      chooseTaskParentOption(options[taskParentActiveIndex].dataset.value || "");
    } else if (event.key === "Escape") {
      closeTaskParentPopup();
    }
  });
  document.addEventListener("click", event => {
    if (!el.taskParentCombobox?.contains(event.target)) closeTaskParentPopup();
  });
}

function toggleTaskParentPopup() {
  if (el.taskParentPopup?.classList.contains("hidden")) openTaskParentPopup();
  else closeTaskParentPopup();
}

function openTaskParentPopup() {
  if (!el.taskParentPopup) return;
  el.taskParentPopup.classList.remove("hidden");
  el.taskParentTrigger?.setAttribute("aria-expanded", "true");
  taskParentActiveIndex = 0;
  renderTaskParentOptions(el.taskParentSearch?.value || "");
  setTimeout(() => el.taskParentSearch?.focus(), 20);
}

function closeTaskParentPopup() {
  el.taskParentPopup?.classList.add("hidden");
  el.taskParentTrigger?.setAttribute("aria-expanded", "false");
}

function syncTaskParentTrigger() {
  if (!el.taskParentTrigger) return;
  const selectedId = el.taskParent?.value || "";
  if (!selectedId) {
    el.taskParentTrigger.textContent = "搜索并选择上级任务…";
    return;
  }
  const tasks = getAllTasks().map(({ task }) => task);
  const task = tasks.find(item => item.id === selectedId);
  if (!task) {
    el.taskParentTrigger.textContent = "搜索并选择上级任务…";
    return;
  }
  const meta = TaskOptionPolicy.hierarchyMeta({ task, tasks });
  const date = task.dueDate ? task.dueDate.slice(5) : "未计划";
  el.taskParentTrigger.textContent = `${meta.kind} · ${date} · ${meta.path}`;
}

function renderTaskParentOptions(query = "") {
  if (!el.taskParentOptions) return;
  const tasks = getAllTasks().map(({ task }) => task);
  const selectedId = el.taskParent?.value || "";
  const results = TaskOptionPolicy.parentPickerSearchCandidates({
    tasks,
    editingTaskId: state.editingParentTaskId || state.editingTaskId || "",
    selectedId,
    query,
    isHiddenFutureRecurringInstance: task => isHiddenRecurringCatalogInstance(task, { keepCurrentLinked: true, selectedId }),
    statusText: task => statusLabel(task.status),
    dateText: task => (task.dueDate ? task.dueDate.slice(5) : "未计划")
  });
  const clearSelected = !selectedId;
  const clearOption = `<button type="button" class="entry-task-option${clearSelected ? " active" : ""}" role="option" aria-selected="${clearSelected}" data-value="">
    <strong>不选择，作为顶层任务</strong>
    <span><b>顶层</b> · 不挂接上级</span>
  </button>`;
  const items = results.map(({ task, meta }) => {
    const date = task.dueDate ? task.dueDate.slice(5) : "未计划";
    const selected = selectedId === task.id;
    return `<button type="button" class="entry-task-option${selected ? " active" : ""}" role="option" aria-selected="${selected}" data-value="${escapeHtml(task.id)}" title="${escapeHtml(meta.path)}">
      <strong>${escapeHtml(task.title)}</strong>
      <span><b>第${meta.depth}层${meta.kind}</b>${meta.parentPath ? ` · ${escapeHtml(meta.parentPath)}` : ""}</span>
      <small>${escapeHtml(statusLabel(task.status))} · ${escapeHtml(date)}${selected ? " · ✓ 已选择" : ""}</small>
    </button>`;
  }).join("");
  const hint = String(query || "").trim()
    ? ""
    : `<div class="entry-task-no-results">默认只显示顶层与计划节点，输入关键词可搜索全部可挂接任务</div>`;
  el.taskParentOptions.innerHTML = clearOption + items + (results.length ? hint : `<div class="entry-task-no-results">${String(query || "").trim() ? "没有匹配的上级任务" : "暂无可挂接上级，可先创建顶层任务"}</div>`);
  el.taskParentOptions.querySelectorAll('[role="option"]').forEach(option => {
    option.addEventListener("click", () => chooseTaskParentOption(option.dataset.value || ""));
  });
  updateTaskParentActiveOption(el.taskParentOptions.querySelectorAll('[role="option"]'));
}

function updateTaskParentActiveOption(options) {
  options.forEach((option, index) => option.classList.toggle("active", index === taskParentActiveIndex));
  options[taskParentActiveIndex]?.scrollIntoView({ block: "nearest" });
}

function chooseTaskParentOption(value) {
  const exists = Array.from(el.taskParent.options).some(option => option.value === value);
  if (!exists && value) {
    const tasks = getAllTasks().map(({ task }) => task);
    const task = tasks.find(item => item.id === value);
    if (task) {
      const path = TaskOptionPolicy.taskHierarchyPath({ task, tasks, separator: " › " });
      const date = task.dueDate ? task.dueDate.slice(5) : "未计划";
      el.taskParent.add(new Option(`${date} · ${path}`, task.id));
    }
  }
  el.taskParent.value = value;
  el.taskParent.dispatchEvent(new Event("change"));
  syncTaskParentTrigger();
  closeTaskParentPopup();
  updateParentRequirements();
}

function isAttentionModeUi() {
  return !el.taskFollowUpOption?.classList.contains("hidden");
}

/**
 * 「仅关注」= 只提醒、不排工作投入（底层 status=tracking）。
 * 不在任务状态下拉里选手动「待跟踪」，避免与勾选重复。
 */
function syncAttentionMode(source = "checkbox") {
  if (syncingAttentionMode) return;
  syncingAttentionMode = true;
  try {
    const attentionUi = isAttentionModeUi();
    let attentionOnly = Boolean(el.taskFollowUpTracking?.checked);
    if (source === "status" && attentionUi) {
      attentionOnly = el.taskStatus?.value === TaskStatusPolicy.TRACKING_STATUS;
      if (el.taskFollowUpTracking) el.taskFollowUpTracking.checked = attentionOnly;
    }

    if (attentionOnly) {
      if (el.taskFollowUpTracking && attentionUi) el.taskFollowUpTracking.checked = true;
      restoreTaskStatusOptions({ status: TaskStatusPolicy.TRACKING_STATUS });
      if (el.taskStatus) el.taskStatus.value = TaskStatusPolicy.TRACKING_STATUS;
    } else {
      if (el.taskFollowUpTracking && attentionUi) el.taskFollowUpTracking.checked = false;
      const nextStatus = el.taskStatus?.value === TaskStatusPolicy.TRACKING_STATUS
        ? "planned"
        : (el.taskStatus?.value || "planned");
      restoreTaskStatusOptions({ status: nextStatus });
      if (el.taskStatus && (el.taskStatus.value === TaskStatusPolicy.TRACKING_STATUS || !el.taskStatus.value)) {
        el.taskStatus.value = "planned";
      }
    }
    updateProgressAvailability();
  } finally {
    syncingAttentionMode = false;
  }
}

function syncAttentionOnlyChoice() {
  syncAttentionMode("checkbox");
}

function removeTaskRecordById(taskId) {
  if (!taskId) return false;
  let removed = false;
  Object.keys(state.data || {}).forEach(dateKey => {
    const day = state.data[dateKey];
    if (!day?.tasks?.length) return;
    const next = day.tasks.filter(task => task.id !== taskId);
    if (next.length !== day.tasks.length) {
      day.tasks = next;
      removed = true;
    }
  });
  return removed;
}

function restoreTaskFromCloseSnapshot(sourceId, snapshot = {}) {
  if (!sourceId) return;
  updateTaskRecords(sourceId, record => {
    if (Object.prototype.hasOwnProperty.call(snapshot, "status")) record.status = snapshot.status;
    if (Object.prototype.hasOwnProperty.call(snapshot, "completedAt")) record.completedAt = snapshot.completedAt;
    if (Object.prototype.hasOwnProperty.call(snapshot, "progress")) record.progress = snapshot.progress;
    if (Object.prototype.hasOwnProperty.call(snapshot, "deliveryNote")) record.deliveryNote = snapshot.deliveryNote;
    if (Object.prototype.hasOwnProperty.call(snapshot, "startedAt")) record.startedAt = snapshot.startedAt;
    record.updatedAt = new Date().toISOString();
  });
}

function abandonPendingSuccessorRollback() {
  const pending = pendingSuccessorRollback;
  if (!pending?.sourceId || !pending?.successorId) {
    pendingSuccessorRollback = null;
    return;
  }
  pendingSuccessorRollback = null;
  parentReviewPausedForFollowUp = false;
  restoreTaskFromCloseSnapshot(pending.sourceId, pending.snapshot || {});
  removeTaskRecordById(pending.successorId);
  saveData();
  render();
  showToast("已取消关闭并新建后续，原任务保持未关闭");
}

function saveMeetingFromCreateDialog() {
  el.taskEditForm.querySelectorAll(".field-error").forEach(field => field.classList.remove("field-error"));
  const title = el.taskTitleInput.value.trim();
  if (!title) return showTaskFieldError(el.taskTitleInput, "请填写会议名称");
  ensureMeetingEndDefault();
  const startParts = parseDateTimeLocalParts(el.taskDueDateTime?.value || "");
  const endParts = parseDateTimeLocalParts(el.taskMeetingEndDateTime?.value || "");
  if (!startParts.dateKey || startParts.hour == null) {
    return showTaskFieldError(el.taskDueDateTime, "请填写开始日期时间");
  }
  if (!endParts.dateKey || endParts.hour == null) {
    return showTaskFieldError(el.taskMeetingEndDateTime, "请填写结束日期时间");
  }
  if (endParts.dateKey !== startParts.dateKey) {
    return showTaskFieldError(el.taskMeetingEndDateTime, "会议开始与结束需在同一天");
  }
  const start = Math.max(0, Math.min(21, startParts.hour));
  let end = Math.max(0, Math.min(22, endParts.hour));
  if (endParts.minute > 0 && end < 22) end = Math.min(22, end + 1);
  if (end <= start) return showTaskFieldError(el.taskMeetingEndDateTime, "结束时间必须晚于开始时间");
  const dateKey = startParts.dateKey || state.selectedDate;
  const taskId = String(el.taskParent?.value || "").trim();
  if (taskId) {
    const linked = findTask(taskId)?.task;
    if (!linked || !TodoListPolicy.canLinkEntryToTask(linked, hasChildTasks)) {
      return showTaskFieldError(el.taskParentTrigger || el.taskParent, "只能关联叶子待办");
    }
  }
  const entry = {
    id: crypto.randomUUID(),
    title: title.slice(0, 80),
    entryType: "calendar",
    start,
    end,
    owner: (el.taskOwner?.value || "").trim().slice(0, 80),
    note: (el.taskBusinessBackground?.value || "").trim().slice(0, 800),
    color: "amber",
    taskId
  };
  getDay(dateKey).entries.push(entry);
  if (taskId) {
    refreshTaskStatusForId(taskId);
    if (entry.note) updateTaskRecords(taskId, task => { task.updatedAt = new Date().toISOString(); });
    focusLinkedTaskFilter(taskId);
  }
  state.listKind = "meeting";
  state.meetingFilter = "all";
  state.taskSubtaskDrafts = [];
  saveData();
  el.taskDialog.close();
  render();
  showToast("会议已添加");
}

function saveTask() {
  el.taskEditForm.querySelectorAll(".field-error").forEach(field => field.classList.remove("field-error"));
  if (isCreateMeetingKind()) return saveMeetingFromCreateDialog();
  if (isAttentionModeUi()) syncAttentionMode("checkbox");
  syncMonthlyRecurringFromPriority();
  const editing = state.editingTaskId ? findTask(state.editingTaskId) : null;
  const monthlySelected = isMonthlyPrioritySelected();
  const dueParts = getTaskDueParts();
  const attentionOnly = isAttentionModeUi() && Boolean(el.taskFollowUpTracking?.checked);
  const payload = {
    title: TaskStatusPolicy.stripTrackingTitleSuffix?.(el.taskTitleInput.value.trim())
      || el.taskTitleInput.value.trim(),
    dueDate: dueParts.dueDate,
    dueTime: dueParts.dueTime,
    owner: el.taskOwner.value.trim() || "未指定",
    parentId: el.taskParent.value,
    // 仅关注只改状态；优先级保持用户选择（后续默认继承原任务）
    priority: resolvePersistedPriority(monthlySelected, editing?.task),
    progress: Number(el.taskProgress.value),
    status: attentionOnly ? TaskStatusPolicy.TRACKING_STATUS : el.taskStatus.value,
    startedAt: fromLocalDateTimeInput(el.taskActualStart.value),
    startOverrideAt: fromLocalDateTimeInput(el.taskActualStart.value),
    completedAt: fromLocalDateTimeInput(el.taskActualEnd.value),
    businessBackground: el.taskBusinessBackground.value.trim().slice(0, 800),
    // Consolidated into businessBackground on save so reopen won't duplicate.
    problemReason: "",
    // Keep historical deliveryNote; deliverables are edited as child tasks in UI.
    deliveryNote: editing?.task?.deliveryNote || el.taskDeliveryNote?.value.trim() || "",
    recurrence: monthlySelected ? {
      frequency: "monthly",
      dayOfMonth: dueParts.dueDate ? Number(dueParts.dueDate.slice(-2)) : null,
      until: el.taskRecurringUntil.value
    } : null,
    description: ""
  };
  if (!payload.title) return showTaskFieldError(el.taskTitleInput, "请填写待办名称");
  if (payload.parentId && state.editingTaskId) {
    const tasks = getAllTasks().map(({ task }) => task);
    const invalidParentIds = new Set([state.editingTaskId, ...TaskOptionPolicy.descendantTaskIds({ tasks, parentId: state.editingTaskId })]);
    if (invalidParentIds.has(payload.parentId)) return showTaskFieldError(el.taskParent, "不能选择自己或下级任务作为上级");
  }
  if (payload.dueTime && !payload.dueDate) return showTaskFieldError(el.taskDueDateTime, "填写目标时间时，请同时选择目标日期");
  if (payload.dueDate && !payload.dueTime) payload.dueTime = defaultWorkEndTime();
  if (payload.recurrence && !payload.dueDate) return showTaskFieldError(el.taskDueDateTime, "每月例行任务需要选择首次目标日期");
  if (payload.recurrence && !payload.recurrence.until) {
    return showTaskFieldError(el.taskRecurringUntil, "请选择月度规则有效至哪个月");
  }
  if (payload.recurrence && payload.recurrence.until < payload.dueDate.slice(0, 7)) {
    return showTaskFieldError(el.taskRecurringUntil, "结束月份不能早于首次截止月份");
  }
  if (payload.completedAt) {
    payload.status = "done";
    payload.progress = 100;
  } else if (!TaskStatusPolicy.isEndedStatus(payload.status)) {
    // Do not keep forcing tracking just because the stored task was tracking —
    // user may convert 仅关注 → 一般任务 in this save.
    if (attentionOnly || payload.status === TaskStatusPolicy.TRACKING_STATUS) {
      payload.status = TaskStatusPolicy.TRACKING_STATUS;
    } else {
      payload.status = getAutomaticTaskStatusForPayload(state.editingTaskId, payload);
    }
  }
  const effectiveStartedAt = payload.startedAt || getTaskScheduleInfo(state.editingTaskId)?.firstStartIso || "";
  if (payload.completedAt && effectiveStartedAt && new Date(payload.completedAt) < new Date(effectiveStartedAt)) {
    return showTaskFieldError(el.taskActualEnd, "实际完成时间不能早于实际开始时间");
  }
  if (payload.status === "in_progress" && !payload.startedAt) payload.startedAt = getTaskScheduleInfo(state.editingTaskId)?.firstStartIso || new Date().toISOString();
  if (["done", "closed"].includes(payload.status) && !payload.completedAt) payload.completedAt = new Date().toISOString();
  if (["done", "closed"].includes(payload.status) && !payload.startedAt) payload.startedAt = effectiveStartedAt;
  if (payload.status === "done") payload.progress = 100;
  if (payload.status === "planned" || payload.status === TaskStatusPolicy.TRACKING_STATUS) payload.progress = 0;

  let parentIdForChildren = state.editingTaskId;
  if (state.editingTaskId) {
    const found = findTask(state.editingTaskId);
    if (!found) return;
    if (!["done", "closed"].includes(payload.status)) payload.completedAt = "";
    Object.assign(found.task, payload);
    found.task.setupIncomplete = false;
    found.task.updatedAt = new Date().toISOString();
    const targetTaskDate = payload.dueDate || found.dateKey || state.selectedDate;
    if (found.dateKey !== targetTaskDate) {
      state.data[found.dateKey].tasks = state.data[found.dateKey].tasks.filter(item => item.id !== found.task.id);
      getDay(targetTaskDate).tasks.push(found.task);
    }
    parentIdForChildren = found.task.id;
  } else {
    const newTasks = buildRecurringTasks(payload);
    newTasks.forEach(task => getDay(task.dueDate || state.selectedDate).tasks.push(task));
    parentIdForChildren = newTasks[0]?.id || "";
  }
  createDraftChildTasks(parentIdForChildren, payload.dueDate || state.selectedDate);
  state.taskSubtaskDrafts = [];
  if (pendingSuccessorRollback && state.editingTaskId === pendingSuccessorRollback.successorId) {
    successorDialogCommitted = true;
    pendingSuccessorRollback = null;
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
  const allTasks = getAllTasks().map(({ task }) => task);
  const isActive = task => task.status === "in_progress";
  const hasInvestedWork = task => !isMemoReminderTask(task) && (taskHasWorkHistory(task.id) || getTaskDuration(task.id) > 0);
  const activeTasks = TodoListPolicy.progressReviewCandidates({
    tasks: allTasks,
    hasChildTasks,
    isActive,
    hasInvestedWork,
    sortBy: (a, b) => `${a.dueDate || ""} ${a.dueTime || ""}`.localeCompare(`${b.dueDate || ""} ${b.dueTime || ""}`)
      || String(a.title || "").localeCompare(String(b.title || ""))
  });

  el.progressReviewList.innerHTML = "";
  if (!activeTasks.length) {
    el.progressReviewList.innerHTML = `<div class="empty-state">当前没有可更新进度的明细任务<br>请把叶子待办拖入日程产生实际投入后，再来这里填写进度</div>`;
    el.progressReviewForm.querySelector('button[type="submit"]').disabled = true;
  } else {
    el.progressReviewForm.querySelector('button[type="submit"]').disabled = false;
    activeTasks.forEach(task => {
      const parentPath = TaskOptionPolicy.hierarchyMeta({ task, tasks: allTasks }).parentPath;
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
              ${parentPath ? `<span>归属：${escapeHtml(parentPath)}</span>` : ""}
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
  const pending = pendingSuccessorRollback?.successorId === found.task.id
    ? pendingSuccessorRollback
    : null;
  if (pending) {
    successorDialogCommitted = true;
    pendingSuccessorRollback = null;
    parentReviewPausedForFollowUp = false;
    restoreTaskFromCloseSnapshot(pending.sourceId, pending.snapshot || {});
  }
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
  showToast(pending
    ? "已取消后续并恢复原任务为未关闭"
    : "待办已删除，原有日程记录已保留");
}

function cancelEditingEntry() {
  if (!state.editingEntryId) return;
  const dateKey = state.editingEntryDateKey || state.selectedDate;
  const day = getDay(dateKey);
  const deleted = day.entries.find(entry => entry.id === state.editingEntryId);
  if (!deleted) {
    showToast("未找到要取消的日程");
    return;
  }
  day.entries = day.entries.filter(entry => entry.id !== state.editingEntryId);
  if (deleted?.taskId) {
    const linked = findTask(deleted.taskId)?.task;
    if (linked && !["done", "closed"].includes(linked.status)) {
      applyAutomaticTaskStatus(linked);
      linked.updatedAt = new Date().toISOString();
    }
  }
  state.editingEntryId = null;
  state.editingEntryDateKey = null;
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
  // Week view sets an inline column count; clear it so day/month/project regain CSS layout.
  el.timeline.style.gridTemplateColumns = "";
  el.timeline.style.minHeight = "";
  if (state.taskView !== "project") {
    el.projectGanttScroll = null;
    el.projectGanttChartTrack = null;
    el.projectGanttDaysTrack = null;
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
    const title = String(entry.title || "").trim();
    if (!TodoListPolicy.hasDisplayTitle(title)) return;
    const key = TodoListPolicy.normalizeTitle(title);
    const current = groups.get(key) || { title, entries: [], totalHours: 0 };
    current.entries.push({ dateKey, entry });
    current.totalHours += getEntryInvestedHours(dateKey, entry);
    groups.set(key, current);
  });
  return [...groups.values()].sort((a, b) => a.title.localeCompare(b.title, "zh-CN"));
}

function appendGanttRowPair(labelContainer, chartContainer, pair) {
  if (!pair?.labelRow || !pair?.chartRow) return;
  labelContainer.appendChild(pair.labelRow);
  chartContainer.appendChild(pair.chartRow);
}

function appendGanttGroupHeading(labelContainer, chartContainer, group, onToggle) {
  const collapsed = state.ganttCollapsedGroups.has(group.status);
  const depth = Math.max(0, Number(group.depth) || 0);
  const heading = document.createElement("button");
  heading.className = "project-gantt-group-heading";
  heading.type = "button";
  heading.style.setProperty("--group-depth", String(depth));
  heading.dataset.depth = String(depth);
  heading.innerHTML = `<strong><i>${collapsed ? "▸" : "▾"}</i>${escapeHtml(group.label)}</strong><span>${group.count} 项</span>`;
  heading.addEventListener("click", onToggle);
  labelContainer.appendChild(heading);
  const spacer = document.createElement("div");
  spacer.className = "project-gantt-group-chart-spacer";
  spacer.style.setProperty("--group-depth", String(depth));
  spacer.dataset.depth = String(depth);
  chartContainer.appendChild(spacer);
  return !collapsed;
}

function getSavedGanttArrangeConfig() {
  if (!state.ganttArrangeConfig) {
    state.ganttArrangeConfig = typeof GanttArrangePolicy?.loadConfig === "function"
      ? GanttArrangePolicy.loadConfig()
      : null;
  }
  return state.ganttArrangeConfig || GanttArrangePolicy?.defaultConfig?.() || {
    dimensions: [
      { id: "taskTree", enabled: true },
      { id: "taskStatus", enabled: true },
      { id: "owner", enabled: false },
      { id: "priority", enabled: false }
    ],
    treeDepth: null
  };
}

function getGanttArrangeConfig() {
  if (state.ganttArrangePreview) {
    return typeof GanttArrangePolicy?.normalizeConfig === "function"
      ? GanttArrangePolicy.normalizeConfig(state.ganttArrangePreview)
      : state.ganttArrangePreview;
  }
  return getSavedGanttArrangeConfig();
}

function saveGanttArrangeConfig(config) {
  state.ganttArrangePreview = null;
  state.ganttArrangeConfig = typeof GanttArrangePolicy?.saveConfig === "function"
    ? GanttArrangePolicy.saveConfig(config)
    : config;
  return state.ganttArrangeConfig;
}

function meetingPhaseBucket(meeting) {
  const now = new Date();
  const phases = (meeting?.entries || []).map(({ dateKey, entry }) => getMeetingPhase({
    dateKey,
    start: entry?.start,
    end: entry?.end
  }, now));
  if (phases.includes("in_progress")) return "in_progress";
  if (phases.length && phases.every(phase => phase === "ended")) return "ended";
  if (phases.includes("planned")) return "planned";
  return "planned";
}

function buildMeetingArrangeRows(meetings = []) {
  return meetings.map(meeting => {
    const owners = [...new Set(
      (meeting.entries || [])
        .map(({ entry }) => String(entry?.owner || "").trim())
        .filter(Boolean)
    )];
    const phase = meetingPhaseBucket(meeting);
    const status = phase === "ended" ? "done" : phase;
    return {
      kind: "meeting",
      meeting,
      task: {
        id: `meeting:${TodoListPolicy.normalizeTitle(meeting.title)}`,
        title: meeting.title,
        status,
        owner: owners[0] || "未指定",
        priority: "general_daily"
      },
      rootId: "",
      isParent: false,
      depth: 0,
      projectStatus: phase,
      projectStatusLabel: "",
      descendantTasks: [],
      progress: null,
      collapsed: false
    };
  });
}

function buildGanttArrangeSections(projects, meetings = []) {
  const meetingRows = buildMeetingArrangeRows(meetings);
  if (typeof GanttArrangePolicy?.buildSections !== "function") {
    const taskSections = projectStatusGroups(projects)
      .filter(group => group.projects.length)
      .map(group => ({
        key: group.status,
        status: group.status,
        label: group.label,
        rows: group.projects.flatMap(project => {
          const progress = ProjectSummaryPolicy.projectProgressPercent(project);
          if (ProjectCollapsePolicy.shouldRenderSingleRow(project)) {
            return [{ task: project.parent, rootId: project.parent.id, isParent: false, progress }];
          }
          const sectionCollapsed = state.projectCollapsedSections.has(project.parent.id);
          const rows = [{
            task: project.parent,
            rootId: project.parent.id,
            isParent: true,
            progress,
            collapsed: sectionCollapsed,
            projectStatusLabel: projectStatusLabel(project.status)
          }];
          if (!sectionCollapsed) {
            ProjectCollapsePolicy.visibleTreeItems({
              tasks: project.children,
              collapsedIds: state.projectCollapsedTasks
            }).forEach(task => rows.push({
              task,
              rootId: project.parent.id,
              isParent: false,
              progress: null
            }));
          }
          return rows;
        })
      }));
    if (!meetingRows.length) return taskSections;
    const byStatus = new Map(taskSections.map(section => [section.status, section]));
    meetingRows.forEach(row => {
      const key = row.projectStatus || "planned";
      if (!byStatus.has(key)) {
        const section = {
          key,
          status: key,
          label: GanttArrangePolicy?.statusLabel?.(key) || key,
          rows: []
        };
        byStatus.set(key, section);
        taskSections.push(section);
      }
      byStatus.get(key).rows.push(row);
    });
    return taskSections.filter(section => section.rows.length);
  }
  const progressByRoot = new Map(
    projects.map(project => [project.parent.id, ProjectSummaryPolicy.projectProgressPercent(project)])
  );
  const decorateRows = rows => (rows || []).map(row => ({
    ...row,
    progress: row.kind === "meeting"
      ? null
      : (row.isParent ? (progressByRoot.get(row.rootId) ?? null) : null),
    collapsed: row.kind === "meeting"
      ? false
      : (row.isParent
        ? state.projectCollapsedSections.has(row.task.id)
        : state.projectCollapsedTasks.has(row.task.id))
  }));
  const decorateSection = section => ({
    ...section,
    rows: decorateRows(section.rows),
    children: (section.children || []).map(decorateSection)
  });
  return GanttArrangePolicy.buildSections({
    projects,
    config: getGanttArrangeConfig(),
    collapsedSections: state.projectCollapsedSections,
    collapsedTasks: state.projectCollapsedTasks,
    visibleTreeItems: args => ProjectCollapsePolicy.visibleTreeItems(args),
    shouldRenderSingleRow: project => ProjectCollapsePolicy.shouldRenderSingleRow(project),
    classifyProjectStatus: tasks => ProjectSummaryPolicy.classifyProjectStatus(tasks),
    getChildTasks,
    extraRows: meetingRows
  }).map(decorateSection);
}

function bindGanttArrangePanel(toolbar) {
  if (state.ganttArrangeAbort) state.ganttArrangeAbort.abort();
  state.ganttArrangeAbort = new AbortController();
  const { signal } = state.ganttArrangeAbort;
  // 面板曾挂到 body，重绘时可能留下无监听的孤儿层
  document.querySelectorAll("body > .gantt-arrange-panel").forEach(node => node.remove());
  const wrap = document.createElement("div");
  wrap.className = "gantt-arrange-wrap";
  const keepOpen = Boolean(state.ganttArrangeKeepOpen);
  state.ganttArrangeKeepOpen = false;
  const initial = keepOpen && state.ganttArrangePreview
    ? state.ganttArrangePreview
    : getSavedGanttArrangeConfig();
  wrap.innerHTML = `
    <button type="button" class="gantt-arrange-button" aria-expanded="false" aria-haspopup="true">排列</button>
    <div class="gantt-arrange-panel" hidden>
      <strong>显示字段（可勾选 / 调整顺序）</strong>
      <ul class="gantt-arrange-list"></ul>
      <label class="gantt-arrange-depth">展开深度
        <select data-arrange-depth>
          <option value="all">全部</option>
          <option value="0">仅顶层</option>
          <option value="1">到第 1 层</option>
          <option value="2">到第 2 层</option>
          <option value="3">到第 3 层</option>
        </select>
      </label>
      <div class="gantt-arrange-actions">
        <button type="button" class="soft-button" data-arrange-reset>恢复默认</button>
        <button type="button" class="primary-button" data-arrange-apply>应用</button>
      </div>
    </div>`;
  const button = wrap.querySelector(".gantt-arrange-button");
  const panel = wrap.querySelector(".gantt-arrange-panel");
  const list = wrap.querySelector(".gantt-arrange-list");
  const depthSelect = panel.querySelector("[data-arrange-depth]");
  const resetButton = panel.querySelector("[data-arrange-reset]");
  const applyButton = panel.querySelector("[data-arrange-apply]");
  let draft = GanttArrangePolicy.normalizeConfig(initial);

  const renderList = () => {
    list.innerHTML = draft.dimensions.map((dim, index) => {
      const meta = GanttArrangePolicy.dimensionMeta(dim.id);
      return `<li data-dim-id="${dim.id}">
        <label><input type="checkbox" data-dim-enabled ${dim.enabled ? "checked" : ""}/> ${escapeHtml(meta.label)}</label>
        <span class="gantt-arrange-move">
          <button type="button" data-move="-1" ${index === 0 ? "disabled" : ""} aria-label="上移">↑</button>
          <button type="button" data-move="1" ${index === draft.dimensions.length - 1 ? "disabled" : ""} aria-label="下移">↓</button>
        </span>
      </li>`;
    }).join("");
    depthSelect.value = draft.treeDepth == null ? "all" : String(draft.treeDepth);
  };
  renderList();

  const positionPanel = () => {
    const rect = button.getBoundingClientRect();
    const width = Math.min(340, Math.max(280, window.innerWidth - 24));
    let left = Math.round(rect.left);
    left = Math.min(left, Math.max(8, window.innerWidth - width - 8));
    let top = Math.round(rect.bottom + 6);
    panel.style.position = "fixed";
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
    panel.style.width = `${width}px`;
    panel.style.right = "auto";
    panel.style.zIndex = "6000";
    requestAnimationFrame(() => {
      const panelRect = panel.getBoundingClientRect();
      if (panelRect.bottom > window.innerHeight - 8) {
        panel.style.top = `${Math.max(8, Math.round(rect.top - panelRect.height - 6))}px`;
      }
    });
  };
  const closePanel = () => {
    panel.hidden = true;
    button.setAttribute("aria-expanded", "false");
    if (panel.parentElement === document.body && wrap) wrap.appendChild(panel);
  };
  const showPanel = () => {
    document.body.appendChild(panel);
    panel.hidden = false;
    positionPanel();
    button.setAttribute("aria-expanded", "true");
  };
  const previewDraft = () => {
    state.ganttArrangePreview = GanttArrangePolicy.normalizeConfig(draft);
    state.ganttArrangeKeepOpen = true;
    renderSchedule();
  };
  const discardAndClose = () => {
    const hadPreview = Boolean(state.ganttArrangePreview);
    state.ganttArrangePreview = null;
    state.ganttArrangeKeepOpen = false;
    draft = GanttArrangePolicy.normalizeConfig(getSavedGanttArrangeConfig());
    renderList();
    closePanel();
    if (hadPreview) renderSchedule();
  };
  const openPanel = () => {
    state.ganttArrangePreview = null;
    draft = GanttArrangePolicy.normalizeConfig(getSavedGanttArrangeConfig());
    renderList();
    showPanel();
  };
  const applyDraft = () => {
    state.ganttArrangeKeepOpen = false;
    saveGanttArrangeConfig(draft);
    closePanel();
    renderSchedule();
  };

  button.addEventListener("click", event => {
    event.stopPropagation();
    if (panel.hidden) openPanel();
    else discardAndClose();
  });
  document.addEventListener("pointerdown", event => {
    if (panel.hidden) return;
    if (wrap.contains(event.target) || panel.contains(event.target)) return;
    discardAndClose();
  }, { signal });
  window.addEventListener("keydown", event => {
    if (panel.hidden || event.key !== "Escape") return;
    event.preventDefault();
    discardAndClose();
  }, { signal });
  window.addEventListener("resize", () => {
    if (!panel.hidden) positionPanel();
  }, { signal });
  list.addEventListener("click", event => {
    const moveBtn = event.target.closest("[data-move]");
    if (!moveBtn) return;
    event.preventDefault();
    event.stopPropagation();
    const item = moveBtn.closest("[data-dim-id]");
    const id = item?.dataset.dimId;
    const delta = Number(moveBtn.dataset.move);
    const index = draft.dimensions.findIndex(dim => dim.id === id);
    const next = index + delta;
    if (index < 0 || next < 0 || next >= draft.dimensions.length) return;
    const copy = draft.dimensions.slice();
    const [row] = copy.splice(index, 1);
    copy.splice(next, 0, row);
    draft = { ...draft, dimensions: copy };
    renderList();
    previewDraft();
  });
  list.addEventListener("change", event => {
    const input = event.target.closest("[data-dim-enabled]");
    if (!input) return;
    const id = input.closest("[data-dim-id]")?.dataset.dimId;
    draft = {
      ...draft,
      dimensions: draft.dimensions.map(dim => dim.id === id ? { ...dim, enabled: input.checked } : dim)
    };
    previewDraft();
  });
  depthSelect.addEventListener("change", () => {
    draft = {
      ...draft,
      treeDepth: depthSelect.value === "all" ? null : Number(depthSelect.value)
    };
    previewDraft();
  });
  resetButton?.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    draft = GanttArrangePolicy.defaultConfig();
    applyDraft();
  });
  applyButton?.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    applyDraft();
  });
  panel.addEventListener("pointerdown", event => event.stopPropagation());
  panel.addEventListener("click", event => event.stopPropagation());
  toolbar.querySelector(".project-gantt-toolbar-main")?.appendChild(wrap);
  if (keepOpen) requestAnimationFrame(() => showPanel());
}

function renderProjectSchedule() {
  const allProjects = getProjectSummaries();
  // Gantt shows every status group by default; left-panel status tabs do not apply here.
  const projects = ProjectCollapsePolicy.filterProjectsForStatus(allProjects, "all");
  const meetings = getCalendarMeetingSummaries();
  el.timeline.innerHTML = "";
  el.timeline.className = "project-gantt";
  if (!projects.length && !meetings.length) {
    el.projectGanttScroll = null;
    el.projectGanttChartTrack = null;
    el.projectGanttDaysTrack = null;
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
  bindGanttArrangePanel(toolbar);
  el.projectGanttChrome.innerHTML = "";
  el.projectGanttChrome.appendChild(toolbar);
  el.projectGanttChrome.classList.remove("hidden");

  const ganttRoot = document.createElement("div");
  ganttRoot.className = "project-gantt-root";
  const labelWidthCss = `${getGanttLabelWidth()}px`;

  const headerSplit = document.createElement("div");
  headerSplit.className = "project-gantt-header-split";
  headerSplit.style.setProperty("--gantt-label-width", labelWidthCss);

  const labelHeader = document.createElement("div");
  labelHeader.className = "project-gantt-label-header";
  labelHeader.textContent = "项目 / 任务";

  const headerResize = document.createElement("div");
  headerResize.className = "project-gantt-resize-handle";
  headerResize.title = "拖动调整任务栏宽度";
  headerResize.setAttribute("role", "separator");
  headerResize.setAttribute("aria-orientation", "vertical");
  headerResize.setAttribute("aria-label", "调整甘特任务栏宽度");

  const daysViewport = document.createElement("div");
  daysViewport.className = "project-gantt-days-viewport";
  const daysTrack = document.createElement("div");
  daysTrack.className = "project-gantt-days-track";
  el.projectGanttDaysTrack = daysTrack;
  const header = document.createElement("div");
  header.className = "project-gantt-days";
  const ganttBucketWidth = state.projectScale === "day" ? 44 : 72;
  header.style.gridTemplateColumns = `repeat(${buckets.length}, ${ganttBucketWidth}px)`;
  const todayBucketKey = projectBucketKey(toDateKey(new Date()), state.projectScale);
  const todayOffset = taskTimelineOffset(toDateKey(new Date()), buckets, state.projectScale);
  header.innerHTML = `${todayOffset === null ? "" : `<u class="gantt-today-line" style="left:${todayOffset}%" title="今天"></u>`}${buckets.map(bucket => `<span${bucket.key === todayBucketKey ? " class=\"is-today\"" : ""}>${bucket.label}</span>`).join("")}`;
  const ganttContentWidth = buckets.length * ganttBucketWidth;
  header.style.width = `${ganttContentWidth}px`;
  daysTrack.style.width = `${ganttContentWidth}px`;
  daysTrack.appendChild(header);
  daysViewport.appendChild(daysTrack);
  headerSplit.append(labelHeader, headerResize, daysViewport);

  const rowsWrap = document.createElement("div");
  rowsWrap.className = "project-gantt-rows-wrap";

  const split = document.createElement("div");
  split.className = "project-gantt-split";
  split.style.setProperty("--gantt-label-width", labelWidthCss);
  bindGanttLabelResize(headerResize, [headerSplit, split]);

  const labelPane = document.createElement("div");
  labelPane.className = "project-gantt-label-pane";
  const labelBody = document.createElement("div");
  labelBody.className = "project-gantt-label-body";
  labelPane.appendChild(labelBody);

  const resizeHandle = document.createElement("div");
  resizeHandle.className = "project-gantt-resize-handle";
  resizeHandle.title = "拖动调整任务栏宽度";
  resizeHandle.setAttribute("role", "separator");
  resizeHandle.setAttribute("aria-orientation", "vertical");
  resizeHandle.setAttribute("aria-label", "调整甘特任务栏宽度");
  bindGanttLabelResize(resizeHandle, [headerSplit, split]);

  const chartPane = document.createElement("div");
  chartPane.className = "project-gantt-chart-pane";

  const chartTrack = document.createElement("div");
  chartTrack.className = "project-gantt-chart-track";
  el.projectGanttChartTrack = chartTrack;
  chartTrack.style.width = `${ganttContentWidth}px`;

  const body = document.createElement("div");
  body.className = "project-gantt-body";
  body.style.width = `${ganttContentWidth}px`;

  const ganttSections = buildGanttArrangeSections(projects, meetings);
  const appendSectionRows = (rows, labelGroup, chartGroup, indentBase = 0) => {
    (rows || []).forEach(row => {
      if (row.kind === "meeting") {
        appendGanttRowPair(
          labelGroup,
          chartGroup,
          createCalendarGanttRow(row.meeting, buckets, state.projectScale, { indentBase })
        );
        return;
      }
      const investedDateKeys = row.isParent
        ? [row.task, ...(row.descendantTasks || [])].flatMap(task =>
          getTaskScheduleEntries(task.id)
            .filter(item => getEntryInvestedHours(item.dateKey, item.entry) > 0)
            .map(item => item.dateKey)
        )
        : undefined;
      appendGanttRowPair(labelGroup, chartGroup, createProjectGanttRow(
        row.task,
        buckets,
        state.projectScale,
        row.rootId || row.task.id,
        {
          progress: row.progress,
          investedDateKeys,
          isParent: Boolean(row.isParent),
          collapsed: Boolean(row.collapsed),
          indentBase
        }
      ));
    });
  };
  const renderArrangeSection = (group, labelParent, chartParent) => {
    const children = Array.isArray(group.children) ? group.children : [];
    const rows = Array.isArray(group.rows) ? group.rows : [];
    const count = typeof GanttArrangePolicy?.countSectionRows === "function"
      ? GanttArrangePolicy.countSectionRows(group)
      : (rows.length + children.reduce((sum, child) => sum + (child.rows?.length || 0), 0));
    if (!count) return;
    const depth = Math.max(0, Number(group.depth) || 0);
    const silent = Boolean(group.silent) || !String(group.label || "").trim();
    let expanded = true;
    if (!silent) {
      expanded = appendGanttGroupHeading(labelParent, chartParent, {
        status: group.status || group.key,
        label: group.label,
        count,
        depth
      }, () => toggleGanttGroup(group.status || group.key));
    }
    if (!expanded) return;
    if (rows.length) {
      const labelGroup = document.createElement("div");
      labelGroup.className = `project-gantt-label-group ${group.status || group.key}`;
      const chartGroup = document.createElement("section");
      chartGroup.className = `project-gantt-chart-group ${group.status || group.key}`;
      chartGroup.style.width = `${ganttContentWidth}px`;
      appendSectionRows(rows, labelGroup, chartGroup, silent ? depth : depth + 1);
      labelParent.appendChild(labelGroup);
      chartParent.appendChild(chartGroup);
    }
    children.forEach(child => renderArrangeSection(child, labelParent, chartParent));
  };
  ganttSections.forEach(group => renderArrangeSection(group, labelBody, body));

  chartTrack.appendChild(body);
  chartPane.appendChild(chartTrack);
  split.appendChild(labelPane);
  split.appendChild(resizeHandle);
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

  ganttRoot.appendChild(headerSplit);
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
  const offset = `translateX(-${next}px)`;
  if (el.projectGanttChartTrack) el.projectGanttChartTrack.style.transform = offset;
  if (el.projectGanttDaysTrack) el.projectGanttDaysTrack.style.transform = offset;
}

function setProjectScrollLeft(value) {
  const next = Math.max(0, Number(value) || 0);
  const scroller = getProjectGanttScroller();
  if (scroller) scroller.scrollLeft = next;
  state.projectScrollLeft = next;
  syncProjectGanttChartOffset(next);
}

function createProjectGanttRow(task, buckets, scale = "day", rootId = "", options = {}) {
  const taskTitle = String(task?.title || "").trim();
  if (!TodoListPolicy.hasDisplayTitle(taskTitle)) return null;
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
  const depth = getTaskDepth(task, rootId) + Math.max(0, Number(options.indentBase) || 0);
  labelRow.className = `project-gantt-row-label ${task.status}${options.isParent ? " is-parent" : ""}`;
  labelRow.style.setProperty("--task-depth", depth);
  labelRow.dataset.depth = String(depth);
  labelRow.dataset.taskId = task.id;
  labelRow.title = "拖到其他任务名称上可改挂接；双击编辑；右侧拖到日期可安排投入";
  labelRow.innerHTML = `<div class="project-gantt-title is-title-pin">
        ${hasChildren ? `<button class="project-collapse-button task-tree-toggle" type="button">${collapsed ? "▸" : "▾"}</button>` : ""}
        <strong title="${escapeHtml(taskTitle)}">${escapeHtml(taskTitle)}</strong>
      </div>`;
  bindGanttLabelReparent(labelRow, task);
  const chartRow = document.createElement("div");
  chartRow.className = `project-gantt-row-chart ${task.status}${options.isParent ? " is-parent" : ""}`;
  chartRow.draggable = TaskStatusPolicy.isSchedulableStatus(task.status);
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

function bindGanttLabelReparent(labelRow, task) {
  if (!labelRow || !task?.id) return;
  labelRow.draggable = true;
  labelRow.addEventListener("dragstart", event => {
    if (event.target?.closest?.(".task-tree-toggle")) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData("text/task-id", task.id);
    event.dataTransfer.setData("text/gantt-reparent", "1");
    event.dataTransfer.effectAllowed = "move";
    labelRow.classList.add("dragging");
  });
  labelRow.addEventListener("dragend", () => {
    labelRow.classList.remove("dragging");
    document.querySelectorAll(".project-gantt-row-label.drop-reparent").forEach(node => {
      node.classList.remove("drop-reparent");
    });
  });
  labelRow.addEventListener("dragover", event => {
    const sourceId = [...(event.dataTransfer?.types || [])].includes("text/task-id") ||
      [...(event.dataTransfer?.types || [])].includes("text/gantt-reparent");
    if (!sourceId) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    labelRow.classList.add("drop-reparent");
  });
  labelRow.addEventListener("dragleave", event => {
    if (event.relatedTarget && labelRow.contains(event.relatedTarget)) return;
    labelRow.classList.remove("drop-reparent");
  });
  labelRow.addEventListener("drop", event => {
    event.preventDefault();
    event.stopPropagation();
    labelRow.classList.remove("drop-reparent");
    const sourceId = event.dataTransfer.getData("text/task-id");
    if (!sourceId) return;
    reparentTaskOnto(sourceId, task.id);
  });
}

function reparentTaskOnto(sourceId, parentId) {
  if (!sourceId || !parentId) return false;
  const tasks = uniqueTasks(getAllTasks().map(({ task }) => task));
  if (!TaskOptionPolicy.isValidParentTarget({ sourceId, parentId, tasks })) {
    showToast("不能挂到自己或下级任务下");
    return false;
  }
  const source = findTask(sourceId)?.task;
  const parent = findTask(parentId)?.task;
  if (!source || !parent) return false;
  if ((source.parentId || source.parentTaskId || source.parentTask || source.parent || "") === parentId) {
    showToast(`已在「${parent.title}」下`);
    return false;
  }
  updateTaskRecords(sourceId, task => {
    task.parentId = parentId;
    task.parentTaskId = "";
    task.parentTask = "";
    task.parent = "";
    task.updatedAt = new Date().toISOString();
  });
  saveData();
  render();
  showToast(`已挂到「${parent.title}」下`);
  return true;
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

function createCalendarGanttRow(meeting, buckets, scale = "day", options = {}) {
  const meetingTitle = String(meeting?.title || "").trim();
  if (!TodoListPolicy.hasDisplayTitle(meetingTitle)) return null;
  const parts = calendarMeetingTimelineParts(meeting, buckets, scale);
  const labelRow = document.createElement("div");
  const depth = Math.max(0, Number(options.indentBase) || 0);
  labelRow.className = "project-gantt-row-label meeting";
  labelRow.style.setProperty("--task-depth", depth);
  labelRow.dataset.depth = String(depth);
  labelRow.innerHTML = `<div class="project-gantt-title is-title-pin is-meeting">
      <strong title="${escapeHtml(meetingTitle)}">${escapeHtml(meetingTitle)}</strong>
    </div>`;
  const chartRow = document.createElement("div");
  chartRow.className = "project-gantt-row-chart meeting";
  chartRow.innerHTML = `<div class="project-gantt-lane">
      ${parts.segments.map(segment => `<i class="gantt-meeting-bar" style="left:${segment.left}%;width:${segment.width}%" title="会议投入：${escapeHtml(segment.label)}"></i>`).join("")}
    </div>`;
  const openMeeting = () => {
    const first = meeting.entries[0];
    if (first) openEntryDialog(first.entry.start, first.entry, first.dateKey);
  };
  labelRow.addEventListener("dblclick", openMeeting);
  chartRow.addEventListener("dblclick", openMeeting);
  return { labelRow, chartRow };
}

function bindDialogDismissControls() {
  const dismiss = event => {
    const button = event.target?.closest?.("[data-close-dialog]");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    closeDialogById(button.getAttribute("data-close-dialog"));
  };
  document.addEventListener("click", dismiss, true);
}

function closeDialogById(id) {
  const dialog = id ? document.getElementById(id) : null;
  if (!dialog) return false;
  const wasEditingTask = id === "taskDialog";
  try {
    if (typeof dialog.close === "function") dialog.close("cancel");
  } catch (_) {
    /* ignore */
  }
  dialog.removeAttribute("open");
  if (dialog.open) {
    try { dialog.open = false; } catch (_) { /* ignore */ }
  }
  if (wasEditingTask) {
    state.editingTaskId = null;
    state.taskSubtaskDrafts = [];
  }
  return true;
}

function closeEditingTask() {
  const task = state.editingTaskId ? findTask(state.editingTaskId)?.task : null;
  if (!task) return;
  const inParentReview = parentReviewAdvanceOnClose;
  suppressParentReviewAdvance = true;
  closeDialogById("taskDialog");
  suppressParentReviewAdvance = false;
  if (TaskStatusPolicy.isEndedStatus(task.status)) {
    toggleTaskCompletion(task);
    if (inParentReview) scheduleParentReviewAdvance();
    return;
  }
  if (inParentReview) parentReviewResumeTaskId = task.id;
  // Reuse the confirm dialog so「关闭并跟踪」stays available.
  requestTaskCompletion(task);
}

function requestTaskCompletion(task) {
  if (!task) return;
  if (TaskStatusPolicy.isEndedStatus(task.status)) {
    toggleTaskCompletion(task);
    return;
  }
  pendingCloseTaskId = task.id;
  if (el.taskCloseConfirmTitle) el.taskCloseConfirmTitle.textContent = "关闭任务";
  if (el.taskCloseConfirmMessage) {
    el.taskCloseConfirmMessage.textContent = `「${task.title}」请确认完成时间与完成情况。「关闭并新建后续」会继承原优先级与上级；若只需提醒、不排投入，再勾选「仅关注」。`;
  }
  if (el.taskCloseCompletedAt) {
    el.taskCloseCompletedAt.value = toLocalDateTimeInput(new Date().toISOString());
  }
  if (el.taskCloseCompletionNote) {
    el.taskCloseCompletionNote.value = task.deliveryNote || "";
  }
  el.taskCloseConfirmDialog?.showModal();
}

function confirmCloseTaskChoice(mode = "only") {
  const closeMode = mode === true ? "tracking" : mode === false ? "only" : String(mode || "only");
  const task = pendingCloseTaskId ? findTask(pendingCloseTaskId)?.task : null;
  const completedAt = fromLocalDateTimeInput(el.taskCloseCompletedAt?.value || "") || new Date().toISOString();
  const completionNote = String(el.taskCloseCompletionNote?.value || "").trim().slice(0, 500);
  const resumeAfterClose = parentReviewResumeTaskId && task && parentReviewResumeTaskId === task.id;
  pendingCloseTaskId = null;
  parentReviewResumeTaskId = null;
  el.taskCloseConfirmDialog?.close();
  if (!task) return;
  const startedAt = task.startOverrideAt || task.startedAt || getTaskScheduleInfo(task.id)?.firstStartIso || "";
  if (startedAt && new Date(completedAt) < new Date(startedAt)) {
    showToast("完成时间不能早于实际开始时间");
    pendingCloseTaskId = task.id;
    if (resumeAfterClose) parentReviewResumeTaskId = task.id;
    el.taskCloseConfirmDialog?.showModal();
    return;
  }
  toggleTaskCompletion(task, {
    createFollowUp: closeMode === "tracking",
    createSuccessor: closeMode === "successor",
    completedAt,
    completionNote
  });
  // 跟踪/后续会先打开编辑窗；仅关闭时继续批量补充上级
  if (closeMode === "only" && (resumeAfterClose || pendingParentReviewQueue.length)) {
    scheduleParentReviewAdvance();
  }
}

function createFollowUpTrackingTask(sourceTask, closedAt = "") {
  const closedIso = closedAt || sourceTask.completedAt || new Date().toISOString();
  const dateKey = state.selectedDate || toDateKey(new Date(closedIso)) || toDateKey(new Date());
  const now = new Date();
  const payload = TaskStatusPolicy.buildFollowUpTask(sourceTask, { closedAt: closedIso });
  const trackingTask = {
    id: crypto.randomUUID(),
    ...payload,
    createdAt: now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
  };
  getDay(dateKey).tasks.push(trackingTask);
  return trackingTask;
}

function createSuccessorWorkTask(sourceTask, closedAt = "") {
  const closedIso = closedAt || sourceTask.completedAt || new Date().toISOString();
  const dateKey = toDateKey(new Date(closedIso)) || state.selectedDate || toDateKey(new Date());
  const now = new Date();
  const payload = TaskStatusPolicy.buildSuccessorTask(sourceTask, { closedAt: closedIso });
  const successorTask = {
    id: crypto.randomUUID(),
    ...payload,
    createdAt: now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
  };
  getDay(dateKey).tasks.push(successorTask);
  return successorTask;
}

function toggleTaskCompletion(task, options = {}) {
  if (!task) return;
  const closing = !TaskStatusPolicy.isEndedStatus(task.status);
  const now = new Date().toISOString();
  const completedAt = closing
    ? (options.completedAt || now)
    : "";
  const firstStartIso = getTaskScheduleInfo(task.id)?.firstStartIso || task.startOverrideAt || task.startedAt || "";
  const nextStatus = closing ? "done" : getAutomaticTaskStatus(task.id);
  const hasCompletionNote = Object.prototype.hasOwnProperty.call(options, "completionNote");
  const completionNote = hasCompletionNote
    ? String(options.completionNote || "").trim().slice(0, 500)
    : null;
  const sourceSnapshot = closing ? {
    status: task.status,
    completedAt: task.completedAt || "",
    progress: task.progress || 0,
    deliveryNote: task.deliveryNote || "",
    startedAt: task.startedAt || ""
  } : null;
  updateTaskRecords(task.id, record => {
    record.status = nextStatus;
    record.completedAt = closing ? completedAt : "";
    if (closing && !record.startedAt && firstStartIso) record.startedAt = firstStartIso;
    if (closing && completionNote != null) record.deliveryNote = completionNote;
    record.progress = closing ? 100 : ProjectSummaryPolicy.taskProgressPercent({
      status: nextStatus,
      investedHours: getTaskDuration(task.id),
      scheduledHours: getTaskScheduledHours(task.id)
    });
    record.updatedAt = now;
  });
  let followUpTask = null;
  let successorTask = null;
  if (closing && (options.createFollowUp || options.createSuccessor)) {
    const closedTask = findTask(task.id)?.task || { ...task, status: nextStatus, completedAt };
    if (options.createFollowUp) {
      followUpTask = createFollowUpTrackingTask(closedTask, completedAt);
    } else if (options.createSuccessor) {
      successorTask = createSuccessorWorkTask(closedTask, completedAt);
    }
  }
  saveData();
  render();
  if (closing && followUpTask) {
    if (pendingParentReviewQueue.length) parentReviewPausedForFollowUp = true;
    successorDialogCommitted = false;
    pendingSuccessorRollback = {
      sourceId: task.id,
      successorId: followUpTask.id,
      snapshot: sourceSnapshot,
      mode: "followUp"
    };
    showToast("请完善备忘提醒；取消将恢复原任务为未关闭");
    requestAnimationFrame(() => openTaskDialog(followUpTask, { mode: "followUp" }));
  } else if (closing && successorTask) {
    if (pendingParentReviewQueue.length) parentReviewPausedForFollowUp = true;
    successorDialogCommitted = false;
    pendingSuccessorRollback = {
      sourceId: task.id,
      successorId: successorTask.id,
      snapshot: sourceSnapshot,
      mode: "successor"
    };
    showToast("请完善后续任务；取消将恢复原任务为未关闭");
    requestAnimationFrame(() => openTaskDialog(successorTask, { mode: "successor" }));
  } else {
    pendingSuccessorRollback = null;
    showToast(closing ? "任务已关闭" : "任务已恢复");
  }
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
  if (!task || task.id === rootId) return 0;
  if (!task.parentId) return 0;
  let depth = 0;
  let current = task;
  const visited = new Set();
  while (current?.parentId && current.id !== rootId && !visited.has(current.id)) {
    visited.add(current.id);
    depth += 1;
    current = findTask(current.parentId)?.task;
  }
  // Hops from this task up to the project root: parent=0, child=1, grandchild=2…
  return depth;
}

function scheduleEntryDisplayMeta(entry, dateKey = state.selectedDate) {
  if (entry.entryType === "calendar" || !entry.taskId) {
    const kind = getEntryInvestedHours(dateKey, entry) > 0 ? "actual" : "planned";
    return {
      type: "meeting",
      kind,
      badge: TaskStatusPolicy.scheduleOverviewBadge({ type: "meeting", kind })
    };
  }
  const task = findTask(entry.taskId)?.task;
  const kind = TaskStatusPolicy.scheduleOverviewKind({
    taskStatus: task?.status || "",
    investedHours: getEntryInvestedHours(dateKey, entry)
  });
  return {
    type: "task",
    kind,
    badge: TaskStatusPolicy.scheduleOverviewBadge({ type: "task", kind })
  };
}

function renderDayTimeline() {
  const day = getDay();
  const allEntries = day.entries || [];
  const hours = getVisibleTimelineHours(allEntries);
  // Day/week/month calendars always show every entry; left list filters do not apply.
  const visibleEntries = allEntries;
  el.timeline.innerHTML = "";
  el.timeline.style.minHeight = `calc(var(--hour-height) * ${hours.length})`;
  hours.forEach(hour => {
    const row = document.createElement("div");
    row.className = "time-row";
    row.innerHTML = `<div class="time-label">${String(hour).padStart(2, "0")}:00</div><div class="time-slot" data-hour="${hour}"></div>`;
    const slot = row.querySelector(".time-slot");
    let slotClickTimer = 0;
    slot.addEventListener("click", event => {
      if (event.target !== slot) return;
      if (slotClickTimer) clearTimeout(slotClickTimer);
      slotClickTimer = setTimeout(() => {
        slotClickTimer = 0;
        openEntryDialog(hour);
      }, 280);
    });
    slot.addEventListener("dblclick", event => {
      if (event.target !== slot) return;
      if (slotClickTimer) {
        clearTimeout(slotClickTimer);
        slotClickTimer = 0;
      }
      event.stopPropagation();
      openTaskDialogForDate(state.selectedDate);
    });
    slot.addEventListener("dragover", event => { event.preventDefault(); slot.classList.add("drag-over"); });
    slot.addEventListener("dragleave", () => slot.classList.remove("drag-over"));
    slot.addEventListener("drop", event => {
      event.preventDefault();
      clearScheduleDragOver();
      handleScheduleDropData(state.selectedDate, hour, event);
    });
    el.timeline.appendChild(row);
  });
  const endHour = ScheduleHoursPolicy.timelineEndLabelHour(hours, state.workEndHour);
  const endRow = document.createElement("div");
  endRow.className = "time-row time-row-end";
  endRow.innerHTML = `<div class="time-label">${String(endHour).padStart(2, "0")}:00</div><div class="time-slot time-slot-end" aria-hidden="true"></div>`;
  el.timeline.appendChild(endRow);
  const layoutItems = layoutOverlappingEntries(visibleEntries);
  layoutItems.forEach(({ entry, column, columns }) => {
    const item = document.createElement("article");
    const meta = scheduleEntryDisplayMeta(entry, state.selectedDate);
    const top = (entry.start - hours[0]) * getHourHeight() + 3;
    const height = (entry.end - entry.start) * getHourHeight() - 6;
    const linkedTask = entry.taskId ? findTask(entry.taskId)?.task : null;
    const endedClass = linkedTask && ["done", "closed"].includes(linkedTask.status) ? ` ${linkedTask.status}` : "";
    item.className = `schedule-entry ${entry.color || "sage"} ${meta.kind}${meta.type === "meeting" ? " meeting" : ""}${endedClass}`;
    item.draggable = true;
    item.dataset.entryId = entry.id;
    if (columns >= 3) item.classList.add("dense");
    if (columns >= 4) item.classList.add("very-dense");
    item.style.top = `${top}px`;
    item.style.height = `${Math.max(height, 38)}px`;
    item.style.setProperty("--entry-column", column);
    item.style.setProperty("--entry-columns", columns);
    item.innerHTML = `<strong><b class="schedule-entry-badge">${escapeHtml(meta.badge)}</b>${escapeHtml(entry.title)}</strong>
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
    if (current >= hours[0] && current <= hours.at(-1) + 1) {
      const line = document.createElement("div");
      line.className = "current-time-line";
      line.style.top = `${(current - hours[0]) * getHourHeight()}px`;
      el.timeline.appendChild(line);
    }
  }
  const logged = allEntries.reduce((sum, entry) => sum + getEntryInvestedHours(state.selectedDate, entry), 0);
  const scheduled = allEntries.reduce((sum, entry) => sum + entry.end - entry.start, 0);
  el.loggedHours.textContent = `${trimNumber(logged)}h`;
  el.freeHours.textContent = `${trimNumber(Math.max(0, hours.length - scheduled))}h`;
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
  el.timeline.style.minHeight = "";
  let logged = 0;
  let scheduled = 0;
  let visibleCount = 0;
  const workHours = Math.max(1, state.workEndHour - state.workStartHour);
  for (let i = 0; i < 7; i++) {
    const date = addDays(monday, i);
    const key = toDateKey(date);
    const dayEntries = WeekEntryPolicy.sortEntries(getDay(key).entries || []);
    const overviewItems = scheduleOverviewItemsForDate(key);
    const hasActivity = dayEntries.length > 0 || overviewItems.length > 0;
    if (!ScheduleHoursPolicy.shouldShowWeekColumn({ dayIndex: i, hasActivity })) continue;
    visibleCount += 1;
    const column = document.createElement("section");
    column.className = `week-schedule-day${key === state.selectedDate ? " selected" : ""}${i >= 5 ? " weekend" : ""}`;
    column.innerHTML = `<h4>${WEEKDAY_NAMES[date.getDay()]} · ${date.getMonth() + 1}/${date.getDate()}</h4>
      <button type="button" class="week-add-task" data-date="${key}">＋ 新建待办</button>
      ${renderDayOverviewList(overviewItems, "week")}`;
    column.querySelector(".week-add-task").addEventListener("click", event => {
      event.stopPropagation();
      openTaskDialogForDate(key);
    });
    bindScheduleDrop(column, key, Math.min(Math.max(state.workStartHour, 0), 23));
    bindDayOverviewList(column);
    dayEntries.forEach(entry => {
      logged += getEntryInvestedHours(key, entry);
      scheduled += entry.end - entry.start;
    });
    if (!overviewItems.length) column.insertAdjacentHTML("beforeend", `<div class="empty-state">暂无任务</div>`);
    column.addEventListener("dblclick", event => {
      if (event.target === column) {
        state.selectedDate = key;
        state.taskView = "day";
        render();
      }
    });
    el.timeline.appendChild(column);
  }
  el.timeline.style.gridTemplateColumns = `repeat(${Math.max(visibleCount, 1)}, minmax(0, 1fr))`;
  el.loggedHours.textContent = `${trimNumber(logged)}h`;
  el.freeHours.textContent = `${trimNumber(Math.max(0, visibleCount * workHours - scheduled))}h`;
}

function renderMonthSchedule() {
  const selected = fromDateKey(state.selectedDate);
  const first = new Date(selected.getFullYear(), selected.getMonth(), 1);
  const start = getMonday(first);
  el.timeline.innerHTML = "";
  el.timeline.className = "schedule-month-calendar";
  const weekdays = document.createElement("div");
  weekdays.className = "schedule-month-weekdays";
  MONTH_WEEKDAY_NAMES.forEach(name => {
    const head = document.createElement("div");
    head.className = "schedule-month-weekday";
    head.textContent = name;
    weekdays.appendChild(head);
  });
  const grid = document.createElement("div");
  grid.className = "schedule-month-grid";
  el.timeline.append(weekdays, grid);
  let logged = 0;
  let monthClickTimer = 0;
  for (let i = 0; i < 42; i++) {
    const date = addDays(start, i);
    const key = toDateKey(date);
    const weekdayIndex = (date.getDay() + 6) % 7; // Monday=0 … Sunday=6
    const entries = getDay(key).entries || [];
    const monthItems = scheduleOverviewItemsForDate(key);
    entries.forEach(entry => logged += getEntryInvestedHours(key, entry));
    const cell = document.createElement("section");
    cell.className = "schedule-month-cell";
    if (weekdayIndex >= 5) cell.classList.add("weekend");
    if (date.getMonth() !== selected.getMonth()) cell.classList.add("outside");
    if (key === state.selectedDate) cell.classList.add("selected");
    if (isToday(date)) cell.classList.add("today");
    const isEmptyDay = monthItems.length === 0;
    if (isEmptyDay) cell.classList.add("is-empty");
    cell.innerHTML = `<header><span>${date.getDate()}</span><span>${holidayLabel(key)}</span></header>
      ${renderDayOverviewList(monthItems, "month")}
      ${isEmptyDay ? `<button type="button" class="month-add-task" aria-label="新建当天待办" title="新建目标日期为当天的待办">＋</button>` : ""}`;
    bindScheduleDrop(cell, key, 9);
    cell.querySelector(".month-add-task")?.addEventListener("click", event => {
      event.stopPropagation();
      if (monthClickTimer) {
        clearTimeout(monthClickTimer);
        monthClickTimer = 0;
      }
      state.selectedDate = key;
      openTaskDialogForDate(key);
    });
    cell.addEventListener("click", event => {
      if (event.target.closest(".month-task-line, .month-add-task")) return;
      if (monthClickTimer) clearTimeout(monthClickTimer);
      // Delay so a double-click can create a task without first jumping to day view.
      monthClickTimer = setTimeout(() => {
        monthClickTimer = 0;
        state.selectedDate = key;
        state.taskView = "day";
        el.viewSwitcher?.querySelectorAll("button").forEach(item => {
          item.classList.toggle("active", item.dataset.view === "day");
        });
        render();
      }, 280);
    });
    cell.addEventListener("dblclick", event => {
      if (event.target.closest(".month-task-line, .month-add-task")) return;
      if (monthClickTimer) {
        clearTimeout(monthClickTimer);
        monthClickTimer = 0;
      }
      state.selectedDate = key;
      openTaskDialogForDate(key);
    });
    bindDayOverviewList(cell);
    grid.appendChild(cell);
  }
  el.loggedHours.textContent = `${trimNumber(logged)}h`;
  el.freeHours.textContent = "—";
}

function dueTasksForDate(dateKey) {
  // Keep ended tasks visible (strikethrough) on week/month/day calendars.
  return getAllTasks()
    .map(({ task }) => task)
    .filter(task => task.dueDate === dateKey && !isHiddenFutureRecurringInstance(task));
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
      const meetingTitle = String(entry.title || "").trim();
      if (!TodoListPolicy.hasDisplayTitle(meetingTitle)) return;
      meetingItems.push({
        type: "meeting",
        title: meetingTitle,
        kind: getEntryInvestedHours(dateKey, entry) > 0 ? "actual" : "planned",
        entryId: entry.id,
        start: entry.start,
        end: entry.end
      });
      return;
    }
    const task = findTask(entry.taskId)?.task;
    if (!task) return;
    const itemTitle = String(entry.title || task.title || "").trim();
    if (!TodoListPolicy.hasDisplayTitle(itemTitle)) return;
    const existing = taskItems.get(task.id);
    const kind = TaskStatusPolicy.scheduleOverviewKind({
      taskStatus: task.status,
      investedHours: getEntryInvestedHours(dateKey, entry)
    });
    if (!existing) {
      taskItems.set(task.id, {
        type: "task",
        title: itemTitle,
        kind,
        task,
        entryId: entry.id,
        start: entry.start,
        end: entry.end
      });
      return;
    }
    if (kind === "actual") existing.kind = "actual";
    existing.end = Math.max(Number(existing.end) || 0, Number(entry.end) || 0);
    if (entry.start < existing.start) {
      existing.start = entry.start;
      existing.end = entry.end;
      existing.entryId = entry.id;
      existing.title = itemTitle;
    }
  });
  dueTasksForDate(dateKey).filter(task => TodoListPolicy.hasDisplayTitle(task.title)).forEach(task => {
    if (taskItems.has(task.id)) return;
    taskItems.set(task.id, {
      type: "task",
      title: String(task.title).trim(),
      kind: TaskStatusPolicy.scheduleOverviewKind({ taskStatus: task.status, investedHours: 0 }),
      task,
      entryId: "",
      start: scheduleTimeDecimal(task.dueTime, 99),
      dueTime: task.dueTime || ""
    });
  });
  completedTasksForDate(dateKey).forEach(task => {
    if (taskItems.has(task.id) || !TodoListPolicy.hasDisplayTitle(task.title)) return;
    taskItems.set(task.id, {
      type: "task",
      title: String(task.title).trim(),
      kind: TaskStatusPolicy.scheduleOverviewKind({ taskStatus: task.status, investedHours: 0 }),
      task,
      entryId: "",
      start: 98,
      dueTime: ""
    });
  });
  const items = [...taskItems.values(), ...meetingItems].sort((a, b) =>
    `${String(a.start).padStart(5, "0")} ${a.title}`.localeCompare(`${String(b.start).padStart(5, "0")} ${b.title}`)
  );
  items.forEach(item => {
    item.timeText = WeekEntryPolicy.formatScheduleTimeRange(item, formatTime);
  });
  // Keep every todo + meeting visible on calendars; left status tabs do not filter here.
  return items;
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
  return TaskStatusPolicy.scheduleOverviewBadge(item);
}

function renderDayOverviewList(items, mode) {
  if (!items.length) return "";
  const lineClass = mode === "week" ? "week-task-line" : "month-task-line";
  const listClass = mode === "week" ? "week-task-list" : "month-task-list";
  return `<div class="${listClass}">
    ${items.map(item => {
      const ended = item.task && ["done", "closed"].includes(item.task.status);
      const statusClass = ended ? ` ${item.task.status}` : "";
      return `<div class="${lineClass} ${item.kind}${item.type === "meeting" ? " meeting" : ""}${statusClass}" draggable="${item.type === "task" && item.task && !ended}" data-task-id="${item.task?.id || ""}" data-entry-id="${escapeHtml(item.entryId || "")}" title="${escapeHtml(item.title)}${item.timeText ? ` · ${escapeHtml(item.timeText)}` : ""}">
      <b>${overviewItemBadge(item)}</b><span>${escapeHtml(item.title)}</span>${mode === "week" && item.timeText ? `<small>${escapeHtml(item.timeText)}</small>` : ""}
    </div>`;
    }).join("")}
  </div>`;
}

function bindDayOverviewList(container, options = {}) {
  const openOn = options.openOn === "dblclick" ? "dblclick" : "click";
  const selectDateKey = options.selectDateKey || "";
  container.querySelectorAll(".week-task-line, .month-task-line").forEach(item => {
    const openItem = () => {
      const foundEntry = item.dataset.entryId ? findEntry(item.dataset.entryId) : null;
      if (foundEntry) openEntryDialog(foundEntry.entry.start, foundEntry.entry, foundEntry.dateKey);
      else {
        const task = findTask(item.dataset.taskId)?.task;
        if (task) openTaskDialog(task);
      }
    };
    item.addEventListener("click", event => {
      event.stopPropagation();
      if (selectDateKey && selectDateKey !== state.selectedDate) {
        state.selectedDate = selectDateKey;
        render();
        return;
      }
      if (openOn === "click") openItem();
    });
    if (openOn === "dblclick") {
      item.addEventListener("dblclick", event => {
        event.stopPropagation();
        openItem();
      });
    }
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
  const fromMemo = isMemoReminderTask(task);
  const workTask = fromMemo ? materializeWorkTodoFromMemo(task, dateKey) : task;
  getDay(dateKey).entries.push({
    id: crypto.randomUUID(), entryType: "task_work", taskId: workTask.id, title: workTask.title,
    ...placement, note: "", color: "sage"
  });
  refreshTaskStatusForId(workTask.id);
  saveData();
  render();
  showToast(fromMemo
    ? `备忘已派生新待办「${workTask.title}」，并安排到 ${dateKey.slice(5)} ${formatTime(hour)}`
    : `已安排到 ${dateKey.slice(5)} ${formatTime(hour)}`);
  return true;
}

function materializeWorkTodoFromMemo(memo, dateKey = state.selectedDate) {
  const now = new Date();
  const payload = TaskStatusPolicy.buildWorkTodoFromMemo(memo, {
    dueDate: dateKey || "",
    dueTime: defaultWorkEndTime()
  });
  const workTodo = {
    id: crypto.randomUUID(),
    ...payload,
    createdAt: now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
  };
  getDay(dateKey || state.selectedDate).tasks.push(workTodo);
  updateTaskRecords(memo.id, task => {
    task.updatedAt = now.toISOString();
    task.description = `${task.description || ""}${task.description ? "\n" : ""}已派生待办并开始投入：${workTodo.title}`;
  });
  return workTodo;
}

function openEntryDialog(hour, entry = null, dateKey = null) {
  const resolvedDateKey = entry
    ? (dateKey || findEntry(entry.id)?.dateKey || state.selectedDate)
    : (dateKey || state.selectedDate);
  state.editingEntryId = entry?.id || null;
  state.editingEntryDateKey = resolvedDateKey;
  state.selectedColor = entry?.color || "sage";
  el.entryEyebrow.textContent = entry ? "EDIT ENTRY" : "NEW ENTRY";
  el.entryDialogTitle.textContent = entry ? "编辑日程" : "添加日程";
  el.entryTitle.value = entry?.title || "";
  el.entryType.value = entry?.entryType || (entry?.taskId ? "task_work" : "calendar");
  fillEntryTaskOptions(entry);
  el.entryStart.value = entry?.start ?? hour;
  el.entryEnd.value = entry?.end ?? Math.min(hour + 1, 22);
  if (el.entryOwner) el.entryOwner.value = entry?.owner || "";
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
    owner: (el.entryOwner?.value || "").trim().slice(0, 80),
    note: el.entryNote.value.trim(), color: state.selectedColor,
    entryType: el.entryType.value === "task_work" ? "task_work" : "calendar"
  };
  if (!payload.title || payload.end <= payload.start) return showToast("请检查事项和时间");
  const dateKey = state.editingEntryDateKey || state.selectedDate;
  const day = getDay(dateKey);
  const existingEntry = state.editingEntryId ? day.entries.find(entry => entry.id === state.editingEntryId) : null;
  if (state.editingEntryId && !existingEntry) {
    showToast("未找到要更新的日程，请关闭后重试");
    return;
  }
  const previousTaskId = existingEntry?.taskId || "";
  const linkSelected = String(el.entryTaskLink?.value || "").trim();
  // Meetings stay in the meeting list, but may optionally link a todo so hours count as task investment.
  if (payload.entryType === "calendar" && !linkSelected) {
    finalizeEntrySave({ payload, existingEntry, previousTaskId, taskId: "", dateKey });
    return;
  }
  resolveEntryTaskLinkWithGuard(payload, existingEntry).then(taskId => {
    if (!taskId) return;
    finalizeEntrySave({ payload, existingEntry, previousTaskId, taskId, dateKey });
  });
}

function finalizeEntrySave({ payload, existingEntry, previousTaskId, taskId, dateKey = state.editingEntryDateKey || state.selectedDate }) {
  payload.taskId = taskId;
  const day = getDay(dateKey);
  if (state.editingEntryId) {
    if (!existingEntry) {
      showToast("未找到要更新的日程，请关闭后重试");
      return;
    }
    Object.assign(existingEntry, payload);
  } else {
    day.entries.push({ id: crypto.randomUUID(), ...payload });
  }
  [previousTaskId, payload.taskId].filter(Boolean).forEach(id => {
    refreshTaskStatusForId(id);
    if (payload.note) updateTaskRecords(id, task => { task.updatedAt = new Date().toISOString(); });
  });
  focusLinkedTaskFilter(payload.taskId);
  const wasEditing = Boolean(state.editingEntryId);
  state.editingEntryId = null;
  state.editingEntryDateKey = null;
  saveData(); el.entryDialog.close(); render();
  showToast(wasEditing ? "日程已更新" : "日程已添加");
}

function resolveCreateUnderExistingParent(entryPayload, parentTitle) {
  const existingParent = findTaskByNormalizedTitle(parentTitle);
  if (!existingParent) return null;
  const existingLeaf = findLeafUnderParentByTitle(existingParent.id, entryPayload.title);
  if (existingLeaf) {
    showToast(`已关联到「${existingParent.title}」下的已有子待办，未重复创建`);
    return existingLeaf.id;
  }
  const leaf = createParentAndLeafFromEntryPayload(entryPayload, existingParent.title);
  showToast(`已在父级「${existingParent.title}」下新建子待办并关联`);
  return leaf.id;
}

function resolveEntryTaskLinkWithGuard(entryPayload, existingEntry = null) {
  const selected = el.entryTaskLink.value;
  if (selected === "__create_parent__") {
    const parentTitle = el.entryTaskCombobox.dataset.parentTitle || "";
    // Selecting an existing parent means: create a sibling leaf under it and link.
    // Skip the extra dialog when the parent is already identified.
    if (parentTitle) {
      const linkedId = resolveCreateUnderExistingParent(entryPayload, parentTitle);
      if (linkedId) return Promise.resolve(linkedId);
    }
    return promptEntryParentCreate(entryPayload, parentTitle);
  }
  if (selected && selected !== "__create__" && selected !== "") {
    const linked = findTask(selected)?.task;
    if (!linked || !TodoListPolicy.canLinkEntryToTask(linked, hasChildTasks)) {
      showToast("工时只能记在叶子待办上；请选已有叶子，或选父级以在其下新建子待办");
      return Promise.resolve(null);
    }
    if (isMemoReminderTask(linked)) {
      const workTodo = materializeWorkTodoFromMemo(linked, state.editingEntryDateKey || state.selectedDate);
      showToast(`备忘「${linked.title}」已派生新待办并关联投入`);
      return Promise.resolve(workTodo.id);
    }
    return Promise.resolve(selected);
  }
  if (existingEntry?.taskId) return Promise.resolve(existingEntry.taskId);
  const leafTasks = uniqueTasks(getAllTasks().map(({ task }) => task)).filter(isWorkLeafTask);
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
    el.entryLinkConfirmOptions.innerHTML = `<label class="entry-parent-create-field">
      <span>父级任务名称</span>
      <input id="entryParentTaskTitle" maxlength="80" placeholder="例如：年度审计整改 / 月度结账" />
      <small id="entryParentReuseHint" class="entry-parent-reuse-hint"></small>
    </label>`;
    const input = el.entryLinkConfirmOptions.querySelector("#entryParentTaskTitle");
    input.value = suggestedParentTitle;
    const sync = () => syncEntryParentCreateDialog(entryPayload);
    input.addEventListener("input", sync);
    sync();
    el.entryLinkConfirmDialog.showModal();
    setTimeout(() => input.focus(), 0);
  });
}

function findTaskByNormalizedTitle(title) {
  const normalized = TodoListPolicy.normalizeTitle(title);
  if (!normalized) return null;
  return uniqueTasks(getAllTasks().map(({ task }) => task)).find(task =>
    TodoListPolicy.normalizeTitle(task.title) === normalized
  ) || null;
}

function findLeafUnderParentByTitle(parentId, title) {
  if (!parentId) return null;
  const normalized = TodoListPolicy.normalizeTitle(title);
  if (!normalized) return null;
  return getChildTasks(parentId).find(task =>
    TodoListPolicy.normalizeTitle(task.title) === normalized &&
    TodoListPolicy.canLinkEntryToTask(task, hasChildTasks)
  ) || null;
}

function syncEntryParentCreateDialog(entryPayload) {
  const input = el.entryLinkConfirmOptions.querySelector("#entryParentTaskTitle");
  const hint = el.entryLinkConfirmOptions.querySelector("#entryParentReuseHint");
  const parentTitle = input?.value.trim() || "";
  const existing = findTaskByNormalizedTitle(parentTitle);
  const existingLeaf = existing ? findLeafUnderParentByTitle(existing.id, entryPayload.title) : null;
  if (existing && existingLeaf) {
    el.entryLinkConfirmTitle.textContent = "挂入已有父级与子待办";
    el.entryLinkConfirmMessage.textContent = `已找到父级「${existing.title}」及其子待办「${existingLeaf.title}」。将直接关联，不会重复创建。`;
    el.entryLinkConfirmCreate.textContent = "关联已有子待办";
    if (hint) hint.textContent = "匹配到已有父子任务，避免重复创建。";
  } else if (existing) {
    el.entryLinkConfirmTitle.textContent = "挂入已有父级";
    el.entryLinkConfirmMessage.textContent = `已找到父级「${existing.title}」，不会再新建同名父级。将把「${entryPayload.title}」作为其子待办关联到当前日程。`;
    el.entryLinkConfirmCreate.textContent = "挂入已有父级并关联";
    if (hint) hint.textContent = "将复用已有父级，仅新建当前这项子待办。";
  } else if (parentTitle) {
    el.entryLinkConfirmTitle.textContent = "新建父级并挂入当前事项";
    el.entryLinkConfirmMessage.textContent = `未找到同名父级。将新建「${parentTitle}」，并把「${entryPayload.title}」作为具体子待办关联到当前日程。`;
    el.entryLinkConfirmCreate.textContent = "创建父级并关联";
    if (hint) hint.textContent = "当前名称没有匹配到已有父级。";
  } else {
    el.entryLinkConfirmTitle.textContent = "新建父级并挂入当前事项";
    el.entryLinkConfirmMessage.textContent = `请填写父级任务名称。若与已有父级同名，会自动复用，不会重复创建。`;
    el.entryLinkConfirmCreate.textContent = "创建父级并关联";
    if (hint) hint.textContent = "";
  }
}

function focusLinkedTaskFilter(taskId) {
  const linked = findTask(taskId)?.task;
  if (!linked) return;
  // Newly created schedule-linked leaves are usually planned/unplanned; keep the
  // default in_progress tab from hiding them right after save.
  if (["done", "closed"].includes(linked.status)) state.filter = "ended";
  else if (isOngoingTask(linked)) state.filter = "in_progress";
  else if (isUnplannedTask(linked)) state.filter = "unplanned";
  else state.filter = "planned";
  TodoListPolicy.saveFilter(state.filter);
  state.showContinueYesterdayOnly = false;
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
    isWorkLeafTask(task) &&
    TaskOptionPolicy.shouldIncludeEntryTaskOption({
      task,
      isHiddenFutureRecurringInstance: isHiddenRecurringCatalogInstance(task, {
        keepCurrentLinked: true,
        selectedId: entry?.taskId || ""
      }),
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
  const entryTitle = el.entryTitle.value.trim() || "当前事项";
  const results = TaskOptionPolicy.searchTaskCandidates({
    tasks,
    query,
    selectedId: el.entryTaskLink.value,
    leafOnly: true,
    hasChildTasks,
    isHiddenFutureRecurringInstance: task => isHiddenRecurringCatalogInstance(task, {
      keepCurrentLinked: true,
      selectedId: el.entryTaskLink.value
    }),
    statusText: task => statusLabel(task.status),
    dateText: task => task.dueDate || "未计划"
  });
  const matchedParents = TaskOptionPolicy.matchingParentContainers({
    tasks,
    query,
    hasChildTasks,
    isHiddenFutureRecurringInstance: task => isHiddenRecurringCatalogInstance(task, {
      keepCurrentLinked: true,
      selectedId: el.entryTaskLink.value
    })
  });
  // Partial matches count (e.g. 年度激励 → 完成ROIC…年度激励方案调整).
  // Parents are first-class: choose one to create a sibling leaf under it (not to log hours on the parent).
  const preferredParents = matchedParents.slice(0, 3).map(item => item.task);
  const selectedParentTitle = el.entryTaskCombobox.dataset.parentTitle || "";
  const parentOptions = preferredParents.map(task => {
    const selected = el.entryTaskLink.value === "__create_parent__" && selectedParentTitle === task.title;
    return `<button type="button" class="entry-task-option create-option create-under-option" role="option" aria-selected="${selected}" data-value="__create_parent__" data-parent-title="${escapeHtml(task.title)}" title="在父级下新建当前事项，与现有子任务同级">
      <strong>挂到父级「${escapeHtml(task.title)}」</strong>
      <span>新建「${escapeHtml(entryTitle)}」作为其子待办并关联</span>
      <small>与现有子任务同级 · 工时记在新子待办上</small>
    </button>`;
  }).join("");
  const items = results.map(({ task, meta }) => {
    const primary = meta.parentPath ? meta.path : task.title;
    return `<button type="button" class="entry-task-option" role="option" aria-selected="${el.entryTaskLink.value === task.id}" data-value="${escapeHtml(task.id)}" title="${escapeHtml(meta.path)}"><strong>${escapeHtml(primary)}</strong><span><b>第${meta.depth}层叶子</b>${meta.parentPath ? ` · 归属 ${escapeHtml(meta.parentPath)}` : ""}</span><small>${escapeHtml(statusLabel(task.status))} · ${task.dueDate ? escapeHtml(task.dueDate.slice(5)) : "未计划"}${el.entryTaskLink.value === task.id ? " · ✓ 已关联" : ""}</small></button>`;
  }).join("");
  const parentTitle = query.trim();
  const create = `<button type="button" class="entry-task-option create-option" role="option" aria-selected="${el.entryTaskLink.value === "__create__"}" data-value="__create__">＋ 新建「${escapeHtml(entryTitle)}」并关联</button>
    <button type="button" class="entry-task-option create-option create-parent-option" role="option" aria-selected="${el.entryTaskLink.value === "__create_parent__" && !preferredParents.length}" data-value="__create_parent__">＋ ${parentTitle && !preferredParents.length ? `新建父级「${escapeHtml(parentTitle)}」并挂入当前事项` : "新建父级任务并挂入当前事项"}</button>`;
  const empty = items
    ? ""
    : `<div class="entry-task-no-results">${matchedParents.length
      ? "没有同名叶子。可直接点上方父级：在其下新建当前事项（与现有子任务同级）"
      : "无匹配叶子待办。可选已有叶子关联，或搜索父级名称后挂到该父级下新建"}</div>`;
  el.entryTaskOptions.innerHTML = parentOptions + (items || empty) + create;
  const createParentOption = el.entryTaskOptions.querySelector('.create-parent-option[data-value="__create_parent__"]');
  if (createParentOption) createParentOption.dataset.parentTitle = preferredParents.length ? "" : parentTitle;
  const current = [...el.entryTaskOptions.querySelectorAll('[role="option"]')].findIndex(option => option.getAttribute("aria-selected") === "true");
  entryTaskActiveIndex = current >= 0 ? current : 0;
  el.entryTaskOptions.querySelectorAll('[role="option"]').forEach(option => {
    option.addEventListener("click", () => chooseEntryTaskOption(option.dataset.value, option.dataset.parentTitle || ""));
  });
  updateEntryTaskActiveOption(el.entryTaskOptions.querySelectorAll('[role="option"]'));
}
function updateEntryTaskActiveOption(options) { options.forEach((option, index) => option.classList.toggle("active", index === entryTaskActiveIndex)); }
function chooseEntryTaskOption(value, parentTitle = "") {
  el.entryTaskLink.value = value;
  el.entryTaskCombobox.dataset.parentTitle = value === "__create_parent__" ? parentTitle : "";
  if (value === "__create_parent__" && parentTitle) {
    const existing = [...el.entryTaskLink.options].find(option => option.value === "__create_parent__");
    if (existing) existing.textContent = `挂到父级「${parentTitle}」· 新建子待办并关联`;
  }
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
      if (entry) openEntryDialog(entry.start, entry, dateKey);
    });
  });
}

function updateEntryTypeControls() {
  // Both 会议日程 and 新建待办 can link a todo; meeting link is optional.
  el.entryTaskLink.disabled = false;
  el.entryTaskLink.closest("label")?.classList.remove("disabled-field");
  el.entryTaskCombobox?.classList.remove("disabled");
  if (el.entryTaskTrigger) el.entryTaskTrigger.disabled = false;
  syncEntryTaskTrigger();
}

let taskMergeCandidates = [];
let taskMergeActiveIndex = 0;

function bindTaskMergePicker() {
  if (!el.taskMergeSearch) return;
  el.taskMergeSearch.addEventListener("input", () => {
    taskMergeActiveIndex = 0;
    renderTaskMergeOptions(el.taskMergeSearch.value);
  });
  el.taskMergeSearch.addEventListener("keydown", event => {
    const options = el.taskMergeOptions?.querySelectorAll('[role="option"]') || [];
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      taskMergeActiveIndex = Math.max(0, Math.min(Math.max(0, options.length - 1), taskMergeActiveIndex + (event.key === "ArrowDown" ? 1 : -1)));
      updateTaskMergeActiveOption(options);
    } else if (event.key === "Enter" && options[taskMergeActiveIndex]) {
      event.preventDefault();
      chooseTaskMergeOption(options[taskMergeActiveIndex].dataset.value || "");
    }
  });
}

function openTaskMergeDialog() {
  const source = findTask(state.editingTaskId)?.task;
  if (!source) return;
  const allTasks = uniqueTasks(getAllTasks().map(({ task }) => task));
  taskMergeCandidates = allTasks
    .filter(task => task.id !== source.id && isTodoListTask(task) && !["done", "closed"].includes(task.status));
  if (!taskMergeCandidates.length) return showToast("没有可合并的目标待办");
  el.taskMergeMessage.textContent = `将把「${source.title}」的所有任务投入合并到另一个待办，并关闭当前待办。`;
  el.taskMergeTarget.innerHTML = taskMergeCandidates.map(task => {
    const path = TaskOptionPolicy.taskHierarchyPath({ task, tasks: allTasks, separator: " › " });
    return `<option value="${escapeHtml(task.id)}">${escapeHtml(path || task.title)}</option>`;
  }).join("");
  el.taskMergeTarget.value = taskMergeCandidates[0]?.id || "";
  if (el.taskMergeSearch) el.taskMergeSearch.value = "";
  taskMergeActiveIndex = 0;
  renderTaskMergeOptions("");
  el.taskMergeDialog.showModal();
  setTimeout(() => el.taskMergeSearch?.focus(), 20);
}

function renderTaskMergeOptions(query = "") {
  if (!el.taskMergeOptions) return;
  const allTasks = uniqueTasks(getAllTasks().map(({ task }) => task));
  const selectedId = el.taskMergeTarget?.value || "";
  const candidateIds = new Set(taskMergeCandidates.map(task => task.id));
  const results = TaskOptionPolicy.searchTaskCandidates({
    tasks: allTasks,
    query,
    selectedId,
    leafOnly: false,
    hasChildTasks,
    statusText: task => statusLabel(task.status),
    dateText: task => (task.dueDate ? task.dueDate.slice(5) : "未计划")
  }).filter(item => candidateIds.has(item.task.id));
  if (!results.length) {
    el.taskMergeOptions.innerHTML = `<div class="entry-task-no-results">${String(query || "").trim() ? "没有匹配的目标待办" : "暂无可合并的目标待办"}</div>`;
    return;
  }
  el.taskMergeOptions.innerHTML = results.map(({ task, meta }) => {
    const selected = selectedId === task.id;
    const date = task.dueDate ? task.dueDate.slice(5) : "未计划";
    return `<button type="button" class="entry-task-option${selected ? " active" : ""}" role="option" aria-selected="${selected}" data-value="${escapeHtml(task.id)}" title="${escapeHtml(meta.path)}">
      <strong>${escapeHtml(task.title)}</strong>
      <span><b>第${meta.depth}层叶子</b>${meta.parentPath ? ` · ${escapeHtml(meta.parentPath)}` : ""}</span>
      <small>${escapeHtml(statusLabel(task.status))} · ${escapeHtml(date)}${selected ? " · ✓ 已选择" : ""}</small>
    </button>`;
  }).join("");
  const options = el.taskMergeOptions.querySelectorAll('[role="option"]');
  options.forEach(option => {
    option.addEventListener("click", () => chooseTaskMergeOption(option.dataset.value || ""));
  });
  const selectedIndex = [...options].findIndex(option => option.dataset.value === selectedId);
  taskMergeActiveIndex = selectedIndex >= 0 ? selectedIndex : Math.min(taskMergeActiveIndex, options.length - 1);
  updateTaskMergeActiveOption(options);
}

function updateTaskMergeActiveOption(options) {
  options.forEach((option, index) => option.classList.toggle("active", index === taskMergeActiveIndex));
  options[taskMergeActiveIndex]?.scrollIntoView({ block: "nearest" });
}

function chooseTaskMergeOption(value) {
  if (!value || !el.taskMergeTarget) return;
  if (![...el.taskMergeTarget.options].some(option => option.value === value)) return;
  el.taskMergeTarget.value = value;
  renderTaskMergeOptions(el.taskMergeSearch?.value || "");
}

function mergeTaskIntoTarget(sourceId, targetId) {
  if (!sourceId || !targetId || sourceId === targetId) return showToast("请搜索并选择要合并到的目标待办");
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
  const normalizedParent = TodoListPolicy.normalizeTitle(parentTitle);
  const existingParent = uniqueTasks(getAllTasks().map(({ task }) => task)).find(task =>
    TodoListPolicy.normalizeTitle(task.title) === normalizedParent
  );
  let parent = existingParent;
  if (!parent) {
    parent = createTaskFromEntryPayload(
      { ...entryPayload, title: parentTitle },
      dateKey,
      "从具体日程事项归纳创建的父级任务，可继续添加相关子任务。"
    );
    parent.dueDate = "";
    parent.dueTime = "";
    parent.status = "planned";
  }
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
  if (el.quickTaskInput) el.quickTaskInput.value = "";
  state.filter = "unplanned";
  saveData();
  render();
  showToast("未计划待办已记录");
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
  el.entryStart.innerHTML = "";
  el.entryEnd.innerHTML = "";
  for (let minutes = 0; minutes <= 24 * 60; minutes += 15) {
    const time = minutes / 60;
    el.entryStart.add(new Option(formatTime(time), String(time)));
    el.entryEnd.add(new Option(formatTime(time), String(time)));
  }
}

function fillWorkHourSettingOptions() {
  if (!el.settingWorkStartHour || !el.settingWorkEndHour) return;
  el.settingWorkStartHour.innerHTML = "";
  el.settingWorkEndHour.innerHTML = "";
  for (let hour = 0; hour <= 23; hour += 1) {
    el.settingWorkStartHour.add(new Option(`${String(hour).padStart(2, "0")}:00`, String(hour)));
  }
  for (let hour = 1; hour <= 24; hour += 1) {
    el.settingWorkEndHour.add(new Option(`${String(hour).padStart(2, "0")}:00`, String(hour)));
  }
  syncWorkHourSettingControls();
}

function syncWorkHourSettingControls() {
  if (!el.settingWorkStartHour || !el.settingWorkEndHour) return;
  el.settingWorkStartHour.value = String(state.workStartHour);
  el.settingWorkEndHour.value = String(state.workEndHour);
}

function applyWorkHours(next = {}) {
  const normalized = ScheduleHoursPolicy.normalizeWorkHours({
    workStartHour: next.workStartHour ?? state.workStartHour,
    workEndHour: next.workEndHour ?? state.workEndHour
  });
  state.workStartHour = normalized.workStartHour;
  state.workEndHour = normalized.workEndHour;
  try {
    localStorage.setItem(WORK_HOURS_STORAGE_KEY, JSON.stringify(normalized));
  } catch {}
  syncWorkHourSettingControls();
  return normalized;
}

function applyStoredWorkHours(settings = null) {
  let stored = null;
  try {
    stored = JSON.parse(localStorage.getItem(WORK_HOURS_STORAGE_KEY) || "null");
  } catch {
    stored = null;
  }
  applyWorkHours({
    workStartHour: settings?.workStartHour ?? stored?.workStartHour ?? state.workStartHour,
    workEndHour: settings?.workEndHour ?? stored?.workEndHour ?? state.workEndHour
  });
}

function getVisibleTimelineHours(entries = []) {
  return ScheduleHoursPolicy.visibleTimelineHours({
    workStartHour: state.workStartHour,
    workEndHour: state.workEndHour,
    entries
  });
}

function dayHasScheduleActivity(dateKey) {
  const day = getDay(dateKey);
  if ((day.entries || []).length) return true;
  return scheduleOverviewItemsForDate(dateKey).length > 0;
}

function getTaskDuration(taskId) {
  const task = findTask(taskId)?.task;
  if (TaskStatusPolicy.isTrackingStatus(task)) return 0;
  return Object.entries(state.data).reduce((sum, [dateKey, day]) =>
    sum + (day.entries || [])
      .filter(entry => entry.taskId === taskId)
      .reduce((subtotal, entry) => subtotal + getEntryInvestedHours(dateKey, entry), 0), 0);
}

function getTaskScheduledHours(taskId) {
  const task = findTask(taskId)?.task;
  if (TaskStatusPolicy.isTrackingStatus(task)) return 0;
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
  if (!task || TaskStatusPolicy.isEndedStatus(task.status)) return false;
  if (isMemoReminderTask(task)) return false;
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
  // Memo reminders stay outside the work-status machine.
  if (TaskStatusPolicy.isTrackingStatus(task)) return false;
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

function isMemoReminderTask(task) {
  return TaskStatusPolicy.isMemoReminder(task);
}

function belongsInMemoList(task) {
  return TaskStatusPolicy.belongsInMemoList(task);
}

function isWorkLeafTask(task) {
  return isTodoListTask(task) && !isMemoReminderTask(task);
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
  const all = uniqueTasks(getAllTasks().map(({ task }) => task));
  const parent = all.find(task => task.id === parentId) || findTask(parentId)?.task || null;
  const relatedParentIds = RecurringPolicy?.relatedRecurringParentIds?.(all, parentId)
    || new Set([parentId]);
  return all.filter(task => RecurringPolicy?.childBelongsToParentInstance
    ? RecurringPolicy.childBelongsToParentInstance({
      child: task,
      parent,
      relatedParentIds
    })
    : (task.parentId || task.parentTaskId || task.parentTask || task.parent || "") === parentId);
}

function retargetChildrenToMonthlyParentInstance(newParent, groupId) {
  if (!newParent?.id || !groupId) return false;
  const instanceIds = new Set(
    getAllTasks()
      .map(({ task }) => task)
      .filter(task => (task.recurrenceGroupId || "") === groupId || task.id === newParent.id)
      .map(task => task.id)
  );
  let changed = false;
  getAllTasks().forEach(({ task }) => {
    if ((task.recurrenceGroupId || "") === groupId) return;
    const pid = task.parentId || task.parentTaskId || task.parentTask || task.parent || "";
    if (!instanceIds.has(pid) || pid === newParent.id) return;
    const childMonth = task.dueDate?.slice(0, 7) || "";
    const parentMonth = newParent.dueDate?.slice(0, 7) || "";
    if (childMonth && parentMonth && childMonth !== parentMonth) return;
    task.parentId = newParent.id;
    changed = true;
  });
  return changed;
}

function matchesFilter(task, filter) {
  if (!isTodoListTask(task)) return false;
  if (filter === "memo") return belongsInMemoList(task);
  if (isMemoReminderTask(task)) return false;
  if (filter === "all") return true;
  if (filter === "unplanned") return isUnplannedTask(task);
  if (filter === "ended") return task.status === "done" || task.status === "closed";
  if (filter === "planned") {
    return task.status === "planned" && !isUnplannedTask(task) && !isContainerOnlyTask(task);
  }
  return task.status === filter;
}

function statusLabel(status) {
  return TaskStatusPolicy.statusLabel(status);
}

function priorityLabel(priority) {
  return {
    general_daily: "一般日常",
    kpi: "KPI",
    follow_up: "跟踪关注",
    important_urgent: "重要紧急",
    paused: "中止暂停",
    monthly_fixed: "每月例行"
  }[priority] || "一般日常";
}

function priorityShortLabel(priority) {
  return {
    general_daily: "日常",
    kpi: "KPI",
    follow_up: "跟踪",
    important_urgent: "紧急",
    paused: "暂停",
    monthly_fixed: "例行"
  }[priority] || "日常";
}

function migratePriority(priority) {
  return {
    low: "follow_up",
    medium: "follow_up",
    high: "important_urgent",
    urgent: "important_urgent"
  }[priority] || (["general_daily", "kpi", "follow_up", "important_urgent", "paused", "monthly_fixed"].includes(priority) ? priority : "general_daily");
}

function isMonthlyPrioritySelected() {
  return el.taskPriority?.value === "monthly_fixed";
}

/** UI sentinel `monthly_fixed` must not be written; monthly lives in recurrence. */
function resolvePersistedPriority(monthlySelected, editingTask) {
  if (!monthlySelected) {
    const selected = el.taskPriority?.value;
    if (!selected || selected === "monthly_fixed") return "general_daily";
    return migratePriority(selected);
  }
  const existing = editingTask?.priority;
  if (existing && existing !== "monthly_fixed") return migratePriority(existing);
  return "general_daily";
}

function syncMonthlyRecurringFromPriority() {
  if (!el.taskMonthlyRecurring) return;
  el.taskMonthlyRecurring.checked = isMonthlyPrioritySelected();
}

function defaultWorkStartTime() {
  const start = Math.max(0, Math.min(23, Math.floor(Number(state.workStartHour) || ScheduleHoursPolicy?.DEFAULT_WORK_START || 9)));
  return `${String(start).padStart(2, "0")}:00`;
}

function defaultWorkEndTime() {
  const end = Math.max(1, Math.min(24, Math.floor(Number(state.workEndHour) || ScheduleHoursPolicy?.DEFAULT_WORK_END || 18)));
  if (end >= 24) return "23:59";
  return `${String(end).padStart(2, "0")}:00`;
}

function defaultDueTime() {
  return defaultWorkEndTime();
}

function normalizeTimeInput(time) {
  const raw = String(time || "").trim();
  if (/^\d{2}:\d{2}/.test(raw)) return raw.slice(0, 5);
  return "";
}

function getTaskDueParts() {
  const parsed = parseFlexibleDateTime(el.taskDueDateTime?.value || "");
  if (!parsed.dateKey) return { dueDate: "", dueTime: "" };
  return { dueDate: parsed.dateKey, dueTime: parsed.time || "" };
}

function setTaskDueDateTime(dueDate, dueTime = "") {
  if (!el.taskDueDateTime) return;
  if (!dueDate) {
    el.taskDueDateTime.value = "";
    return;
  }
  el.taskDueDateTime.value = formatDateTimeDisplay(dueDate, normalizeTimeInput(dueTime) || defaultWorkEndTime());
}

function defaultLocalDateTimeSeed(kind = "end") {
  const dateKey = state.selectedDate || toDateKey(new Date());
  const time = kind === "start" ? defaultWorkStartTime() : defaultWorkEndTime();
  return `${dateKey}T${time}`;
}

function ensureDueDateTimeUsesWorkEnd(force = false) {
  if (!el.taskDueDateTime) return;
  const parsed = parseFlexibleDateTime(el.taskDueDateTime.value || "");
  if (!parsed.dateKey) return;
  if (isCreateMeetingKind()) {
    const time = parsed.time || defaultWorkStartTime();
    el.taskDueDateTime.value = formatDateTimeDisplay(parsed.dateKey, time);
    return;
  }
  if (force || !parsed.time) setTaskDueDateTime(parsed.dateKey, defaultWorkEndTime());
  else el.taskDueDateTime.value = formatDateTimeDisplay(parsed.dateKey, parsed.time);
}

function bindWorkHourDateTimeDefault(input, kind = "end") {
  if (!input || input.dataset.workHourDefaultBound === "1") return;
  input.dataset.workHourDefaultBound = "1";
  const seedIfEmpty = () => {
    if (input.value) return;
    const [dateKey = "", time = ""] = defaultLocalDateTimeSeed(kind).split("T");
    if (input.type === "datetime-local") input.value = `${dateKey}T${time}`;
    else input.value = formatDateTimeDisplay(dateKey, time);
  };
  // Seed only when opening the picker, not on keyboard focus/tab.
  input.addEventListener("pointerdown", seedIfEmpty);
}

function mergeTaskContextText(task) {
  if (!task) return "";
  const parts = [];
  const pushUnique = value => {
    const text = String(value || "").trim();
    if (!text) return;
    if (parts.some(part => part.includes(text) || text.includes(part))) return;
    parts.push(text);
  };
  pushUnique(task.businessBackground);
  pushUnique(task.problemReason);
  pushUnique(task.description);
  return parts.join("\n\n").slice(0, 800);
}

function renderTaskSubtasks(task = null) {
  if (!el.taskSubtaskList) return;
  const children = task?.id ? getChildTasks(task.id) : [];
  const drafts = state.taskSubtaskDrafts || [];
  el.taskSubtaskList.innerHTML = "";
  if (!children.length && !drafts.length) {
    el.taskSubtaskList.innerHTML = `<li class="task-subtask-empty">还没有下级任务，可在下方快速添加</li>`;
    return;
  }
  children.forEach((child, index) => {
    const item = document.createElement("li");
    item.className = "task-subtask-item";
    item.innerHTML = `<button type="button"><b>${index + 1}</b><span>${escapeHtml(child.title)}</span><small>${escapeHtml(statusLabel(child.status))}</small></button>`;
    item.querySelector("button").addEventListener("click", () => openTaskDialog(child));
    el.taskSubtaskList.appendChild(item);
  });
  drafts.forEach((title, index) => {
    const item = document.createElement("li");
    item.className = "task-subtask-item is-draft";
    item.innerHTML = `<div><b>${children.length + index + 1}</b><span>${escapeHtml(title)}</span><button type="button" class="task-subtask-remove" aria-label="移除">×</button></div>`;
    item.querySelector(".task-subtask-remove").addEventListener("click", () => {
      state.taskSubtaskDrafts.splice(index, 1);
      renderTaskSubtasks(task);
    });
    el.taskSubtaskList.appendChild(item);
  });
}

function commitTaskSubtaskDraft() {
  const title = el.taskSubtaskDraftInput?.value.trim();
  if (!title) return;
  state.taskSubtaskDrafts.push(title);
  el.taskSubtaskDraftInput.value = "";
  const task = state.editingTaskId ? findTask(state.editingTaskId)?.task : null;
  renderTaskSubtasks(task);
}

function createDraftChildTasks(parentId, dateKey = state.selectedDate) {
  if (!parentId || !state.taskSubtaskDrafts.length) return;
  const now = new Date();
  state.taskSubtaskDrafts.forEach(title => {
    const task = {
      id: crypto.randomUUID(),
      title,
      dueDate: "",
      dueTime: "",
      owner: "我",
      parentId,
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
    getDay(dateKey || state.selectedDate).tasks.push(task);
  });
}

function updateRecurringOptions() {
  syncMonthlyRecurringFromPriority();
  const enabled = isMonthlyPrioritySelected();
  el.recurringOptions.classList.toggle("hidden", !enabled);
  if (enabled && !el.taskRecurringUntil.value) {
    el.taskRecurringUntil.value = defaultRecurringUntil(getTaskDueParts().dueDate || state.selectedDate);
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
    const existing = getAllTasks().find(({ task }) =>
      task.id !== template.id &&
      (task.recurrenceGroupId === groupId || task.recurrenceGroupId === template.recurrenceGroupId) &&
      task.dueDate?.slice(0, 7) === targetMonth
    )?.task || (template.dueDate.slice(0, 7) === targetMonth ? template : null);
    if (existing) {
      if (syncMonthlyInstanceTitle(existing, template, targetMonth)) changed = true;
      if (retargetChildrenToMonthlyParentInstance(existing, groupId)) changed = true;
      return;
    }
    const dueDate = recurringDateForMonth(template.dueDate, targetMonth);
    const task = cloneRecurringTaskForMonth(template, dueDate, groupId);
    getDay(dueDate).tasks.push(task);
    if (retargetChildrenToMonthlyParentInstance(task, groupId)) changed = true;
    changed = true;
  });
  if (changed) saveData();
}

function syncMonthlyInstanceTitle(task, template, targetMonth) {
  if (!task || !template) return false;
  const baseTitle = RecurringPolicy.stripMonthlyInstancePrefix?.(template.title) || template.title;
  if (!RecurringPolicy.shouldSyncMonthlyInstanceTitle?.(task.title, baseTitle, targetMonth)) return false;
  const nextTitle = RecurringPolicy.monthlyInstanceTitle?.(baseTitle, targetMonth);
  if (!nextTitle || task.title === nextTitle) return false;
  task.title = nextTitle;
  task.updatedAt = new Date().toISOString();
  return true;
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
  const monthKey = dueDate?.slice(0, 7) || "";
  const baseTitle = RecurringPolicy.stripMonthlyInstancePrefix?.(template.title) || template.title;
  const titled = RecurringPolicy.monthlyInstanceTitle?.(baseTitle, monthKey) || baseTitle;
  return {
    ...template,
    id: crypto.randomUUID(),
    title: titled,
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
  const monthKey = payload.dueDate?.slice(0, 7) || "";
  const titled = payload.recurrence?.frequency === "monthly"
    ? (RecurringPolicy.monthlyInstanceTitle?.(payload.title, monthKey) || payload.title)
    : payload.title;
  return [{
    id: crypto.randomUUID(),
    ...base,
    ...payload,
    title: titled,
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
  if (el.businessBackgroundLabel?.querySelector("span")) {
    const followUp = el.taskEditForm?.classList.contains("follow-up-draft");
    el.businessBackgroundLabel.querySelector("span").textContent = followUp
      ? "背景与说明（来自已关闭任务）"
      : "背景与说明";
  }
  el.taskBusinessBackground.required = false;
  if (el.taskProblemReason) el.taskProblemReason.required = false;
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

async function exportAllData(format = "json") {
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
  const data = format === "json"
    ? {
      format: "today-planner-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      recordCount: countPlannerRecords(state.data),
      data: state.data,
      tasks,
      schedules,
      notes
    }
    : {
      format: "today-planner-export",
      version: 1,
      exportedAt: new Date().toISOString(),
      tasks,
      schedules,
      notes
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

async function applyImportedPlannerData(data, recordCount) {
  state.data = data || {};
  migrateData();
  ensureEntryTaskLinks();
  ensureRecurringTasksForVisibleRange();
  saveData();
  render();
  showToast(`已导入恢复（${recordCount || countPlannerRecords(state.data)} 条记录）`);
}

async function importAllData() {
  const localCount = countPlannerRecords(state.data);
  if (!confirm(`导入会用备份文件覆盖当前本机数据。\n当前约 ${localCount} 条记录。\n桌面版导入前会自动做本地备份。\n确定继续？`)) return;

  if (window.desktopAPI?.importData) {
    try {
      const result = await window.desktopAPI.importData();
      if (result?.canceled) {
        showToast("已取消导入");
        return;
      }
      if (!result?.ok) {
        showToast(result?.error || "导入失败");
        return;
      }
      await applyImportedPlannerData(result.data, result.recordCount);
    } catch (error) {
      showToast(error.message || "导入失败");
    }
    return;
  }

  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json,.json";
  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = (window.ImportPolicy || globalThis.ImportPolicy).parseImportPayload(text);
      if (!parsed.ok) {
        showToast(parsed.error || "备份文件无效");
        return;
      }
      await applyImportedPlannerData(parsed.data, parsed.recordCount);
    } catch (error) {
      showToast(error.message || "导入失败");
    }
  });
  input.click();
}

function formatDue(task) {
  if (!task.dueDate) return "无固定目标时间";
  const date = fromDateKey(task.dueDate);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${task.dueTime || ""}`.trim();
}

function moveSelectedDate(days) { selectDate(addDays(fromDateKey(state.selectedDate), days)); }

function navigateCalendar(direction = 1) {
  // Narrow todo strip always steps by day so date picking matches "当天待办".
  const view = document.body.classList.contains("shell-focus") ? "day" : state.taskView;
  if (!NavigationPolicy.shouldShowDateNav(view)) return;
  const nextKey = NavigationPolicy.moveDateKey({
    dateKey: state.selectedDate,
    view,
    direction,
    addDays,
    fromDateKey,
    toDateKey,
    getMonday
  });
  selectDate(fromDateKey(nextKey));
}

function updateDateNavigationChrome() {
  const view = document.body.classList.contains("shell-focus") ? "day" : state.taskView;
  const showNav = NavigationPolicy.shouldShowDateNav(view);
  el.dateControls?.classList.toggle("date-controls-hidden-nav", !showNav);
  el.dateNavPrev?.classList.toggle("hidden", !showNav);
  el.dateNavNext?.classList.toggle("hidden", !showNav);
  const labels = NavigationPolicy.navLabels(view);
  el.dateNavPrev?.setAttribute("aria-label", labels.prev);
  el.dateNavNext?.setAttribute("aria-label", labels.next);
  if (el.monthLabel) {
    const date = fromDateKey(state.selectedDate);
    if (document.body.classList.contains("shell-focus")) {
      el.monthLabel.textContent = date
        ? `${date.getMonth() + 1}月${date.getDate()}日 · ${WEEKDAY_NAMES[date.getDay()]}`
        : "";
    } else if (document.body.classList.contains("shell-narrow") && date && view === "day") {
      el.monthLabel.textContent = `${date.getMonth() + 1}月${date.getDate()}日 · ${WEEKDAY_NAMES[date.getDay()]}`;
    } else {
      el.monthLabel.textContent = NavigationPolicy.formatNavTitle({
        view: state.taskView,
        dateKey: state.selectedDate,
        fromDateKey,
        toDateKey,
        getMonday,
        addDays
      });
    }
  }
}

function selectDate(date) {
  state.selectedDate = toDateKey(date);
  if (state.taskView === "project") {
    state.projectAnchorDate = isToday(date) ? toDateKey(new Date()) : state.selectedDate;
    if (isToday(date)) state.projectViewNeedsAnchor = true;
  }
  render();
  el.timelineWrap.scrollTop = 0;
}

function goToTodayDayView() {
  state.taskView = "day";
  state.selectedDate = toDateKey(new Date());
  state.projectViewNeedsAnchor = false;
  el.viewSwitcher?.querySelectorAll("button[data-view]").forEach(item => {
    item.classList.toggle("active", item.dataset.view === "day");
  });
  render();
  el.timelineWrap.scrollTop = 0;
  requestAnimationFrame(scrollToWorkday);
}

function scrollToWorkday() {
  if (!isToday(fromDateKey(state.selectedDate))) return;
  const hours = getVisibleTimelineHours(getDay().entries || []);
  if (!hours.length) return;
  const nowHour = new Date().getHours();
  const anchor = hours.includes(nowHour) ? nowHour : hours[0];
  el.timelineWrap.scrollTop = Math.max(0, (anchor - hours[0] - 1) * getHourHeight());
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
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";
  if (numeric >= 24) return "24:00";
  const hour = Math.floor(numeric);
  const minute = Math.round((numeric - hour) * 60);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
function formatHours(value) { return `${trimNumber(value)} 小时`; }
function trimNumber(value) { return Number.isInteger(value) ? value : value.toFixed(1); }
function getHourHeight() { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--hour-height")); }
function escapeHtml(value) { const div = document.createElement("div"); div.textContent = value; return div.innerHTML; }
