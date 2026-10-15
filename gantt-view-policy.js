(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.GanttViewPolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  const STORAGE_KEY = "today-planner-gantt-view-v1";

  const HOLIDAY_MODES = [
    { id: "off", label: "不显示" },
    { id: "weekend", label: "仅周六日" },
    { id: "weekend_holiday", label: "周六日 + 法定节假日" }
  ];

  const STATUS_FILTER_OPTIONS = [
    { id: "planned", label: "计划中" },
    { id: "in_progress", label: "进行中" },
    { id: "tracking", label: "待跟踪" },
    { id: "done", label: "已关闭" }
  ];

  const PRIORITY_FILTER_OPTIONS = [
    { id: "general_daily", label: "一般日常" },
    { id: "kpi", label: "KPI" },
    { id: "important_urgent", label: "重要紧急" },
    { id: "paused", label: "中止暂停" },
    { id: "monthly_fixed", label: "每月例行" }
  ];

  const LABEL_COLUMN_OPTIONS = [
    { id: "status", label: "状态" },
    { id: "priority", label: "优先级" },
    { id: "owner", label: "责任人" },
    { id: "category", label: "分类" }
  ];

  const DEFAULT_STATUS_FILTER = ["planned", "in_progress"];

  function uniqStrings(values = []) {
    return [...new Set((values || []).map(item => String(item || "").trim()).filter(Boolean))];
  }

  function defaultLabelColumns() {
    return { status: false, priority: false, owner: false, category: false };
  }

  function normalizeLabelColumns(raw = {}) {
    const base = defaultLabelColumns();
    if (!raw || typeof raw !== "object") return base;
    return {
      status: Boolean(raw.status),
      priority: Boolean(raw.priority),
      owner: Boolean(raw.owner),
      category: Boolean(raw.category)
    };
  }

  /** Member filters only apply when their display column is enabled. */
  function effectiveMemberFilters(config = {}) {
    const view = normalizeConfig(config);
    const cols = view.labelColumns;
    return {
      ownerFilter: cols.owner ? view.ownerFilter : [],
      categoryFilter: cols.category ? view.categoryFilter : [],
      priorityFilter: cols.priority ? view.priorityFilter : [],
      statusFilter: cols.status ? view.statusFilter : []
    };
  }

  function enabledLabelColumns(config = {}) {
    const cols = normalizeLabelColumns(config.labelColumns || config);
    return LABEL_COLUMN_OPTIONS.filter(opt => cols[opt.id]);
  }

  function activeLabelColumnCount(config = {}) {
    return enabledLabelColumns(config).length;
  }

  function defaultConfig() {
    return {
      holidayMode: "weekend_holiday",
      excludeHolidaysFromDays: false,
      ownerFilter: [],
      categoryFilter: [],
      statusFilter: [...DEFAULT_STATUS_FILTER],
      priorityFilter: [],
      investedOnly: false,
      showMeetings: true,
      labelColumns: defaultLabelColumns()
    };
  }

  function normalizeStatusFilter(raw) {
    // undefined → first-load default; explicit [] → show all statuses
    if (raw === undefined) return [...DEFAULT_STATUS_FILTER];
    if (!Array.isArray(raw)) return [...DEFAULT_STATUS_FILTER];
    const allowed = new Set(STATUS_FILTER_OPTIONS.map(item => item.id));
    return uniqStrings(raw.map(item => (item === "closed" ? "done" : item))).filter(id => allowed.has(id));
  }

  function normalizePriorityFilter(raw) {
    if (!Array.isArray(raw)) return [];
    const allowed = new Set(PRIORITY_FILTER_OPTIONS.map(item => item.id));
    return uniqStrings(raw.map(item => (item === "follow_up" ? "general_daily" : item)))
      .filter(id => allowed.has(id));
  }

  function normalizeConfig(raw = {}) {
    const base = defaultConfig();
    const mode = HOLIDAY_MODES.some(item => item.id === raw.holidayMode)
      ? raw.holidayMode
      : base.holidayMode;
    return {
      holidayMode: mode,
      excludeHolidaysFromDays: Boolean(raw.excludeHolidaysFromDays),
      ownerFilter: uniqStrings(raw.ownerFilter),
      categoryFilter: uniqStrings(raw.categoryFilter),
      statusFilter: normalizeStatusFilter(raw.statusFilter),
      priorityFilter: normalizePriorityFilter(raw.priorityFilter),
      investedOnly: Boolean(raw.investedOnly),
      showMeetings: raw.showMeetings === undefined ? true : Boolean(raw.showMeetings),
      labelColumns: normalizeLabelColumns(raw.labelColumns)
    };
  }

  /** True when any invested date falls inside the visible axis window. */
  function taskHasInvestedInWindow({
    investedDateKeys = [],
    startKey = "",
    endKey = "",
    scale = "day"
  } = {}) {
    const keys = (investedDateKeys || []).map(key => String(key || "").trim()).filter(Boolean);
    if (!keys.length) return false;
    if (!startKey || !endKey) return true;
    if (scale === "year") {
      const startMonth = String(startKey).slice(0, 7);
      const endMonth = String(endKey).slice(0, 7);
      return keys.some(key => {
        const month = key.slice(0, 7);
        return month >= startMonth && month <= endMonth;
      });
    }
    return keys.some(key => key >= startKey && key <= endKey);
  }

  function normalizeTaskStatus(status = "") {
    if (status === "closed") return "done";
    return status || "planned";
  }

  function normalizeTaskPriority(priority = "") {
    if (priority === "follow_up") return "general_daily";
    return priority || "general_daily";
  }

  function taskMatchesStatusFilter(task, statusFilter = []) {
    if (!statusFilter.length) return true;
    return statusFilter.includes(normalizeTaskStatus(task?.status));
  }

  function taskMatchesCategoryFilter(task, categoryFilter = [], resolveCategory) {
    if (!categoryFilter.length) return true;
    const category = typeof resolveCategory === "function"
      ? resolveCategory(task)
      : (task?.category || "");
    return categoryFilter.includes(String(category || "").trim());
  }

  function taskMatchesPriorityFilter(task, priorityFilter = []) {
    if (!priorityFilter.length) return true;
    return priorityFilter.includes(normalizeTaskPriority(task?.priority));
  }

  function loadConfig(storage = typeof localStorage !== "undefined" ? localStorage : null) {
    try {
      const raw = storage?.getItem?.(STORAGE_KEY);
      if (!raw) return defaultConfig();
      return normalizeConfig(JSON.parse(raw));
    } catch (_) {
      return defaultConfig();
    }
  }

  function saveConfig(config, storage = typeof localStorage !== "undefined" ? localStorage : null) {
    const next = normalizeConfig(config);
    try {
      storage?.setItem?.(STORAGE_KEY, JSON.stringify(next));
    } catch (_) { /* ignore */ }
    return next;
  }

  function collectOwners(tasks = [], splitOwnerMembers = owner => [owner]) {
    const set = new Set();
    tasks.forEach(task => {
      const parts = typeof splitOwnerMembers === "function"
        ? splitOwnerMembers(task?.owner)
        : [task?.owner];
      (parts || []).forEach(name => {
        const value = String(name || "").trim();
        if (value && value !== "未指定") set.add(value);
      });
    });
    return [...set].sort((a, b) => a.localeCompare(b, "zh"));
  }

  function taskMatchesOwnerFilter(task, ownerFilter = [], splitOwnerMembers) {
    if (!ownerFilter.length) return true;
    const split = typeof splitOwnerMembers === "function"
      ? splitOwnerMembers
      : owner => String(owner || "").split(/[,，;；]/).map(part => part.trim()).filter(Boolean);
    const members = split(task?.owner);
    if (!members.length) return false;
    return ownerFilter.some(selected => {
      const needle = String(selected || "").trim();
      if (!needle) return false;
      return members.some(member => member === needle || member.includes(needle) || needle.includes(member));
    });
  }

  function taskMatchesFilters(task, {
    ownerFilter = [],
    categoryFilter = [],
    statusFilter = [],
    priorityFilter = [],
    investedOnly = false,
    investedDateKeys = [],
    startKey = "",
    endKey = "",
    scale = "day",
    splitOwnerMembers,
    resolveCategory
  } = {}) {
    if (!taskMatchesOwnerFilter(task, ownerFilter, splitOwnerMembers)) return false;
    if (!taskMatchesCategoryFilter(task, categoryFilter, resolveCategory)) return false;
    if (!taskMatchesStatusFilter(task, statusFilter)) return false;
    if (!taskMatchesPriorityFilter(task, priorityFilter)) return false;
    if (!investedOnly) return true;
    return taskHasInvestedInWindow({ investedDateKeys, startKey, endKey, scale });
  }

  /**
   * Keep matching tasks plus ancestors so the tree does not break.
   * Returns { children, matchIds, contextIds }.
   */
  function filterProjectTree({
    parent,
    children = [],
    matchesTask = () => true
  } = {}) {
    const all = [parent, ...(children || [])].filter(Boolean);
    const byId = new Map(all.map(task => [task.id, task]));
    const matchIds = new Set();
    all.forEach(task => {
      if (task?.id && matchesTask(task)) matchIds.add(task.id);
    });
    if (!matchIds.size) {
      return { children: [], matchIds, contextIds: new Set(), keep: false };
    }
    const keepIds = new Set(matchIds);
    if (parent?.id) keepIds.add(parent.id);
    matchIds.forEach(id => {
      let current = byId.get(id);
      const seen = new Set();
      while (current?.parentId && byId.has(current.parentId) && !seen.has(current.parentId)) {
        seen.add(current.parentId);
        keepIds.add(current.parentId);
        current = byId.get(current.parentId);
      }
    });
    const contextIds = new Set([...keepIds].filter(id => !matchIds.has(id)));
    return {
      children: (children || []).filter(task => keepIds.has(task.id)),
      matchIds,
      contextIds,
      keep: true
    };
  }

  function activeFilterCount(config = {}) {
    const view = normalizeConfig(config);
    const members = effectiveMemberFilters(view);
    const defaultStatuses = DEFAULT_STATUS_FILTER.slice().sort().join(",");
    const currentStatuses = members.statusFilter.slice().sort().join(",");
    let count = 0;
    if (view.investedOnly) count += 1;
    if (!view.showMeetings) count += 1;
    count += members.ownerFilter.length;
    count += members.categoryFilter.length;
    count += members.priorityFilter.length;
    if (view.labelColumns.status && currentStatuses !== defaultStatuses) count += 1;
    return count;
  }

  function columnFilterActiveCount(config = {}, columnId = "") {
    const view = normalizeConfig(config);
    const members = effectiveMemberFilters(view);
    if (columnId === "owner") return members.ownerFilter.length;
    if (columnId === "category") return members.categoryFilter.length;
    if (columnId === "priority") return members.priorityFilter.length;
    if (columnId === "status") {
      if (!view.labelColumns.status) return 0;
      const defaultStatuses = DEFAULT_STATUS_FILTER.slice().sort().join(",");
      const currentStatuses = members.statusFilter.slice().sort().join(",");
      if (!members.statusFilter.length) return 0;
      return currentStatuses === defaultStatuses ? 0 : 1;
    }
    return 0;
  }

  function isWeekendDate(dateKey, fromDateKey) {
    if (!dateKey || typeof fromDateKey !== "function") return false;
    const date = fromDateKey(dateKey);
    if (!date || Number.isNaN(date.getTime?.() ?? date)) return false;
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  function isHolidayColumn({
    dateKey,
    holidayMode = "weekend_holiday",
    holidays = {},
    fromDateKey
  } = {}) {
    if (!dateKey || holidayMode === "off") return false;
    const entry = holidays[dateKey];
    const weekend = isWeekendDate(dateKey, fromDateKey);
    if (holidayMode === "weekend") return weekend && entry?.type !== "workday";
    if (entry?.type === "workday") return false;
    if (entry?.type === "holiday") return true;
    return weekend;
  }

  return {
    STORAGE_KEY,
    HOLIDAY_MODES,
    STATUS_FILTER_OPTIONS,
    PRIORITY_FILTER_OPTIONS,
    LABEL_COLUMN_OPTIONS,
    DEFAULT_STATUS_FILTER,
    defaultConfig,
    normalizeConfig,
    normalizeLabelColumns,
    enabledLabelColumns,
    activeLabelColumnCount,
    effectiveMemberFilters,
    loadConfig,
    saveConfig,
    collectOwners,
    taskMatchesOwnerFilter,
    taskMatchesStatusFilter,
    taskMatchesCategoryFilter,
    taskMatchesPriorityFilter,
    taskMatchesFilters,
    taskHasInvestedInWindow,
    filterProjectTree,
    activeFilterCount,
    columnFilterActiveCount,
    isWeekendDate,
    isHolidayColumn
  };
});
