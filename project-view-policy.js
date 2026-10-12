(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.ProjectViewPolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  function currentBucketKey(dateKey, scale, getMonday) {
    if (scale === "month") return String(dateKey).slice(0, 7);
    if (scale === "week") return getMonday ? getMonday(dateKey) : dateKey;
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

  /** Fixed viewport sizes so day/week/month share the same chart width. */
  function visibleBucketCount(scale) {
    if (scale === "month") return 3;
    if (scale === "week") return 4;
    return 7;
  }

  function futureBucketCount(scale) {
    return visibleBucketCount(scale);
  }

  function ganttWindowBucketCount(scale) {
    return visibleBucketCount(scale);
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

  function initialGanttWindow({ scale, centerDateKey, addDays, getMonday, fromDateKey, toDateKey }) {
    const count = visibleBucketCount(scale);
    const before = Math.floor((count - 1) / 2);
    if (scale === "day") {
      const center = fromDateKey(centerDateKey);
      return {
        startKey: toDateKey(addDays(center, -before)),
        endKey: toDateKey(addDays(center, count - before - 1))
      };
    }
    if (scale === "week") {
      const centerMonday = getMonday(fromDateKey(centerDateKey));
      return {
        startKey: toDateKey(addDays(centerMonday, -before * 7)),
        endKey: toDateKey(addDays(centerMonday, (count - before - 1) * 7))
      };
    }
    const centerMonth = monthKeyFromDateKey(centerDateKey);
    return {
      startKey: shiftMonthKey(centerMonth, -before),
      endKey: shiftMonthKey(centerMonth, count - before - 1)
    };
  }

  /** Move the fixed window by one bucket (day / week / month). */
  function shiftGanttWindow({ scale, startKey, endKey, direction, addDays, fromDateKey, toDateKey }) {
    const step = direction === "past" ? -1 : 1;
    if (scale === "day") {
      return {
        startKey: toDateKey(addDays(fromDateKey(startKey), step)),
        endKey: toDateKey(addDays(fromDateKey(endKey), step))
      };
    }
    if (scale === "week") {
      return {
        startKey: toDateKey(addDays(fromDateKey(startKey), step * 7)),
        endKey: toDateKey(addDays(fromDateKey(endKey), step * 7))
      };
    }
    return {
      startKey: shiftMonthKey(monthKeyFromDateKey(startKey), step),
      endKey: shiftMonthKey(monthKeyFromDateKey(endKey), step)
    };
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

  /** Calendar days represented by one axis bucket (month varies; week=7; day=1). */
  function bucketDayCount(bucket, scale = "day") {
    if (Number.isFinite(bucket?.dayCount) && bucket.dayCount > 0) return Number(bucket.dayCount);
    if (scale === "month") return daysInMonthKey(bucket?.key);
    if (scale === "week") return 7;
    return 1;
  }

  /** Day-weighted axis: month columns scale by days-in-month; week/day stay uniform. */
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
    const metrics = axisMetrics(buckets, scale);
    const bucketKey = projectBucketKey(dateKey);
    const bucketIndex = buckets.findIndex(bucket => bucket.key === bucketKey);
    if (bucketIndex < 0) return null;
    const base = metrics.offsets[bucketIndex];
    const count = metrics.dayCounts[bucketIndex];
    if (scale === "day") {
      if (edge === "end") return { dayPos: base + 1, ...metrics };
      if (edge === "start") return { dayPos: base, ...metrics };
      return { dayPos: base + 0.5, ...metrics };
    }
    const date = fromDateKey(dateKey);
    if (scale === "week") {
      const monday = getMonday(fromDateKey(bucketKey));
      const dayOffset = Math.round((date - monday) / 86400000);
      if (dayOffset < 0 || dayOffset > 6) return null;
      const start = base + dayOffset;
      if (edge === "end") return { dayPos: start + 1, ...metrics };
      if (edge === "start") return { dayPos: start, ...metrics };
      return { dayPos: start + 0.5, ...metrics };
    }
    if (scale === "month") {
      const monthKey = String(bucketKey).slice(0, 7);
      if (String(dateKey).slice(0, 7) !== monthKey) return null;
      const dayOfMonth = date.getDate();
      if (dayOfMonth < 1 || dayOfMonth > count) return null;
      const start = base + (dayOfMonth - 1);
      if (edge === "end") return { dayPos: start + 1, ...metrics };
      if (edge === "start") return { dayPos: start, ...metrics };
      return { dayPos: start + 0.5, ...metrics };
    }
    return null;
  }

  // Returns 0–1 ratio on the day-weighted axis (not equal-bucket index space).
  function timelineFractionForDate(dateKey, buckets = [], projectBucketKey, scale = "day", getMonday, fromDateKey, edge = "start") {
    const pos = timelineDayPosForDate(dateKey, buckets, projectBucketKey, scale, getMonday, fromDateKey, edge);
    if (!pos) return null;
    return dayPosToRatio(pos.dayPos, pos.totalDays);
  }

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
    if (scale === "day") {
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
    const ranges = investedDateKeys
      .map(dateKey => {
        const start = timelineDayPosForDate(dateKey, buckets, projectBucketKey, scale, getMonday, fromDateKey, "start");
        const end = timelineDayPosForDate(dateKey, buckets, projectBucketKey, scale, getMonday, fromDateKey, "end");
        if (!start || !end) return null;
        return { start: start.dayPos, end: end.dayPos, totalDays: start.totalDays };
      })
      .filter(Boolean)
      .sort((a, b) => a.start - b.start);
    const merged = [];
    ranges.forEach(range => {
      const last = merged[merged.length - 1];
      if (last && Math.abs(range.start - last.end) < 0.000001) last.end = range.end;
      else merged.push({ start: range.start, end: range.end, totalDays: range.totalDays });
    });
    return merged.map(range => ({
      leftRatio: dayPosToRatio(range.start, range.totalDays),
      widthRatio: dayPosToRatio(range.end - range.start, range.totalDays)
    }));
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
    if (scale === "day" || !fromDateKey) {
      const metrics = axisMetrics(buckets, "day");
      const index = bucketIndexOf(dateKey, buckets, projectBucketKey);
      if (index < 0) return null;
      const start = metrics.offsets[index];
      if (edge === "start") return dayPosToRatio(start, metrics.totalDays);
      if (edge === "end") return dayPosToRatio(start + metrics.dayCounts[index], metrics.totalDays);
      return dayPosToRatio(start + metrics.dayCounts[index] / 2, metrics.totalDays);
    }
    return timelineFractionForDate(dateKey, buckets, projectBucketKey, scale, getMonday, fromDateKey, edge);
  }

  function boundaryDateKeys({
    investedDateKeys = [],
    startedDateKey = "",
    completedDateKey = "",
    isEnded = false
  } = {}) {
    const invested = investedDateKeys.filter(Boolean).slice().sort();
    const start = startedDateKey || invested[0] || "";
    let end = completedDateKey || "";
    if (!end && isEnded) end = invested[invested.length - 1] || "";
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
    const startPos = timelineDayPosForDate(start, buckets, projectBucketKey, scale, getMonday, fromDateKey, "start");
    const endPos = timelineDayPosForDate(end, buckets, projectBucketKey, scale, getMonday, fromDateKey, "end");
    if (!startPos || !endPos) return null;
    const widthDays = Math.max(endPos.dayPos - startPos.dayPos, 1);
    const leftRatio = dayPosToRatio(startPos.dayPos, startPos.totalDays);
    const widthRatio = dayPosToRatio(widthDays, startPos.totalDays);
    return {
      leftRatio,
      widthRatio,
      fillRatio: widthRatio * Math.max(0, Math.min(100, Number(progress) || 0)) / 100
    };
  }

  function shouldShowDueFlag(status) {
    return status === "planned" || status === "in_progress" || status === "tracking";
  }

  return {
    currentBucketKey,
    anchorIndex,
    anchorScrollLeft,
    visibleBucketCount,
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
    boundaryDateKeys,
    progressSpan,
    shouldShowDueFlag,
    monthKeyFromDateKey,
    shiftMonthKey
  };
});
