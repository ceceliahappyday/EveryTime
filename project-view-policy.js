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

  function futureBucketCount(scale) {
    if (scale === "month") return 2;
    if (scale === "week") return 6;
    return 30;
  }

  function ganttWindowBucketCount(scale) {
    return futureBucketCount(scale);
  }

  function initialGanttWindow({ scale, centerDateKey, addDays, getMonday, fromDateKey, toDateKey }) {
    if (scale === "day") {
      const count = futureBucketCount("day");
      const before = 14;
      const center = fromDateKey(centerDateKey);
      return {
        startKey: toDateKey(addDays(center, -before)),
        endKey: toDateKey(addDays(center, count - before - 1))
      };
    }
    if (scale === "week") {
      const count = futureBucketCount("week");
      const before = 3;
      const centerMonday = getMonday(fromDateKey(centerDateKey));
      return {
        startKey: toDateKey(addDays(centerMonday, -before * 7)),
        endKey: toDateKey(addDays(centerMonday, (count - before - 1) * 7))
      };
    }
    return { startKey: centerDateKey, endKey: centerDateKey };
  }

  function extendGanttWindow({ scale, startKey, endKey, direction, addDays, fromDateKey, toDateKey }) {
    const count = ganttWindowBucketCount(scale);
    if (scale === "day") {
      if (direction === "past") {
        return {
          startKey: toDateKey(addDays(fromDateKey(startKey), -count)),
          endKey,
          addedCount: count
        };
      }
      return {
        startKey,
        endKey: toDateKey(addDays(fromDateKey(endKey), count)),
        addedCount: count
      };
    }
    if (scale === "week") {
      const days = count * 7;
      if (direction === "past") {
        return {
          startKey: toDateKey(addDays(fromDateKey(startKey), -days)),
          endKey,
          addedCount: count
        };
      }
      return {
        startKey,
        endKey: toDateKey(addDays(fromDateKey(endKey), days)),
        addedCount: count
      };
    }
    return { startKey, endKey, addedCount: 0 };
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

  // Only buckets that actually carry invested time become coloured segments;
  // gaps between them stay empty so the lane reads as real effort, not a range.
  function timelineFractionForDate(dateKey, buckets = [], projectBucketKey, scale = "day", getMonday, fromDateKey, edge = "start") {
    if (!dateKey || !buckets.length) return null;
    const bucketKey = projectBucketKey(dateKey);
    const bucketIndex = buckets.findIndex(bucket => bucket.key === bucketKey);
    if (bucketIndex < 0) return null;
    if (scale === "day") {
      if (edge === "end") return (bucketIndex + 1) / buckets.length;
      if (edge === "start") return bucketIndex / buckets.length;
      return (bucketIndex + 0.5) / buckets.length;
    }
    const date = fromDateKey(dateKey);
    if (scale === "week") {
      const monday = getMonday(fromDateKey(bucketKey));
      const dayOffset = Math.round((date - monday) / 86400000);
      if (dayOffset < 0 || dayOffset > 6) return null;
      const unit = 1 / 7;
      const start = bucketIndex + dayOffset * unit;
      if (edge === "end") return start + unit;
      if (edge === "start") return start;
      return start + unit / 2;
    }
    if (scale === "month") {
      const monthKey = bucketKey.slice(0, 7);
      if (dateKey.slice(0, 7) !== monthKey) return null;
      const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      const unit = 1 / daysInMonth;
      const start = bucketIndex + (date.getDate() - 1) * unit;
      if (edge === "end") return start + unit;
      if (edge === "start") return start;
      return start + unit / 2;
    }
    return null;
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
      return segments.map(segment => Object.assign({}, segment, {
        leftRatio: segment.startIndex / buckets.length,
        widthRatio: (segment.endIndex - segment.startIndex + 1) / buckets.length
      }));
    }
    const ranges = investedDateKeys
      .map(dateKey => {
        const start = timelineFractionForDate(dateKey, buckets, projectBucketKey, scale, getMonday, fromDateKey, "start");
        const end = timelineFractionForDate(dateKey, buckets, projectBucketKey, scale, getMonday, fromDateKey, "end");
        if (start === null || end === null) return null;
        return { start, end };
      })
      .filter(Boolean)
      .sort((a, b) => a.start - b.start);
    const merged = [];
    ranges.forEach(range => {
      const last = merged[merged.length - 1];
      if (last && Math.abs(range.start - last.end) < 0.000001) last.end = range.end;
      else merged.push({ start: range.start, end: range.end });
    });
    return merged.map(range => ({
      leftRatio: range.start / buckets.length,
      widthRatio: (range.end - range.start) / buckets.length
    }));
  }

  // "start"/"end" pin the marker to the bucket boundary so the pair brackets the whole range.
  function markerRatio({ dateKey, buckets = [], projectBucketKey, edge = "center" } = {}) {
    const index = bucketIndexOf(dateKey, buckets, projectBucketKey);
    if (index < 0) return null;
    if (edge === "start") return index / buckets.length;
    if (edge === "end") return (index + 1) / buckets.length;
    return (index + .5) / buckets.length;
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
    if (scale === "day") {
      const first = bucketIndexOf(start, buckets, projectBucketKey);
      let last = bucketIndexOf(end, buckets, projectBucketKey);
      if (first < 0) return null;
      if (last < first) last = first;
      const leftRatio = first / buckets.length;
      const widthRatio = (last - first + 1) / buckets.length;
      return {
        leftRatio,
        widthRatio,
        fillRatio: widthRatio * Math.max(0, Math.min(100, Number(progress) || 0)) / 100
      };
    }
    const startPos = timelineFractionForDate(start, buckets, projectBucketKey, scale, getMonday, fromDateKey, "start");
    const endPos = timelineFractionForDate(end, buckets, projectBucketKey, scale, getMonday, fromDateKey, "end");
    if (startPos === null || endPos === null) return null;
    const widthPos = Math.max(endPos - startPos, 1 / (scale === "week" ? 7 : 28));
    const leftRatio = startPos / buckets.length;
    const widthRatio = widthPos / buckets.length;
    return {
      leftRatio,
      widthRatio,
      fillRatio: widthRatio * Math.max(0, Math.min(100, Number(progress) || 0)) / 100
    };
  }

  function shouldShowDueFlag(status) {
    return status === "planned" || status === "in_progress";
  }

  return {
    currentBucketKey,
    anchorIndex,
    anchorScrollLeft,
    futureBucketCount,
    ganttWindowBucketCount,
    initialGanttWindow,
    extendGanttWindow,
    centeredScrollLeft,
    displayMarkerDateKey,
    rangeContainsBucket,
    investmentSegments,
    markerRatio,
    boundaryDateKeys,
    progressSpan,
    shouldShowDueFlag
  };
});
