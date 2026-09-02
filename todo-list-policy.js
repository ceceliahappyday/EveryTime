(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.TodoListPolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  const FILTER_STORAGE_KEY = "today-planner-task-filter";
  const DEFAULT_FILTER = "in_progress";
  const VALID_FILTERS = new Set(["all", "unplanned", "planned", "in_progress", "ended"]);

  function normalizeTitle(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function hasDisplayTitle(value) {
    return Boolean(String(value || "").trim());
  }

  function isLeafTask(task, hasChildTasks) {
    return !!task && !hasChildTasks(task.id);
  }

  function canLinkEntryToTask(task, hasChildTasks) {
    return isLeafTask(task, hasChildTasks);
  }

  function loadSavedFilter() {
    const saved = String(typeof localStorage !== "undefined" ? localStorage.getItem(FILTER_STORAGE_KEY) || "" : "").trim();
    return VALID_FILTERS.has(saved) ? saved : DEFAULT_FILTER;
  }

  function saveFilter(filter) {
    if (typeof localStorage !== "undefined" && VALID_FILTERS.has(filter)) {
      localStorage.setItem(FILTER_STORAGE_KEY, filter);
    }
  }

  function findSimilarTasks({ title = "", tasks = [], hasChildTasks = () => false, excludeId = "", limit = 5 } = {}) {
    const normalized = normalizeTitle(title);
    if (!normalized) return [];
    return tasks
      .filter(task => task?.id && task.id !== excludeId)
      .filter(task => isLeafTask(task, hasChildTasks))
      .map(task => {
        const candidate = normalizeTitle(task.title);
        let score = 0;
        if (candidate === normalized) score = 100;
        else if (candidate.includes(normalized) || normalized.includes(candidate)) score = 80;
        else {
          const queryWords = normalized.split(" ").filter(Boolean);
          const titleWords = candidate.split(" ").filter(Boolean);
          const overlap = queryWords.filter(word => titleWords.some(part => part.includes(word) || word.includes(part))).length;
          if (overlap) score = 50 + overlap * 10;
        }
        return { task, score };
      })
      .filter(item => item.score >= 50)
      .sort((a, b) => b.score - a.score || String(a.task.title).localeCompare(String(b.task.title)))
      .slice(0, limit);
  }

  function taskIdsWithWorkOnDate(entriesByDate = {}, dateKey = "") {
    const ids = new Set();
    (entriesByDate[dateKey] || []).forEach(entry => {
      if (entry?.taskId && entry.entryType === "task_work") ids.add(entry.taskId);
    });
    return ids;
  }

  function collectTaskIdsWithWork(entriesByDate = {}) {
    const ids = new Set();
    Object.values(entriesByDate).forEach(day => {
      (day || []).forEach(entry => {
        if (entry?.taskId && entry.entryType === "task_work") ids.add(entry.taskId);
      });
    });
    return ids;
  }

  function hasWorkHistory(taskId, entriesByDate = {}) {
    if (!taskId) return false;
    return Object.values(entriesByDate).some(day =>
      (day || []).some(entry => entry.taskId === taskId && entry.entryType === "task_work")
    );
  }

  function parentLinkedWorkItems({
    entriesByDate = {},
    tasks = [],
    selectedDate = "",
    yesterdayKey = "",
    hasChildTasks = () => false
  } = {}) {
    const taskById = new Map(tasks.map(task => [task.id, task]));
    const latestByKey = new Map();
    Object.entries(entriesByDate)
      .filter(([dateKey]) => !selectedDate || dateKey <= selectedDate)
      .sort(([left], [right]) => left.localeCompare(right))
      .forEach(([dateKey, entries]) => {
        (entries || []).forEach(entry => {
          if (entry?.entryType !== "task_work" || !entry.taskId || !entry.title) return;
          const parentTask = taskById.get(entry.taskId);
          if (!parentTask || !hasChildTasks(parentTask.id) || ["done", "closed"].includes(parentTask.status)) return;
          const key = `${entry.taskId}::${normalizeTitle(entry.title)}`;
          const previous = latestByKey.get(key);
          const currentIsYesterday = dateKey === yesterdayKey;
          const keepYesterdaySource = previous?.isFromYesterday && !currentIsYesterday;
          latestByKey.set(key, {
            entryId: keepYesterdaySource ? previous.entryId : entry.id,
            taskId: entry.taskId,
            title: entry.title,
            parentTitle: parentTask.title || "未命名计划",
            dateKey: keepYesterdaySource ? previous.dateKey : dateKey,
            isFromYesterday: Boolean(previous?.isFromYesterday || currentIsYesterday)
          });
        });
      });
    return [...latestByKey.values()].sort((a, b) =>
      Number(b.isFromYesterday) - Number(a.isFromYesterday) ||
      b.dateKey.localeCompare(a.dateKey) ||
      a.title.localeCompare(b.title)
    );
  }

  function isAwaitingSchedule({ task, selectedDate = "", entriesByDate = {}, isUnplannedTask = () => false, isOngoingTask = () => false, hasChildTasks = () => false }) {
    if (!task || !isLeafTask(task, hasChildTasks)) return false;
    if (isOngoingTask(task)) return false;
    if (["done", "closed"].includes(task.status)) return false;
    if (task.status === "tracking") return true;
    if (isUnplannedTask(task)) return true;
    if (task.status !== "planned") return false;
    const hasTodayWork = (entriesByDate[selectedDate] || []).some(entry => entry.taskId === task.id && entry.entryType === "task_work");
    return !hasTodayWork;
  }

  function buildTodoGroups({
    tasks = [],
    selectedDate = "",
    yesterdayKey = "",
    entriesByDate = {},
    isOngoingTask = () => false,
    isUnplannedTask = () => false,
    hasChildTasks = () => false,
    includeSections = true
  } = {}) {
    const continueToday = [];
    const continueYesterday = [];
    const awaitingSchedule = [];
    const assigned = new Set();

    if (includeSections) {
      const yesterdayIds = taskIdsWithWorkOnDate(entriesByDate, yesterdayKey);
      tasks.forEach(task => {
        if (!yesterdayIds.has(task.id)) return;
        if (["done", "closed"].includes(task.status)) return;
        continueYesterday.push(task);
        assigned.add(task.id);
      });

      tasks.forEach(task => {
        if (assigned.has(task.id)) return;
        if (!isOngoingTask(task)) return;
        continueToday.push(task);
        assigned.add(task.id);
      });

      tasks.forEach(task => {
        if (assigned.has(task.id)) return;
        if (!isAwaitingSchedule({ task, selectedDate, entriesByDate, isUnplannedTask, isOngoingTask, hasChildTasks })) return;
        awaitingSchedule.push(task);
        assigned.add(task.id);
      });
    }

    const remaining = tasks.filter(task => !assigned.has(task.id));
    return { continueToday, continueYesterday, awaitingSchedule, remaining };
  }

  function sectionLabels() {
    return {
      continueToday: "今日可继续",
      continueYesterday: "继续昨天",
      awaitingSchedule: "待排期"
    };
  }

  function flattenGroups(groups, { showEmptySections = false } = {}) {
    const labels = sectionLabels();
    const sections = [
      { key: "continueToday", label: labels.continueToday, tasks: groups.continueToday || [] },
      { key: "continueYesterday", label: labels.continueYesterday, tasks: groups.continueYesterday || [] },
      { key: "awaitingSchedule", label: labels.awaitingSchedule, tasks: groups.awaitingSchedule || [] },
      { key: "remaining", label: "", tasks: groups.remaining || [] }
    ];
    return sections.filter(section => section.tasks.length || (showEmptySections && section.label));
  }

  function shouldKeepVisibleWithWorkHistory({ task, filter = "all", hasWorkHistoryFn = () => false, isOngoingTask = () => false }) {
    if (!task || ["done", "closed"].includes(task.status)) return false;
    if (filter === "ended") return false;
    if (filter === "in_progress") return isOngoingTask(task);
    if (filter === "all") return true;
    if (hasWorkHistoryFn(task.id) && isOngoingTask(task)) return filter === "planned" || filter === "all";
    return true;
  }

  function isProgressReviewCandidate({
    task,
    hasChildTasks = () => false,
    isActive = () => false,
    hasInvestedWork = () => false
  } = {}) {
    if (!task || !isLeafTask(task, hasChildTasks)) return false;
    if (!isActive(task)) return false;
    return !!hasInvestedWork(task);
  }

  function progressReviewCandidates({
    tasks = [],
    hasChildTasks = () => false,
    isActive = () => false,
    hasInvestedWork = () => false,
    sortBy = null
  } = {}) {
    const list = tasks.filter(task => isProgressReviewCandidate({
      task,
      hasChildTasks,
      isActive,
      hasInvestedWork
    }));
    if (typeof sortBy === "function") list.sort(sortBy);
    return list;
  }

  return {
    FILTER_STORAGE_KEY,
    DEFAULT_FILTER,
    VALID_FILTERS,
    normalizeTitle,
    hasDisplayTitle,
    isLeafTask,
    canLinkEntryToTask,
    loadSavedFilter,
    saveFilter,
    findSimilarTasks,
    taskIdsWithWorkOnDate,
    collectTaskIdsWithWork,
    hasWorkHistory,
    parentLinkedWorkItems,
    isAwaitingSchedule,
    buildTodoGroups,
    flattenGroups,
    sectionLabels,
    shouldKeepVisibleWithWorkHistory,
    isProgressReviewCandidate,
    progressReviewCandidates
  };
});
