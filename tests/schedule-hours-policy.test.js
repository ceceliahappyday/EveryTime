const assert = require("assert");
const policy = require("../schedule-hours-policy.js");

const splitDefault = policy.normalizeWorkSegments({
  morningStart: 8.5,
  morningEnd: 12,
  afternoonStart: 13.5,
  afternoonEnd: 18
});
assert.strictEqual(splitDefault.workdayHours, 8);
assert.deepStrictEqual(splitDefault.segments, [
  { start: 8.5, end: 12 },
  { start: 13.5, end: 18 }
]);
assert.strictEqual(splitDefault.workStartHour, 8.5);
assert.strictEqual(splitDefault.workEndHour, 18);

const legacy = policy.normalizeWorkHours({ workStartHour: 9, workEndHour: 18 });
assert.strictEqual(legacy.workStartHour, 9);
assert.strictEqual(legacy.workEndHour, 18);
assert.strictEqual(legacy.workdayHours, 8, "legacy 9–18 keeps a noon lunch gap");
assert.deepStrictEqual(legacy.segments, [
  { start: 9, end: 12 },
  { start: 13, end: 18 }
]);

const invalid = policy.normalizeWorkHours({ workStartHour: 18, workEndHour: 9 });
assert.strictEqual(invalid.workStartHour, 18);
assert.strictEqual(invalid.workEndHour, 19);
assert.strictEqual(invalid.workdayHours, 1);

assert.deepStrictEqual(
  policy.visibleTimelineHours({
    morningStart: 8.5,
    morningEnd: 12,
    afternoonStart: 13.5,
    afternoonEnd: 18,
    entries: []
  }),
  [8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
  "timeline still shows the envelope including lunch hour slots"
);
assert.strictEqual(
  policy.timelineEndLabelHour([8, 9, 10, 11, 12, 13, 14, 15, 16, 17], 18),
  18,
  "workday end label must show the configured cutoff hour"
);

assert.deepStrictEqual(
  policy.visibleTimelineHours({
    workStartHour: 9,
    workEndHour: 18,
    entries: [{ start: 7.5, end: 8.5 }, { start: 21, end: 22.25 }]
  }),
  [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
  "off-hours entries should expand the contiguous visible window"
);

assert.ok(policy.workdayPlanHoursBetween({
  startIso: "2026-10-06T10:00:00",
  dueDate: "2026-10-08",
  dueTime: "18:00",
  morningStart: 8.5,
  morningEnd: 12,
  afternoonStart: 13.5,
  afternoonEnd: 18
}) > 0, "plan hours should count segmented workday hours between create and due");

assert.strictEqual(
  policy.workdayPlanHoursBetween({
    startIso: "2026-10-09T08:30:00",
    dueDate: "2026-10-09",
    dueTime: "18:00",
    morningStart: 8.5,
    morningEnd: 12,
    afternoonStart: 13.5,
    afternoonEnd: 18
  }),
  8,
  "same weekday plan excludes lunch break"
);

assert.strictEqual(
  policy.workdayPlanHoursBetween({
    startIso: "2026-10-09T09:00:00",
    dueDate: "2026-10-09",
    dueTime: "18:00",
    workStartHour: 9,
    workEndHour: 18
  }),
  8,
  "legacy single window migrating through lunch still excludes 12–13"
);

assert.strictEqual(
  policy.workdayPlanHoursBetween({
    startIso: "2026-10-10T09:00:00",
    dueDate: "2026-10-11",
    dueTime: "18:00",
    workStartHour: 9,
    workEndHour: 18
  }),
  0,
  "weekend-only ranges contribute no plan hours"
);

assert.strictEqual(policy.shouldShowWeekColumn({ dayIndex: 0, hasActivity: false }), true);
assert.strictEqual(policy.shouldShowWeekColumn({ dayIndex: 5, hasActivity: false }), false);
assert.strictEqual(policy.shouldShowWeekColumn({ dayIndex: 6, hasActivity: true }), true);
assert.deepStrictEqual(
  policy.visibleWeekDayIndexes({ hasActivityByIndex: index => index === 6 }),
  [0, 1, 2, 3, 4, 6]
);

console.log("schedule hours policy tests passed");
