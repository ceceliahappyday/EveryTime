const assert = require("assert");
const policy = require("../project-view-policy.js");

const buckets = [
  { key: "2026-06-01" }, { key: "2026-07-01" }, { key: "2026-08-01" },
  { key: "2026-09-01" }, { key: "2026-10-01" }
];
assert.strictEqual(policy.anchorIndex(buckets, "2026-08-01"), 2);
assert.strictEqual(policy.anchorScrollLeft({ buckets, anchorKey: "2026-08-01", labelWidth: 180, bucketWidth: 72 }), 144);
assert.strictEqual(policy.anchorScrollLeft({ buckets, anchorKey: "missing", labelWidth: 180, bucketWidth: 72 }), 0);
assert.strictEqual(policy.visibleBucketCount("day"), 1);
assert.strictEqual(policy.visibleBucketCount("week"), 7);
assert.strictEqual(policy.visibleBucketCount("year"), 12);
assert.strictEqual(policy.futureBucketCount("day"), 1);
assert.strictEqual(policy.futureBucketCount("week"), 7);
assert.strictEqual(policy.futureBucketCount("year"), 12);
assert.strictEqual(policy.anchorScrollLeft({ buckets, anchorKey: "2026-08-01", bucketWidth: 72 }), 144);
assert.ok(policy.anchorScrollLeft({ buckets, anchorKey: "2026-08-01", bucketWidth: 72 }) < 216);

const dayBuckets = ["2026-07-01", "2026-07-02", "2026-07-03", "2026-07-04", "2026-07-05"].map(key => ({ key }));
const identity = key => key;

// Days without invested time must stay uncoloured, so adjacent days merge but gaps split.
assert.deepStrictEqual(policy.investmentSegments({
  investedDateKeys: ["2026-07-01", "2026-07-02", "2026-07-05"],
  buckets: dayBuckets,
  projectBucketKey: identity,
  scale: "day"
}), [
  { startIndex: 0, endIndex: 1, leftRatio: 0, widthRatio: 0.4 },
  { startIndex: 4, endIndex: 4, leftRatio: 0.8, widthRatio: 0.2 }
]);
assert.deepStrictEqual(policy.investmentSegments({
  investedDateKeys: ["2026-07-02", "2026-07-02"],
  buckets: dayBuckets,
  projectBucketKey: identity,
  scale: "day"
}), [{ startIndex: 1, endIndex: 1, leftRatio: 0.2, widthRatio: 0.2 }]);
assert.deepStrictEqual(policy.investmentSegments({ investedDateKeys: [], buckets: dayBuckets, projectBucketKey: identity, scale: "day" }), []);
assert.deepStrictEqual(policy.investmentSegments({
  investedDateKeys: ["2026-09-01"],
  buckets: dayBuckets,
  projectBucketKey: identity,
  scale: "day"
}), []);

// Same-day schedule slots stay as separate, disconnected bars (not one merged day block).
const sameDayEntries = policy.entryInvestmentSegments({
  entries: [
    { dateKey: "2026-07-02", start: 9, end: 10.5 },
    { dateKey: "2026-07-02", start: 12, end: 13 }
  ],
  buckets: dayBuckets,
  projectBucketKey: identity,
  scale: "day",
  dayStartHour: 9,
  dayEndHour: 18
});
assert.strictEqual(sameDayEntries.length, 2);
assert.ok(sameDayEntries[0].leftRatio + sameDayEntries[0].widthRatio < sameDayEntries[1].leftRatio - 0.001);
assert.ok(sameDayEntries[0].leftRatio >= 0.2 - 0.001);
assert.ok(sameDayEntries[1].leftRatio + sameDayEntries[1].widthRatio <= 0.4 + 0.001);
// Width must follow duration: 1.5h bar longer than 1h bar under the same day window.
assert.ok(
  sameDayEntries[0].widthRatio > sameDayEntries[1].widthRatio,
  "1.5h invest bar must render wider than 1h bar"
);
assert.ok(
  Math.abs(sameDayEntries[0].widthRatio / sameDayEntries[1].widthRatio - 1.5) < 0.08,
  "invest bar widths should stay proportional to hours"
);
assert.deepStrictEqual(policy.entryInvestmentSegments({
  entries: [],
  buckets: dayBuckets,
  projectBucketKey: identity,
  scale: "day"
}), []);

