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

  function defaultConfig() {
    return {
      holidayMode: "weekend_holiday",
      excludeHolidaysFromDays: false,
      ownerFilter: []
    };
  }

  function normalizeConfig(raw = {}) {
    const base = defaultConfig();
    const mode = HOLIDAY_MODES.some(item => item.id === raw.holidayMode)
      ? raw.holidayMode
      : base.holidayMode;
    const owners = Array.isArray(raw.ownerFilter)
      ? [...new Set(raw.ownerFilter.map(item => String(item || "").trim()).filter(Boolean))]
      : [];
    return {
      holidayMode: mode,
      excludeHolidaysFromDays: Boolean(raw.excludeHolidaysFromDays),
      ownerFilter: owners
    };
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
    // weekend_holiday: weekend or statutory holiday, minus makeup workdays
    if (entry?.type === "workday") return false;
    if (entry?.type === "holiday") return true;
    return weekend;
  }

  return {
    STORAGE_KEY,
    HOLIDAY_MODES,
    defaultConfig,
    normalizeConfig,
    loadConfig,
    saveConfig,
    collectOwners,
    taskMatchesOwnerFilter,
    isWeekendDate,
    isHolidayColumn
  };
});
