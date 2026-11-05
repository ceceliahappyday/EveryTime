(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.TodoListPolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  const FILTER_STORAGE_KEY = "today-planner-task-filter";
  const DEFAULT_FILTER = "in_progress";
  const VALID_FILTERS = new Set(["all", "unplanned", "planned", "in_progress", "memo", "meeting", "ended"]);

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
    if (task.status === "tracking") return false;
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

  function taskCreatedAtMs(task) {
    const iso = task?.createdAtIso || task?.updatedAt || "";
    const ms = Date.parse(iso);
    return Number.isFinite(ms) ? ms : 0;
  }

  function taskDueSortKey(task) {
    const date = String(task?.dueDate || "").trim() || "9999-12-31";
    const time = String(task?.dueTime || "").trim() || "99:99";
    return `${date} ${time}`;
  }

  function sortByCreatedAtDesc(tasks = []) {
    return [...tasks].sort((a, b) =>
      taskCreatedAtMs(b) - taskCreatedAtMs(a) ||
      String(b.id || "").localeCompare(String(a.id || "")) ||
      String(a.title || "").localeCompare(String(b.title || ""))
    );
  }

  /** Oldest created first — unplanned inbox and closed archive. */
  function sortByCreatedAtAsc(tasks = []) {
    return [...tasks].sort((a, b) =>
      taskCreatedAtMs(a) - taskCreatedAtMs(b) ||
      String(a.id || "").localeCompare(String(b.id || "")) ||
      String(a.title || "").localeCompare(String(b.title || ""))
    );
  }

  /** Earliest due date/time first; missing due dates sink to the end. */
  function sortByDueDateAsc(tasks = []) {
    return [...tasks].sort((a, b) =>
      taskDueSortKey(a).localeCompare(taskDueSortKey(b)) ||
      taskCreatedAtMs(a) - taskCreatedAtMs(b) ||
      String(a.id || "").localeCompare(String(b.id || "")) ||
      String(a.title || "").localeCompare(String(b.title || ""))
    );
  }

  /** Meeting list tabs: earliest schedule first (past/near top → future below). */
  function compareMeetingScheduleAsc(a, b) {
    return (
      String(a?.dateKey || "").localeCompare(String(b?.dateKey || "")) ||
      Number(a?.start) - Number(b?.start) ||
      String(a?.title || "").localeCompare(String(b?.title || ""), "zh-CN")
    );
  }

  function sortMeetingsByScheduleAsc(meetings = []) {
    return [...meetings].sort(compareMeetingScheduleAsc);
  }

  const MEETING_ALL_SECTION_ORDER = ["planned", "in_progress", "ended"];
  const MEETING_ALL_SECTION_LABELS = {
    planned: "计划中",
    in_progress: "进行中",
    ended: "已结束"
  };

  /** 全部会议：计划中 → 进行中 → 已结束；组内按开始时间由早到晚。 */
  function buildMeetingAllSections(meetings = [], { getPhase = item => item?.phase || "planned" } = {}) {
    const buckets = { planned: [], in_progress: [], ended: [] };
    meetings.forEach(item => {
      const phase = getPhase(item);
      if (buckets[phase]) buckets[phase].push(item);
    });
    return MEETING_ALL_SECTION_ORDER.map(key => ({
      key: `meeting-${key}`,
      label: MEETING_ALL_SECTION_LABELS[key],
      tasks: sortMeetingsByScheduleAsc(buckets[key])
    })).filter(section => section.tasks.length);
  }

  const ALL_STATUS_SECTION_ORDER = ["in_progress", "planned", "unplanned", "tracking", "ended"];
  const ALL_STATUS_SECTION_LABELS = {
    in_progress: "进行中",
    planned: "计划中",
    unplanned: "未计划",
    tracking: "待跟踪",
    ended: "已关闭"
  };

  function classifyTodoStatusBucket(task, {
    isOngoingTask = () => false,
    isUnplannedTask = () => false,
    isAttentionOnly = () => false,
    isEndedStatus = status => status === "done" || status === "closed"
  } = {}) {
    if (!task) return "";
    if (isEndedStatus(task.status)) return "ended";
    if (isAttentionOnly(task)) return "tracking";
    if (isOngoingTask(task)) return "in_progress";
    if (isUnplannedTask(task)) return "unplanned";
    return "planned";
  }

  /** 全部任务：进行中 → 计划中 → 未计划 → 待跟踪 → 已关闭，各组内按规则排序。 */
  function buildStatusSections({
    tasks = [],
    entriesByDate = {},
    isOngoingTask = () => false,
    isUnplannedTask = () => false,
    isAttentionOnly = () => false,
    isEndedStatus = status => status === "done" || status === "closed"
  } = {}) {
    const buckets = {
      in_progress: [],
      planned: [],
      unplanned: [],
      tracking: [],
      ended: []
    };
    tasks.forEach(task => {
      const key = classifyTodoStatusBucket(task, {
        isOngoingTask,
        isUnplannedTask,
        isAttentionOnly,
        isEndedStatus
      });
      if (buckets[key]) buckets[key].push(task);
    });
    return ALL_STATUS_SECTION_ORDER.map(key => {
      let sorted;
      if (key === "in_progress") sorted = sortByLatestInvestDesc(buckets[key], entriesByDate);
      else if (key === "planned" || key === "tracking") sorted = sortByDueDateAsc(buckets[key]);
      else sorted = sortByCreatedAtAsc(buckets[key]);
      return { key, label: ALL_STATUS_SECTION_LABELS[key], tasks: sorted };
    }).filter(section => section.tasks.length);
  }

  /** Latest schedule invest instant for a task (dateKey + end/start hour). */
  function taskLatestInvestMs(taskId, entriesByDate = {}) {
    if (!taskId) return 0;
    let best = 0;
    Object.entries(entriesByDate).forEach(([dateKey, entries]) => {
      (entries || []).forEach(entry => {
        if (!entry || entry.taskId !== taskId) return;
        if (entry.entryType && entry.entryType !== "task_work") return;
        const end = Number(entry.end);
        const start = Number(entry.start);
        const hour = Number.isFinite(end) ? end : start;
        let ms = 0;
        if (Number.isFinite(hour)) {
          const hours = Math.floor(hour);
          const minutes = Math.round((hour % 1) * 60);
          ms = Date.parse(
            `${dateKey}T${String(hours).padStart(2, "0")}:${String(Math.min(59, Math.max(0, minutes))).padStart(2, "0")}:00`
          );
        } else {
          ms = Date.parse(`${dateKey}T00:00:00`);
        }
        if (Number.isFinite(ms) && ms > best) best = ms;
      });
    });
    return best;
  }

  function sortByLatestInvestDesc(tasks = [], entriesByDate = {}) {
    return [...tasks].sort((a, b) =>
      taskLatestInvestMs(b?.id, entriesByDate) - taskLatestInvestMs(a?.id, entriesByDate) ||
      taskCreatedAtMs(b) - taskCreatedAtMs(a) ||
      String(b?.id || "").localeCompare(String(a?.id || "")) ||
      String(a?.title || "").localeCompare(String(b?.title || ""))
    );
  }

  function pickEarliestIso(values = []) {
    return [...values]
      .map(value => String(value || "").trim())
      .filter(Boolean)
      .sort()[0] || "";
  }

  function pickLatestIso(values = []) {
    const list = [...values]
      .map(value => String(value || "").trim())
      .filter(Boolean)
      .sort();
    return list[list.length - 1] || "";
  }

  function taskDueStamp(task = {}) {
    const date = String(task?.dueDate || "").trim();
    if (!date) return "";
    const time = String(task?.dueTime || "").trim() || "00:00";
    return `${date}T${time}`;
  }

  /** Keep survivor category/owner/priority; roll text + earliest start / latest end / latest due. */
  function mergeTaskFieldUpdates(survivor = {}, sources = []) {
    const pool = [survivor, ...(sources || []).filter(Boolean)];
    const pickText = key => {
      const parts = [];
      pool.forEach(task => {
        const text = String(task?.[key] || "").trim();
        if (!text || parts.includes(text)) return;
        parts.push(text);
      });
      return parts.join("\n\n");
    };
    const earliestStart = pickEarliestIso(pool.flatMap(task => [task.startOverrideAt, task.startedAt]));
    const latestEnd = pickLatestIso(pool.map(task => task.completedAt));
    const dueSorted = pool
      .filter(task => String(task?.dueDate || "").trim())
      .sort((a, b) => taskDueStamp(a).localeCompare(taskDueStamp(b)));
    const latestDue = dueSorted[dueSorted.length - 1] || null;
    const progress = Math.max(0, ...pool.map(task => Number(task.progress) || 0));
    return {
      description: pickText("description"),
      businessBackground: pickText("businessBackground"),
      problemReason: pickText("problemReason"),
      deliveryNote: pickText("deliveryNote"),
      startedAt: earliestStart || survivor.startedAt || "",
      startOverrideAt: earliestStart || survivor.startOverrideAt || "",
      completedAt: latestEnd || survivor.completedAt || "",
      dueDate: latestDue?.dueDate || survivor.dueDate || "",
      dueTime: latestDue ? (latestDue.dueTime || "") : (survivor.dueTime || ""),
      progress,
      category: survivor.category,
      color: survivor.color,
      priority: survivor.priority,
      owner: survivor.owner,
      parentId: survivor.parentId || ""
    };
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
    progressReviewCandidates,
    taskCreatedAtMs,
    taskDueSortKey,
    sortByCreatedAtDesc,
    sortByCreatedAtAsc,
    sortByDueDateAsc,
    compareMeetingScheduleAsc,
    sortMeetingsByScheduleAsc,
    MEETING_ALL_SECTION_ORDER,
    MEETING_ALL_SECTION_LABELS,
    buildMeetingAllSections,
    ALL_STATUS_SECTION_ORDER,
    ALL_STATUS_SECTION_LABELS,
    classifyTodoStatusBucket,
    buildStatusSections,
    taskLatestInvestMs,
    sortByLatestInvestDesc,
    pickEarliestIso,
    pickLatestIso,
    taskDueStamp,
    mergeTaskFieldUpdates
  };
});