const getMonday = date => {
  const next = new Date(date);
  const offset = (next.getDay() + 6) % 7;
  next.setDate(next.getDate() - offset);
  return next;
};
const fromDateKey = key => {
  const [year, month, day] = String(key).split("-").map(Number);
  return new Date(year, month - 1, day);
};
// Week scale now uses one column per calendar day (Mon–Sun).
const weekBuckets = [
  "2026-07-06", "2026-07-07", "2026-07-08", "2026-07-09",
  "2026-07-10", "2026-07-11", "2026-07-12"
].map(key => ({ key, dayCount: 1 }));
const weekSegments = policy.investmentSegments({
  investedDateKeys: ["2026-07-09", "2026-07-11"],
  buckets: weekBuckets,
  projectBucketKey: identity,
  scale: "week",
  getMonday,
  fromDateKey
});
assert.strictEqual(weekSegments.length, 2);
assert.ok(Math.abs(weekSegments[0].leftRatio - (3 / 7)) < 0.001);
assert.ok(Math.abs(weekSegments[0].widthRatio - (1 / 7)) < 0.001);
assert.ok(Math.abs(weekSegments[1].leftRatio - (5 / 7)) < 0.001);

assert.strictEqual(policy.markerRatio({ dateKey: "2026-07-01", buckets: dayBuckets, projectBucketKey: identity }), 0.1);
assert.strictEqual(policy.markerRatio({ dateKey: "2026-07-05", buckets: dayBuckets, projectBucketKey: identity }), 0.9);
// Boundary edges make the start/end pair bracket the invested segments instead of sitting inside them.
assert.strictEqual(policy.markerRatio({ dateKey: "2026-07-02", buckets: dayBuckets, projectBucketKey: identity, edge: "start" }), 0.2);
assert.strictEqual(policy.markerRatio({ dateKey: "2026-07-02", buckets: dayBuckets, projectBucketKey: identity, edge: "end" }), 0.4);
assert.strictEqual(policy.markerRatio({ dateKey: "2026-07-05", buckets: dayBuckets, projectBucketKey: identity, edge: "end" }), 1);
assert.strictEqual(policy.markerRatio({ dateKey: "", buckets: dayBuckets, projectBucketKey: identity }), null);
assert.strictEqual(policy.markerRatio({ dateKey: "2026-12-01", buckets: dayBuckets, projectBucketKey: identity }), null);

// An unfinished task has a start but no end marker; today must not become a fake end.
assert.deepStrictEqual(policy.boundaryDateKeys({
  investedDateKeys: ["2026-07-17", "2026-08-10"],
  startedDateKey: "2026-07-17",
  isEnded: false
}), { start: "2026-07-17", end: "" });
assert.deepStrictEqual(policy.boundaryDateKeys({
  investedDateKeys: ["2026-07-17", "2026-08-10"],
  startedDateKey: "2026-07-17",
  completedDateKey: "2026-08-12",
  isEnded: true
}), { start: "2026-07-17", end: "2026-08-12" });
assert.deepStrictEqual(policy.boundaryDateKeys({
  investedDateKeys: ["2026-08-10", "2026-07-17"],
  isEnded: true
}), { start: "2026-07-17", end: "2026-08-10" });
assert.deepStrictEqual(policy.boundaryDateKeys({
  investedDateKeys: [],
  startedDateKey: "2026-07-20",
  completedDateKey: "2026-07-10",
  isEnded: true
}), { start: "2026-07-20", end: "2026-07-20" });
assert.deepStrictEqual(policy.boundaryDateKeys({}), { start: "", end: "" });

