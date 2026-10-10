(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.ScheduleHoursPolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  const DEFAULT_WORK_START = 8.5;
  const DEFAULT_WORK_END = 18;
  const DEFAULT_MORNING_START = 8.5;
  const DEFAULT_MORNING_END = 12;
  const DEFAULT_AFTERNOON_START = 13.5;
  const DEFAULT_AFTERNOON_END = 18;
  const DAY_HOURS = 24;

  function clampInt(value, min, max, fallback) {
    const num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    return Math.max(min, Math.min(max, Math.floor(num)));
  }

  function clampHour(value, min, max, fallback) {
    const num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    const stepped = Math.round(num * 2) / 2;
    return Math.max(min, Math.min(max, stepped));
  }

  function applyDecimalHour(date, decimalHour) {
    const hourValue = Number(decimalHour);
    const hour = Math.floor(hourValue);
    const minute = Math.round((hourValue - hour) * 60);
    date.setHours(hour, minute, 0, 0);
    return date;
  }

  function workdayHoursFromSegments(segments = []) {
    return (segments || []).reduce((sum, segment) => {
      const start = Number(segment?.start);
      const end = Number(segment?.end);
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return sum;
      return sum + (end - start);
    }, 0);
  }

  function legacySegmentsFromRange(workStartHour, workEndHour) {
    let start = clampHour(workStartHour, 0, 23.5, DEFAULT_MORNING_START);
    let end = clampHour(workEndHour, 0.5, DAY_HOURS, DEFAULT_AFTERNOON_END);
    if (end <= start) end = Math.min(DAY_HOURS, start + 1);
    // Preserve a noon lunch break when the old single window crosses lunch.
    if (start < 12 && end > 13) {
      return [
        { start, end: 12 },
        { start: 13, end }
      ];
    }
    return [{ start, end }];
  }

  function normalizeWorkSegments(input = {}) {
    const hasSplit =
      input.morningStart != null ||
      input.morningEnd != null ||
      input.afternoonStart != null ||
      input.afternoonEnd != null ||
      Array.isArray(input.segments);

    let segments;
    if (Array.isArray(input.segments) && input.segments.length) {
      segments = input.segments.map(segment => ({
        start: clampHour(segment.start, 0, 23.5, DEFAULT_MORNING_START),
        end: clampHour(segment.end, 0.5, DAY_HOURS, DEFAULT_AFTERNOON_END)
      }));
    } else if (hasSplit) {
      let morningStart = clampHour(input.morningStart, 0, 23.5, DEFAULT_MORNING_START);
      let morningEnd = clampHour(input.morningEnd, 0.5, DAY_HOURS, DEFAULT_MORNING_END);
      let afternoonStart = clampHour(input.afternoonStart, 0, 23.5, DEFAULT_AFTERNOON_START);
      let afternoonEnd = clampHour(input.afternoonEnd, 0.5, DAY_HOURS, DEFAULT_AFTERNOON_END);
      if (morningEnd <= morningStart) morningEnd = Math.min(DAY_HOURS, morningStart + 0.5);
      if (afternoonEnd <= afternoonStart) afternoonEnd = Math.min(DAY_HOURS, afternoonStart + 0.5);
      if (afternoonStart < morningEnd) afternoonStart = morningEnd;
      if (afternoonEnd <= afternoonStart) afternoonEnd = Math.min(DAY_HOURS, afternoonStart + 0.5);
      segments = [
        { start: morningStart, end: morningEnd },
        { start: afternoonStart, end: afternoonEnd }
      ];
    } else if (input.workStartHour != null || input.workEndHour != null) {
      segments = legacySegmentsFromRange(input.workStartHour, input.workEndHour);
    } else {
      segments = [
        { start: DEFAULT_MORNING_START, end: DEFAULT_MORNING_END },
        { start: DEFAULT_AFTERNOON_START, end: DEFAULT_AFTERNOON_END }
      ];
    }

    segments = segments
      .map(segment => {
        let start = clampHour(segment.start, 0, 23.5, DEFAULT_MORNING_START);
        let end = clampHour(segment.end, 0.5, DAY_HOURS, DEFAULT_AFTERNOON_END);
        if (end <= start) end = Math.min(DAY_HOURS, start + 0.5);
        return { start, end };
      })
      .filter(segment => segment.end > segment.start)
      .sort((a, b) => a.start - b.start);

    // Merge accidental overlaps while keeping intentional lunch gaps.
    const merged = [];
    segments.forEach(segment => {
      const last = merged[merged.length - 1];
      if (last && segment.start <= last.end) last.end = Math.max(last.end, segment.end);
      else merged.push({ ...segment });
    });
    segments = merged.length
      ? merged
      : [
        { start: DEFAULT_MORNING_START, end: DEFAULT_MORNING_END },
        { start: DEFAULT_AFTERNOON_START, end: DEFAULT_AFTERNOON_END }
      ];

    const morning = segments[0];
    const afternoon = segments[1] || { start: morning.end, end: morning.end };
    return {
      morningStart: morning.start,
      morningEnd: morning.end,
      afternoonStart: afternoon.start,
      afternoonEnd: afternoon.end > afternoon.start ? afternoon.end : morning.end,
      workStartHour: morning.start,
      workEndHour: segments[segments.length - 1].end,
      segments,
      workdayHours: Math.round(workdayHoursFromSegments(segments) * 100) / 100
    };
  }

  /** @deprecated Prefer normalizeWorkSegments; kept for older callers. */
  function normalizeWorkHours(input = {}) {
    const normalized = normalizeWorkSegments(input);
    return {
      workStartHour: normalized.workStartHour,
      workEndHour: normalized.workEndHour,
      morningStart: normalized.morningStart,
      morningEnd: normalized.morningEnd,
      afternoonStart: normalized.afternoonStart,
      afternoonEnd: normalized.afternoonEnd,
      segments: normalized.segments,
      workdayHours: normalized.workdayHours
    };
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
    morningStart,
    morningEnd,
    afternoonStart,
    afternoonEnd,
    segments,
    entries = []
  } = {}) {
    const work = normalizeWorkSegments({
      workStartHour,
      workEndHour,
      morningStart,
      morningEnd,
      afternoonStart,
      afternoonEnd,
      segments
    });
    const occupied = hoursTouchedByEntries(entries);
    let lo = Math.floor(work.workStartHour);
    let hi = Math.ceil(work.workEndHour);
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
    if (!Array.isArray(hours) || !hours.length) {
      return clampInt(Math.ceil(Number(fallback) || DEFAULT_WORK_END), 1, DAY_HOURS, DEFAULT_WORK_END);
    }
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

  function parseDueEndDate(dueDate = "", dueTime = "", workEndHour = DEFAULT_WORK_END) {
    if (!dueDate) return null;
    const time = String(dueTime || "").trim();
    const match = time.match(/^(\d{1,2}):(\d{2})$/);
    const fallbackHour = Number(workEndHour);
    const hour = match
      ? clampInt(match[1], 0, 23, Math.floor(fallbackHour) || DEFAULT_WORK_END)
      : clampInt(Math.floor(fallbackHour), 0, 23, DEFAULT_WORK_END);
    const minute = match
      ? clampInt(match[2], 0, 59, 0)
      : Math.round((fallbackHour - Math.floor(fallbackHour)) * 60) || 0;
    const end = new Date(`${dueDate}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`);
    return Number.isNaN(end.getTime()) ? null : end;
  }

  function overlapHoursInDay(dayDate, rangeStart, rangeEnd, segments = []) {
    let total = 0;
    segments.forEach(segment => {
      const segStart = applyDecimalHour(
        new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate()),
        segment.start
      );
      const segEnd = applyDecimalHour(
        new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate()),
        segment.end
      );
      const from = new Date(Math.max(rangeStart.getTime(), segStart.getTime()));
      const to = new Date(Math.min(rangeEnd.getTime(), segEnd.getTime()));
      if (to > from) total += (to.getTime() - from.getTime()) / 3600000;
    });
    return total;
  }

  /** Workday hours between create time and due time, using configured work segments (skip weekends). */
  function workdayPlanHoursBetween({
    startIso = "",
    dueDate = "",
    dueTime = "",
    workStartHour = DEFAULT_WORK_START,
    workEndHour = DEFAULT_WORK_END,
    morningStart,
    morningEnd,
    afternoonStart,
    afternoonEnd,
    segments,
    skipWeekends = true
  } = {}) {
    const work = normalizeWorkSegments({
      workStartHour,
      workEndHour,
      morningStart,
      morningEnd,
      afternoonStart,
      afternoonEnd,
      segments
    });
    if (!(work.workdayHours > 0)) return 0;
    const start = startIso ? new Date(startIso) : null;
    const end = parseDueEndDate(dueDate, dueTime, work.workEndHour);
    if (!start || Number.isNaN(start.getTime()) || !end || end <= start) return 0;

    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    let total = 0;
    for (let cursor = new Date(startDay); cursor <= endDay; cursor.setDate(cursor.getDate() + 1)) {
      const dayIndex = (cursor.getDay() + 6) % 7; // Mon=0 … Sun=6
      if (skipWeekends && isWeekendDayIndex(dayIndex)) continue;
      const dayDate = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
      const dayStartBound = cursor.getTime() === startDay.getTime() ? start : applyDecimalHour(new Date(dayDate), work.workStartHour);
      const dayEndBound = cursor.getTime() === endDay.getTime() ? end : applyDecimalHour(new Date(dayDate), work.workEndHour);
      total += overlapHoursInDay(dayDate, dayStartBound, dayEndBound, work.segments);
    }
    return Math.max(0, Math.round(total * 100) / 100);
  }

  return {
    DEFAULT_WORK_START,
    DEFAULT_WORK_END,
    DEFAULT_MORNING_START,
    DEFAULT_MORNING_END,
    DEFAULT_AFTERNOON_START,
    DEFAULT_AFTERNOON_END,
    DAY_HOURS,
    normalizeWorkHours,
    normalizeWorkSegments,
    workdayHoursFromSegments,
    hoursTouchedByEntries,
    visibleTimelineHours,
    timelineEndLabelHour,
    isWeekendDayIndex,
    shouldShowWeekColumn,
    visibleWeekDayIndexes,
    workdayPlanHoursBetween
  };
});
