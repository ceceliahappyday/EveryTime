const assert = require("assert");
const policy = require("../project-view-policy.js");

const buckets = [
  { key: "2026-06-01" }, { key: "2026-07-01" }, { key: "2026-08-01" },
  { key: "2026-09-01" }, { key: "2026-10-01" }
];
assert.strictEqual(policy.anchorIndex(buckets, "2026-08-01"), 2);
assert.strictEqual(policy.anchorScrollLeft({ buckets, anchorKey: "2026-08-01", labelWidth: 180, bucketWidth: 72 }), 144);
assert.strictEqual(policy.anchorScrollLeft({ buckets, anchorKey: "missing", labelWidth: 180, bucketWidth: 72 }), 0);
assert.strictEqual(policy.futureBucketCount("day"), 30);
assert.strictEqual(policy.futureBucketCount("week"), 6);
assert.strictEqual(policy.futureBucketCount("month"), 2);
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

const weekBuckets = [
  { key: "2026-07-06" },
  { key: "2026-07-13" }
];
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
const weekBucketKey = dateKey => {
  const monday = getMonday(fromDateKey(dateKey));
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
};
const weekSegments = policy.investmentSegments({
  investedDateKeys: ["2026-07-09", "2026-07-16"],
  buckets: weekBuckets,
  projectBucketKey: weekBucketKey,
  scale: "week",
  getMonday,
  fromDateKey
});
assert.strictEqual(weekSegments.length, 2);
assert.ok(weekSegments.every(segment => segment.widthRatio < 1 / weekBuckets.length));
assert.ok(Math.abs(weekSegments[0].widthRatio - (1 / 7 / weekBuckets.length)) < 0.001);
assert.ok(Math.abs(weekSegments[1].leftRatio - ((1 + 3 / 7) / weekBuckets.length)) < 0.001);

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
assert.strictEqual(policy.shouldShowDueFlag("unplanned"), false);

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
}), { startKey: "2026-08-01", endKey: "2026-08-30" });

assert.deepStrictEqual(policy.initialGanttWindow({
  scale: "week",
  centerDateKey: "2026-08-15",
  addDays,
  getMonday,
  fromDateKey,
  toDateKey
}), { startKey: "2026-07-20", endKey: "2026-08-24" });

assert.deepStrictEqual(policy.extendGanttWindow({
  scale: "day",
  startKey: "2026-08-01",
  endKey: "2026-08-30",
  direction: "past",
  addDays,
  fromDateKey,
  toDateKey
}), { startKey: "2026-07-02", endKey: "2026-08-30", addedCount: 30 });

assert.strictEqual(policy.displayMarkerDateKey("2026-08-15", -1, addDays, fromDateKey, toDateKey), "2026-08-14");
assert.strictEqual(policy.centeredScrollLeft({
  buckets: dayBuckets,
  anchorKey: "2026-07-03",
  bucketWidth: 10,
  viewportWidth: 50
}), 0);

console.log("project view policy tests passed");