// Progress fills the start-to-today track while a task is still open.
assert.deepStrictEqual(policy.progressSpan({
  startDateKey: "2026-07-01",
  endDateKey: "",
  todayKey: "2026-07-05",
  isEnded: false,
  progress: 50,
  buckets: dayBuckets,
  projectBucketKey: identity,
  scale: "day"
}), { leftRatio: 0, widthRatio: 1, fillRatio: 0.5 });
// A finished task stops at its end date, and 100% fills that whole span.
assert.deepStrictEqual(policy.progressSpan({
  startDateKey: "2026-07-01",
  endDateKey: "2026-07-03",
  todayKey: "2026-07-05",
  isEnded: true,
  progress: 100,
  buckets: dayBuckets,
  projectBucketKey: identity,
  scale: "day"
}), { leftRatio: 0, widthRatio: 0.6, fillRatio: 0.6 });
assert.strictEqual(policy.progressSpan({
  startDateKey: "",
  todayKey: "2026-07-05",
  buckets: dayBuckets,
  projectBucketKey: identity,
  scale: "day"
}), null);

assert.strictEqual(policy.shouldShowDueFlag("planned"), true);
assert.strictEqual(policy.shouldShowDueFlag("in_progress"), true);
assert.strictEqual(policy.shouldShowDueFlag("done"), false);
assert.strictEqual(policy.shouldShowDueFlag("closed"), false);
assert.strictEqual(policy.shouldShowDueFlag("tracking"), true);

const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};
const toDateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

assert.deepStrictEqual(policy.initialGanttWindow({
  scale: "day",
  centerDateKey: "2026-08-15",
  addDays,
  getMonday,
  fromDateKey,
  toDateKey
}), { startKey: "2026-08-15", endKey: "2026-08-15" });

assert.deepStrictEqual(policy.initialGanttWindow({
  scale: "week",
  centerDateKey: "2026-08-15",
  addDays,
  getMonday,
  fromDateKey,
  toDateKey
}), { startKey: "2026-08-10", endKey: "2026-08-16" });

assert.deepStrictEqual(policy.initialGanttWindow({
  scale: "month",
  centerDateKey: "2026-08-15",
  visibleDayCount: 31,
  addDays,
  getMonday,
  fromDateKey,
  toDateKey
}), { startKey: "2026-07-31", endKey: "2026-08-30" });

// Quarter = 12 week columns from Monday of the natural quarter.
assert.deepStrictEqual(policy.initialGanttWindow({
  scale: "quarter",
  centerDateKey: "2026-08-15",
  addDays,
  getMonday,
  fromDateKey,
  toDateKey
}), { startKey: "2026-06-29", endKey: "2026-09-20" });
assert.strictEqual(policy.visibleBucketCount("quarter"), 12);
assert.strictEqual(policy.resolveGeometryScale("quarter"), "week");
assert.strictEqual(
  policy.currentBucketKey("2026-08-15", "quarter", { getMonday, fromDateKey, toDateKey }),
  "2026-08-10"
);
assert.ok(policy.visibleDayCountForViewport(880, 44) >= 7);
assert.strictEqual(policy.axisLayout({ scale: "day", bucketCount: 1, viewportWidth: 600 }).fillWidth, true);
assert.strictEqual(policy.axisLayout({ scale: "week", bucketCount: 7, viewportWidth: 200, minDayPx: 44 }).mode, "scroll");
assert.strictEqual(policy.axisLayout({ scale: "week", bucketCount: 7, viewportWidth: 200, minDayPx: 44 }).contentWidth, 44 * 7);

assert.deepStrictEqual(policy.initialGanttWindow({
  scale: "year",
  centerDateKey: "2026-08-15",
  addDays,
  getMonday,
  fromDateKey,
  toDateKey
}), { startKey: "2026-01", endKey: "2026-12" });

