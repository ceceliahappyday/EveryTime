(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.ScheduleHoursPolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  const DEFAULT_WORK_START = 9;
  const DEFAULT_WORK_END = 18;
  const DAY_HOURS = 24;

  function clampInt(value, min, max, fallback) {
    const num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    return Math.max(min, Math.min(max, Math.floor(num)));
  }

  function normalizeWorkHours({ workStartHour = DEFAULT_WORK_START, workEndHour = DEFAULT_WORK_END } = {}) {
    let start = clampInt(workStartHour, 0, 23, DEFAULT_WORK_START);
    let end = clampInt(workEndHour, 1, 24, DEFAULT_WORK_END);
    if (end <= start) end = Math.min(DAY_HOURS, start + 1);
    return { workStartHour: start, workEndHour: end };
  }

  function hoursTouchedByEntries(entries = []) {
    const hours = new Set();
    (entries || []).forEach(entry => {
      const start = Number(entry?.start);
      const end = Number(entry?.end);
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return;
      const from = Math.max(0, Math.floor(start));
      const to = Math.min(DAY_HOURS, Math.ceil(end));
      for (let hour = from; hour < to; hour += 1) hours.add(hour);
    });
    return hours;
  }

  function visibleTimelineHours({
    workStartHour = DEFAULT_WORK_START,
    workEndHour = DEFAULT_WORK_END,
    entries = []
  } = {}) {
    const work = normalizeWorkHours({ workStartHour, workEndHour });
    const occupied = hoursTouchedByEntries(entries);
    let lo = work.workStartHour;
    let hi = work.workEndHour;
    occupied.forEach(hour => {
      lo = Math.min(lo, hour);
      hi = Math.max(hi, hour + 1);
    });
    lo = Math.max(0, lo);
    hi = Math.min(DAY_HOURS, Math.max(lo + 1, hi));
    return Array.from({ length: hi - lo }, (_, index) => lo + index);
  }

  /** End-boundary label after the last hour slot (e.g. slots 9–17 → label 18:00). */
  function timelineEndLabelHour(hours = [], fallback = DEFAULT_WORK_END) {
    if (!Array.isArray(hours) || !hours.length) return clampInt(fallback, 1, DAY_HOURS, DEFAULT_WORK_END);
    return Math.min(DAY_HOURS, hours[hours.length - 1] + 1);
  }

  function isWeekendDayIndex(dayIndex = 0) {
    return Number(dayIndex) >= 5;
  }

  function shouldShowWeekColumn({ dayIndex = 0, hasActivity = false } = {}) {
    if (!isWeekendDayIndex(dayIndex)) return true;
    return !!hasActivity;
  }

  function visibleWeekDayIndexes({ hasActivityByIndex = () => false } = {}) {
    return Array.from({ length: 7 }, (_, index) => index).filter(index =>
      shouldShowWeekColumn({ dayIndex: index, hasActivity: hasActivityByIndex(index) })
    );
  }

  return {
    DEFAULT_WORK_START,
    DEFAULT_WORK_END,
    DAY_HOURS,
    normalizeWorkHours,
    hoursTouchedByEntries,
    visibleTimelineHours,
    timelineEndLabelHour,
    isWeekendDayIndex,
    shouldShowWeekColumn,
    visibleWeekDayIndexes
  };
});
