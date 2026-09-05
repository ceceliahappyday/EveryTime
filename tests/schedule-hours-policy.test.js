const assert = require("assert");
const policy = require("../schedule-hours-policy.js");

assert.deepStrictEqual(
  policy.normalizeWorkHours({ workStartHour: 9, workEndHour: 18 }),
  { workStartHour: 9, workEndHour: 18 }
);
assert.deepStrictEqual(
  policy.normalizeWorkHours({ workStartHour: 18, workEndHour: 9 }),
  { workStartHour: 18, workEndHour: 19 },
  "invalid range should expand to at least one hour"
);

assert.deepStrictEqual(
  policy.visibleTimelineHours({ workStartHour: 9, workEndHour: 18, entries: [] }),
  [9, 10, 11, 12, 13, 14, 15, 16, 17]
);
assert.strictEqual(
  policy.timelineEndLabelHour([9, 10, 11, 12, 13, 14, 15, 16, 17], 18),
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

assert.strictEqual(policy.shouldShowWeekColumn({ dayIndex: 0, hasActivity: false }), true);
assert.strictEqual(policy.shouldShowWeekColumn({ dayIndex: 5, hasActivity: false }), false);
assert.strictEqual(policy.shouldShowWeekColumn({ dayIndex: 6, hasActivity: true }), true);
assert.deepStrictEqual(
  policy.visibleWeekDayIndexes({ hasActivityByIndex: index => index === 6 }),
  [0, 1, 2, 3, 4, 6]
);

console.log("schedule hours policy tests passed");
