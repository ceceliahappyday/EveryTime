(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.ProjectViewPolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  const GANTT_MIN_DAY_PX = 44;
  const GANTT_QUARTER_WEEK_COUNT = 12;
  const GANTT_YEAR_MONTH_COUNT = 12;

  /**
   * Axis geometry unit:
   * - day/week/month → day columns
   * - quarter → week columns (7 calendar days each)
   * - year → month columns
   */
  function resolveGeometryScale(scale) {
    if (scale === "year") return "month";
    if (scale === "quarter") return "week";
    return "day";
  }

  function formatDateKey(date) {
    if (!date || Number.isNaN(+date)) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function currentBucketKey(dateKey, scale, helpers = {}) {
    if (scale === "year") return String(dateKey || "").slice(0, 7);
    if (scale === "quarter") {
      const { getMonday, fromDateKey, toDateKey } = helpers;
      if (dateKey && getMonday && fromDateKey) {
        const monday = getMonday(fromDateKey(dateKey));
        return typeof toDateKey === "function" ? toDateKey(monday) : formatDateKey(monday);
      }
    }
    return dateKey;
  }

  function anchorIndex(buckets = [], anchorKey) {
    const index = buckets.findIndex(bucket => bucket.key === anchorKey);
    return index < 0 ? 0 : index;
  }

  function anchorScrollLeft({ buckets = [], anchorKey, labelWidth = 180, bucketWidth = 44 } = {}) {
    // The label column is sticky; scrollLeft is measured only across date buckets.
    return Math.max(0, anchorIndex(buckets, anchorKey) * bucketWidth);
  }

  function monthKeyFromDateKey(dateKey = "") {
    return String(dateKey || "").slice(0, 7);
  }

  function shiftMonthKey(monthKey, delta = 0) {
    const [year, month] = String(monthKey || "").split("-").map(Number);
    if (!year || !month) return monthKey;
    const next = new Date(year, month - 1 + Number(delta || 0), 1);
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
  }

  function weekDayBounds(centerDateKey, getMonday, fromDateKey, toDateKey, addDays) {
    const monday = getMonday(fromDateKey(centerDateKey));
    return { startKey: toDateKey(monday), endKey: toDateKey(addDays(monday, 6)) };
  }

  function monthDayBounds(centerDateKey, fromDateKey, toDateKey) {
    const date = fromDateKey(centerDateKey);
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { startKey: toDateKey(start), endKey: toDateKey(end) };
  }

  function quarterDayBounds(centerDateKey, fromDateKey, toDateKey) {
    const date = fromDateKey(centerDateKey);
    const quarter = Math.floor(date.getMonth() / 3);
    const start = new Date(date.getFullYear(), quarter * 3, 1);
    const end = new Date(date.getFullYear(), quarter * 3 + 3, 0);
    return { startKey: toDateKey(start), endKey: toDateKey(end) };
  }

  /** 12 week columns starting at the Monday of the natural quarter. */
  function quarterWeekBounds(centerDateKey, getMonday, fromDateKey, toDateKey, addDays) {
    const date = fromDateKey(centerDateKey);
    const quarter = Math.floor(date.getMonth() / 3);
    const quarterStart = new Date(date.getFullYear(), quarter * 3, 1);
    const startMonday = getMonday(quarterStart);
    return {
      startKey: toDateKey(startMonday),
      endKey: toDateKey(addDays(startMonday, GANTT_QUARTER_WEEK_COUNT * 7 - 1))
    };
  }

  /** Sliding day window centered on anchor; used by month scale so resize changes day count. */
  function slidingDayBounds(centerDateKey, visibleDayCount, addDays, fromDateKey, toDateKey) {
    const count = Math.max(7, Math.min(62, Number(visibleDayCount) || 31));
    const center = fromDateKey(centerDateKey);
    const before = Math.floor((count - 1) / 2);
    const start = addDays(center, -before);
    return {
      startKey: toDateKey(start),
      endKey: toDateKey(addDays(start, count - 1))
    };
  }

  function yearMonthBounds(centerDateKey) {
    const year = String(centerDateKey || "").slice(0, 4) || String(new Date().getFullYear());
    return { startKey: `${year}-01`, endKey: `${year}-12` };
  }

  /** How many day columns fit the chart viewport for month scale. */
  function visibleDayCountForViewport(viewportWidth, minDayPx = GANTT_MIN_DAY_PX) {
    const vp = Math.max(240, Number(viewportWidth) || 240);
    const unit = Math.max(24, Number(minDayPx) || GANTT_MIN_DAY_PX);
    return Math.max(7, Math.min(45, Math.floor(vp / unit)));
  }

  /**
   * Pixel layout for axis columns.
   * Day/year fill the viewport; week/month/quarter use fixed min width and scroll when needed.
   */
  function axisLayout({
    scale = "day",
    bucketCount = 1,
    viewportWidth = 240,
    minDayPx = GANTT_MIN_DAY_PX
  } = {}) {
    const vp = Math.max(240, Number(viewportWidth) || 240);
    const count = Math.max(1, Number(bucketCount) || 1);
    const dayPx = Math.max(24, Number(minDayPx) || GANTT_MIN_DAY_PX);
    if (scale === "day") {
      return { mode: "fill", unitPx: vp, contentWidth: vp, fillWidth: true };
    }
    if (scale === "year") {
      return { mode: "fill", unitPx: vp / count, contentWidth: vp, fillWidth: true };
    }
    if (scale === "week" || scale === "month") {
      const fixed = dayPx * count;
      if (vp >= fixed) {
        return { mode: "fill", unitPx: Math.floor(vp / count), contentWidth: vp, fillWidth: true };
      }
      return { mode: "scroll", unitPx: dayPx, contentWidth: fixed, fillWidth: false };
    }
    if (scale === "quarter") {
      const minWeekPx = Math.max(64, Math.round(dayPx * 1.6));
      const fixed = minWeekPx * GANTT_QUARTER_WEEK_COUNT;
      if (vp >= fixed) {
        return {
          mode: "fill",
          unitPx: Math.floor(vp / GANTT_QUARTER_WEEK_COUNT),
          contentWidth: vp,
          fillWidth: true
        };
      }
      return { mode: "scroll", unitPx: minWeekPx, contentWidth: fixed, fillWidth: false };
    }
    return { mode: "fill", unitPx: vp / count, contentWidth: vp, fillWidth: true };
  }

  /** Approximate column count for a period window. */
  function visibleBucketCount(scale, startKey = "", endKey = "", fromDateKey) {
    if (scale === "year") return GANTT_YEAR_MONTH_COUNT;
    if (scale === "day") return 1;
    if (scale === "week") return 7;
    if (scale === "quarter") return GANTT_QUARTER_WEEK_COUNT;
    if (typeof fromDateKey === "function" && startKey && endKey && scale !== "year") {
      const start = fromDateKey(startKey);
      const end = fromDateKey(endKey);
      if (start && end && !Number.isNaN(start) && !Number.isNaN(end)) {
        const days = Math.max(1, Math.round((end - start) / 86400000) + 1);
        return scale === "quarter" ? Math.max(1, Math.round(days / 7)) : days;
      }
    }
    if (scale === "month") return 31;
    return 7;
  }

  function futureBucketCount(scale) {
    return visibleBucketCount(scale);
  }

  function ganttWindowBucketCount(scale) {
    return visibleBucketCount(scale);
  }

  function initialGanttWindow({
    scale,
    centerDateKey,
    visibleDayCount,
    addDays,
    getMonday,
    fromDateKey,
    toDateKey
  }) {
    if (scale === "day") {
      return { startKey: centerDateKey, endKey: centerDateKey };
    }
    if (scale === "week") {
      return weekDayBounds(centerDateKey, getMonday, fromDateKey, toDateKey, addDays);
    }
    if (scale === "month") {
      // Full calendar month; horizontal scroll when days do not fit the viewport.
      return monthDayBounds(centerDateKey, fromDateKey, toDateKey);
    }
    if (scale === "quarter") {
      return quarterWeekBounds(centerDateKey, getMonday, fromDateKey, toDateKey, addDays);
    }
    if (scale === "year") {
      return yearMonthBounds(centerDateKey);
    }
    return { startKey: centerDateKey, endKey: centerDateKey };
  }

  /** Move the period window by one step (day / week / month / quarter / year). */
  function shiftGanttWindow({
    scale,
    startKey,
    endKey,
    direction,
    visibleDayCount,
    addDays,
    fromDateKey,
    toDateKey,
    getMonday
  }) {
    const step = direction === "past" ? -1 : 1;
    if (scale === "day") {
      const next = toDateKey(addDays(fromDateKey(startKey), step));
      return { startKey: next, endKey: next };
    }
    if (scale === "week") {
      return {
        startKey: toDateKey(addDays(fromDateKey(startKey), step * 7)),
        endKey: toDateKey(addDays(fromDateKey(endKey), step * 7))
      };
    }
    if (scale === "month") {
      const base = fromDateKey(startKey) || fromDateKey(endKey);
      const next = new Date(base.getFullYear(), base.getMonth() + step, 1);
      return monthDayBounds(toDateKey(next), fromDateKey, toDateKey);
    }
    if (scale === "quarter") {
      return {
        startKey: toDateKey(addDays(fromDateKey(startKey), step * GANTT_QUARTER_WEEK_COUNT * 7)),
        endKey: toDateKey(addDays(fromDateKey(endKey), step * GANTT_QUARTER_WEEK_COUNT * 7))
      };
    }
    if (scale === "year") {
      const year = Number(String(startKey).slice(0, 4)) + step;
      return { startKey: `${year}-01`, endKey: `${year}-12` };
    }
    return { startKey, endKey };
  }

  /** @deprecated Prefer shiftGanttWindow; kept for older callers. */
  function extendGanttWindow(args) {
    const shifted = shiftGanttWindow(args);
    return { ...shifted, addedCount: 0 };
  }

  function centeredScrollLeft({ buckets = [], anchorKey, bucketWidth = 44, viewportWidth = 0 } = {}) {
    const index = anchorIndex(buckets, anchorKey);
    if (index < 0) return 0;
    return Math.max(0, index * bucketWidth - Math.round(viewportWidth / 2) + Math.round(bucketWidth / 2));
  }

  function displayMarkerDateKey(dateKey, shiftDays = -1, addDays, fromDateKey, toDateKey) {
    if (!dateKey) return "";
    return toDateKey(addDays(fromDateKey(dateKey), shiftDays));
  }

  function rangeContainsBucket(buckets = [], key) {
    return buckets.some(bucket => bucket.key === key);
  }

  function bucketIndexOf(dateKey, buckets = [], projectBucketKey) {
    if (!dateKey) return -1;
    const key = projectBucketKey ? projectBucketKey(dateKey) : dateKey;
    return buckets.findIndex(bucket => bucket.key === key);
  }

  function daysInMonthKey(monthKey = "") {
    const [year, month] = String(monthKey || "").split("-").map(Number);
    if (!year || !month) return 30;
    return new Date(year, month, 0).getDate();
  }

  /** Calendar days represented by one axis bucket. */
  function bucketDayCount(bucket, scale = "day") {
    if (Number.isFinite(bucket?.dayCount) && bucket.dayCount > 0) return Number(bucket.dayCount);
    const geo = resolveGeometryScale(scale);
    if (geo === "month") return daysInMonthKey(bucket?.key);
    if (geo === "week") return 7;
    return 1;
  }

  /** Day-weighted axis: year month columns scale by days-in-month; day columns stay uniform. */
  function axisMetrics(buckets = [], scale = "day") {
    const dayCounts = buckets.map(bucket => bucketDayCount(bucket, scale));
    const offsets = [];
    let totalDays = 0;
    dayCounts.forEach(count => {
      offsets.push(totalDays);
      totalDays += count;
    });
    return {
      dayCounts,
      offsets,
      totalDays: totalDays || 1,
      gridTemplateColumns: dayCounts.map(count => `${Math.max(1, count)}fr`).join(" ")
    };
  }

  function dayPosToRatio(dayPos, totalDays) {
    const total = totalDays > 0 ? totalDays : 1;
    return Math.max(0, Math.min(1, dayPos / total));
  }

  function bucketIndexAtDayPos(dayPos, metrics) {
    const { offsets, dayCounts, totalDays } = metrics;
    if (!offsets.length) return 0;
    const clamped = Math.max(0, Math.min(totalDays - 0.000001, dayPos));
    for (let index = offsets.length - 1; index >= 0; index -= 1) {
      if (clamped >= offsets[index]) return index;
    }
    return 0;
  }

  /**
   * Absolute day position on the weighted axis (0 … totalDays).
   * Month window covers day-1 of month 1 through last day of month N.
   */
  function timelineDayPosForDate(dateKey, buckets = [], projectBucketKey, scale = "day", getMonday, fromDateKey, edge = "start") {
    if (!dateKey || !buckets.length) return null;
    const geo = resolveGeometryScale(scale);
    const metrics = axisMetrics(buckets, scale);
    const bucketKey = typeof projectBucketKey === "function"
      ? projectBucketKey(dateKey)
      : currentBucketKey(dateKey, scale, { getMonday, fromDateKey });
    const bucketIndex = buckets.findIndex(bucket => bucket.key === bucketKey);
    if (bucketIndex < 0) return null;
    const base = metrics.offsets[bucketIndex];
    const count = metrics.dayCounts[bucketIndex];
    if (geo === "day") {
      if (edge === "end") return { dayPos: base + 1, ...metrics };
      if (edge === "start") return { dayPos: base, ...metrics };
      return { dayPos: base + 0.5, ...metrics };
    }
    if (geo === "week") {
      if (!fromDateKey || !getMonday) return null;
      const date = fromDateKey(dateKey);
      const monday = getMonday(date);
      const dayOffset = Math.max(0, Math.min(count - 1, Math.round((date - monday) / 86400000)));
      const start = base + dayOffset;
      if (edge === "end") return { dayPos: start + 1, ...metrics };
      if (edge === "start") return { dayPos: start, ...metrics };
      return { dayPos: start + 0.5, ...metrics };
    }
    // year → month columns
    const date = fromDateKey(dateKey);
    const monthKey = String(bucketKey).slice(0, 7);
    if (String(dateKey).slice(0, 7) !== monthKey) return null;
    const dayOfMonth = date.getDate();
    if (dayOfMonth < 1 || dayOfMonth > count) return null;
    const start = base + (dayOfMonth - 1);
    if (edge === "end") return { dayPos: start + 1, ...metrics };
    if (edge === "start") return { dayPos: start, ...metrics };
    return { dayPos: start + 0.5, ...metrics };
  }

  function compareAxisKeys(a, b, scale) {
    const geo = resolveGeometryScale(scale);
    const left = geo === "month" ? String(a || "").slice(0, 7) : String(a || "");
    const right = geo === "month" ? String(b || "").slice(0, 7) : String(b || "");
    if (left < right) return -1;
    if (left > right) return 1;
    return 0;
  }

  /** Map a date onto the axis, clamping to window edges when outside. */
  function clampedDayPosForDate(dateKey, buckets, projectBucketKey, scale, getMonday, fromDateKey, edge = "start") {
    const exact = timelineDayPosForDate(dateKey, buckets, projectBucketKey, scale, getMonday, fromDateKey, edge);
    if (exact) return { ...exact, clamped: false };
    if (!dateKey || !buckets.length) return null;
    const metrics = axisMetrics(buckets, scale);
    const first = buckets[0].key;
    const last = buckets[buckets.length - 1].key;
    if (compareAxisKeys(dateKey, first, scale) < 0) {
      return { dayPos: 0, ...metrics, clamped: true };
    }
    if (compareAxisKeys(dateKey, last, scale) > 0) {
      return { dayPos: metrics.totalDays, ...metrics, clamped: true };
    }
    return null;
  }

  // Returns 0–1 ratio on the day-weighted axis (not equal-bucket index space).
  function timelineFractionForDate(dateKey, buckets = [], projectBucketKey, scale = "day", getMonday, fromDateKey, edge = "start") {
    const pos = timelineDayPosForDate(dateKey, buckets, projectBucketKey, scale, getMonday, fromDateKey, edge);
    if (pos == null) return null;
    return dayPosToRatio(pos.dayPos, pos.totalDays);
  }

  /**
   * Continuity bars by axis bucket:
   * week/month → consecutive day columns; quarter → consecutive weeks; year → consecutive months.
   * Day-scale time slots use entryInvestmentSegments instead.
   */
  function investmentSegments({
    investedDateKeys = [],
    buckets = [],
    projectBucketKey,
    scale = "day",
    getMonday,
    fromDateKey
  } = {}) {
    if (!buckets.length) return [];
    const metrics = axisMetrics(buckets, scale);
    const indexes = [...new Set(
      investedDateKeys
        .map(dateKey => bucketIndexOf(dateKey, buckets, projectBucketKey))
        .filter(index => index >= 0)
    )].sort((a, b) => a - b);
    const segments = [];
    indexes.forEach(index => {
      const last = segments[segments.length - 1];
      if (last && index === last.endIndex + 1) last.endIndex = index;
      else segments.push({ startIndex: index, endIndex: index });
    });
    return segments.map(segment => {
      const startDay = metrics.offsets[segment.startIndex];
      const endDay = metrics.offsets[segment.endIndex] + metrics.dayCounts[segment.endIndex];
      return Object.assign({}, segment, {
        leftRatio: dayPosToRatio(startDay, metrics.totalDays),
        widthRatio: dayPosToRatio(endDay - startDay, metrics.totalDays)
      });
    });
  }

  /** Day column bounds in absolute day-space (0 … totalDays). */
  function dayBoundsInBucketSpace(dateKey, buckets, projectBucketKey, scale, getMonday, fromDateKey) {
    const start = timelineDayPosForDate(dateKey, buckets, projectBucketKey, scale, getMonday, fromDateKey, "start");
    const end = timelineDayPosForDate(dateKey, buckets, projectBucketKey, scale, getMonday, fromDateKey, "end");
    if (!start || !end) return null;
    const bucketKey = projectBucketKey(dateKey);
    const bucketIndex = buckets.findIndex(bucket => bucket.key === bucketKey);
    return {
      dayStart: start.dayPos,
      dayEnd: end.dayPos,
      bucketIndex,
      totalDays: start.totalDays
    };
  }

  function clamp01(value) {
    return Math.max(0, Math.min(1, Number(value) || 0));
  }

  /**
   * One coloured bar per schedule entry (never merge same-day slots).
   * Width scales with duration against the shared day hour window so 1.5h
   * bars stay longer than 1h bars across rows; same-day slots stay disconnected.
   */
  function entryInvestmentSegments({
    entries = [],
    buckets = [],
    projectBucketKey,
    scale = "day",
    getMonday,
    fromDateKey,
    dayStartHour = 9,
    dayEndHour = 18
  } = {}) {
    if (!buckets.length || !entries.length) return [];
    let hourLo = Number(dayStartHour);
    let hourHi = Number(dayEndHour);
    if (!Number.isFinite(hourLo)) hourLo = 9;
    if (!Number.isFinite(hourHi)) hourHi = 18;
    entries.forEach(entry => {
      const start = Number(entry.start);
      const end = Number(entry.end);
      if (Number.isFinite(start)) hourLo = Math.min(hourLo, start);
      if (Number.isFinite(end)) hourHi = Math.max(hourHi, end);
    });
    if (hourHi <= hourLo) hourHi = hourLo + 1;
    const hourSpan = hourHi - hourLo;

    const raw = entries.map((entry, entryIndex) => {
      const bounds = dayBoundsInBucketSpace(
        entry.dateKey,
        buckets,
        projectBucketKey,
        scale,
        getMonday,
        fromDateKey
      );
      if (!bounds) return null;
      const startHour = Number(entry.start);
      const endHour = Number(entry.end);
      const scheduledHours = Number.isFinite(endHour) && Number.isFinite(startHour)
        ? Math.max(0, endHour - startHour)
        : 0;
      const durationHours = Math.max(
        0.25,
        Number(entry.hours) > 0 ? Number(entry.hours) : scheduledHours || 0.25
      );
      const leftInDay = clamp01((startHour - hourLo) / hourSpan);
      let widthInDay = Math.max(0.04, durationHours / hourSpan);
      if (leftInDay + widthInDay > 1) widthInDay = Math.max(0.04, 1 - leftInDay);
      const daySpan = bounds.dayEnd - bounds.dayStart;
      const totalDays = bounds.totalDays || axisMetrics(buckets, scale).totalDays;
      return {
        entryIndex,
        dateKey: entry.dateKey,
        startHour,
        endHour,
        durationHours,
        dayStart: bounds.dayStart,
        dayEnd: bounds.dayEnd,
        daySpan,
        totalDays,
        leftRatio: dayPosToRatio(bounds.dayStart + leftInDay * daySpan, totalDays),
        widthRatio: dayPosToRatio(widthInDay * daySpan, totalDays)
      };
    }).filter(Boolean);

    const byDay = new Map();
    raw.forEach(segment => {
      const key = `${segment.dayStart}`;
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key).push(segment);
    });

    const gapRatio = 0.004;
    byDay.forEach(group => {
      group.sort((a, b) => a.startHour - b.startHour || a.entryIndex - b.entryIndex);
      for (let index = 1; index < group.length; index += 1) {
        const prev = group[index - 1];
        const cur = group[index];
        const prevEnd = prev.leftRatio + prev.widthRatio;
        if (cur.leftRatio < prevEnd + gapRatio) {
          cur.leftRatio = prevEnd + gapRatio;
        }
        const dayRight = dayPosToRatio(group[0].dayEnd, group[0].totalDays);
        if (cur.leftRatio + cur.widthRatio > dayRight) {
          cur.widthRatio = Math.max(0.01, dayRight - cur.leftRatio);
        }
      }
    });

    return raw
      .sort((a, b) => a.leftRatio - b.leftRatio || a.entryIndex - b.entryIndex)
      .map(({ entryIndex, dateKey, startHour, endHour, leftRatio, widthRatio }) => ({
        entryIndex,
        dateKey,
        startHour,
        endHour,
        leftRatio,
        widthRatio
      }));
  }

  // "start"/"end" pin the marker to the day boundary so the pair brackets the whole range.
  function markerRatio({
    dateKey,
    buckets = [],
    projectBucketKey,
    edge = "center",
    scale = "day",
    getMonday,
    fromDateKey
  } = {}) {
    if (!dateKey || !buckets.length) return null;
    const geo = resolveGeometryScale(scale);
    if (geo === "day" || !fromDateKey) {
      const metrics = axisMetrics(buckets, scale);
      const index = bucketIndexOf(dateKey, buckets, projectBucketKey);
      if (index < 0) return null;
      const start = metrics.offsets[index];
      if (edge === "start") return dayPosToRatio(start, metrics.totalDays);
      if (edge === "end") return dayPosToRatio(start + metrics.dayCounts[index], metrics.totalDays);
      return dayPosToRatio(start + metrics.dayCounts[index] / 2, metrics.totalDays);
    }
    return timelineFractionForDate(dateKey, buckets, projectBucketKey, scale, getMonday, fromDateKey, edge);
  }

  function maxDateKey(a = "", b = "") {
    if (!a) return b || "";
    if (!b) return a || "";
    return a >= b ? a : b;
  }

  /**
   * Single-track lifecycle trough:
   * start = createdAt; end = completed ? max(due, completed)
   *   : started ? max(due, today) : due.
   */
  function lifecycleRangeKeys({
    createdDateKey = "",
    plannedEndAt = "",
    actualStartAt = "",
    actualEndAt = "",
    todayKey = ""
  } = {}) {
    const rangeStart = createdDateKey || actualStartAt || plannedEndAt || "";
    if (!rangeStart) return { start: "", end: "" };
    let rangeEnd = "";
    if (actualEndAt) {
      rangeEnd = maxDateKey(plannedEndAt, actualEndAt) || actualEndAt;
    } else if (actualStartAt) {
      rangeEnd = maxDateKey(plannedEndAt, todayKey) || plannedEndAt || todayKey;
    } else {
      rangeEnd = plannedEndAt || "";
    }
    if (!rangeEnd) rangeEnd = rangeStart;
    if (rangeEnd < rangeStart) rangeEnd = rangeStart;
    return { start: rangeStart, end: rangeEnd };
  }

  /** Legacy start/end markers (kept for older callers/tests). Prefer lifecycleRangeKeys. */
  function boundaryDateKeys({
    investedDateKeys = [],
    startedDateKey = "",
    completedDateKey = "",
    createdDateKey = "",
    dueDateKey = "",
    isEnded = false
  } = {}) {
    const invested = investedDateKeys.filter(Boolean).slice().sort();
    const start = startedDateKey || invested[0] || createdDateKey || dueDateKey || "";
    let end = completedDateKey || "";
    if (!end && isEnded) end = invested[invested.length - 1] || dueDateKey || start || "";
    if (!end && !isEnded) end = "";
    if (end && start && end < start) end = start;
    return { start, end };
  }

  function progressSpan({
    startDateKey = "",
    endDateKey = "",
    todayKey = "",
    isEnded = false,
    progress = 0,
    buckets = [],
    projectBucketKey,
    scale = "day",
    getMonday,
    fromDateKey
  } = {}) {
    const start = startDateKey;
    let end = endDateKey || (isEnded ? start : todayKey);
    if (start && end && end < start) end = start;
    if (!start || !buckets.length) return null;
    const startPos = clampedDayPosForDate(start, buckets, projectBucketKey, scale, getMonday, fromDateKey, "start");
    const endPos = clampedDayPosForDate(end, buckets, projectBucketKey, scale, getMonday, fromDateKey, "end");
    if (!startPos || !endPos) return null;
    const totalDays = startPos.totalDays || endPos.totalDays || 1;
    const leftDay = Math.max(0, Math.min(totalDays, startPos.dayPos));
    const rightDay = Math.max(leftDay, Math.min(totalDays, Math.max(endPos.dayPos, leftDay + 0.5)));
    if (rightDay <= 0 || leftDay >= totalDays) return null;
    const widthDays = Math.max(rightDay - leftDay, 0.5);
    const leftRatio = dayPosToRatio(leftDay, totalDays);
    const widthRatio = dayPosToRatio(widthDays, totalDays);
    return {
      leftRatio,
      widthRatio,
      fillRatio: widthRatio * Math.max(0, Math.min(100, Number(progress) || 0)) / 100
    };
  }

  function shouldShowDueFlag(_status) {
    // Cutoff stays on the planned due date for every status (including done).
    return true;
  }

  return {
    GANTT_MIN_DAY_PX,
    GANTT_QUARTER_WEEK_COUNT,
    GANTT_YEAR_MONTH_COUNT,
    currentBucketKey,
    resolveGeometryScale,
    anchorIndex,
    anchorScrollLeft,
    visibleBucketCount,
    visibleDayCountForViewport,
    axisLayout,
    futureBucketCount,
    ganttWindowBucketCount,
    initialGanttWindow,
    shiftGanttWindow,
    extendGanttWindow,
    centeredScrollLeft,
    displayMarkerDateKey,
    rangeContainsBucket,
    daysInMonthKey,
    bucketDayCount,
    axisMetrics,
    bucketIndexAtDayPos,
    investmentSegments,
    entryInvestmentSegments,
    markerRatio,
    maxDateKey,
    lifecycleRangeKeys,
    boundaryDateKeys,
    progressSpan,
    shouldShowDueFlag,
    monthKeyFromDateKey,
    shiftMonthKey,
    weekDayBounds,
    monthDayBounds,
    quarterDayBounds,
    quarterWeekBounds,
    slidingDayBounds,
    yearMonthBounds,
    clampedDayPosForDate
  };
});