assert.strictEqual(policy.resolveGeometryScale("week"), "day");
assert.strictEqual(policy.resolveGeometryScale("year"), "month");
assert.strictEqual(policy.currentBucketKey("2026-08-15", "week"), "2026-08-15");
assert.strictEqual(policy.currentBucketKey("2026-08-15", "year"), "2026-08");

// Year view month columns are day-weighted: Sep(30) / Oct(31) / Nov(30).
const monthBuckets = [
  { key: "2026-09", label: "9月" },
  { key: "2026-10", label: "10月" },
  { key: "2026-11", label: "11月" }
];
const monthMetrics = policy.axisMetrics(monthBuckets, "year");
assert.strictEqual(monthMetrics.totalDays, 30 + 31 + 30);
assert.deepStrictEqual(monthMetrics.dayCounts, [30, 31, 30]);
assert.strictEqual(monthMetrics.gridTemplateColumns, "30fr 31fr 30fr");
assert.ok(Math.abs(monthMetrics.offsets[1] / monthMetrics.totalDays - 30 / 91) < 0.0001);
assert.ok(Math.abs(monthMetrics.dayCounts[1] / monthMetrics.totalDays - 31 / 91) < 0.0001);
const monthBucketKey = dateKey => String(dateKey).slice(0, 7);
const octFirst = policy.markerRatio({
  dateKey: "2026-10-01",
  buckets: monthBuckets,
  projectBucketKey: monthBucketKey,
  edge: "start",
  scale: "year",
  getMonday,
  fromDateKey
});
const novFirst = policy.markerRatio({
  dateKey: "2026-11-01",
  buckets: monthBuckets,
  projectBucketKey: monthBucketKey,
  edge: "start",
  scale: "year",
  getMonday,
  fromDateKey
});
assert.ok(Math.abs(octFirst - 30 / 91) < 0.0001, "Oct should start after 30 Sep days");
assert.ok(Math.abs(novFirst - (30 + 31) / 91) < 0.0001, "Nov should start after Sep+Oct days");
assert.ok(novFirst - octFirst > 30 / 91, "October column must be wider than a 30-day month");

assert.deepStrictEqual(policy.shiftGanttWindow({
  scale: "day",
  startKey: "2026-08-15",
  endKey: "2026-08-15",
  direction: "future",
  addDays,
  fromDateKey,
  toDateKey
}), { startKey: "2026-08-16", endKey: "2026-08-16" });

assert.deepStrictEqual(policy.shiftGanttWindow({
  scale: "month",
  startKey: "2026-07-31",
  endKey: "2026-08-30",
  direction: "past",
  visibleDayCount: 31,
  addDays,
  fromDateKey,
  toDateKey
}), { startKey: "2026-06-30", endKey: "2026-07-30" });

assert.deepStrictEqual(policy.shiftGanttWindow({
  scale: "year",
  startKey: "2026-01",
  endKey: "2026-12",
  direction: "future",
  addDays,
  fromDateKey,
  toDateKey
}), { startKey: "2027-01", endKey: "2027-12" });

const clamped = policy.progressSpan({
  startDateKey: "2026-07-01",
  endDateKey: "2026-09-30",
  isEnded: true,
  progress: 50,
  buckets: [
    { key: "2026-08-01", dayCount: 1 },
    { key: "2026-08-02", dayCount: 1 }
  ],
  projectBucketKey: key => key,
  scale: "month",
  getMonday,
  fromDateKey
});
assert.ok(clamped && clamped.widthRatio > 0, "progress span should clamp into the visible window");

assert.strictEqual(policy.displayMarkerDateKey("2026-08-15", -1, addDays, fromDateKey, toDateKey), "2026-08-14");
assert.strictEqual(policy.centeredScrollLeft({
  buckets: dayBuckets,
  anchorKey: "2026-07-03",
  bucketWidth: 10,
  viewportWidth: 50
}), 0);

console.log("project view policy tests passed");
