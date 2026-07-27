const assert = require("node:assert/strict");
const { shouldGenerateRecurringMonth, dedupeRecurringTasksForDisplay } = require("../recurrence-policy");

assert.equal(
  shouldGenerateRecurringMonth({
    targetMonth: "2026-08",
    currentMonth: "2026-07",
    startMonth: "2026-07",
    untilMonth: "2026-12"
  }),
  false,
  "viewing a future month must not pre-generate recurring task instances"
);

const recurringTasks = [
  { id: "template", title: "月度工作复盘", dueDate: "2026-07-25", recurrence: { frequency: "monthly" }, recurrenceGroupId: "monthly-review" },
  { id: "instance", title: "月度工作复盘", dueDate: "2026-07-25", recurrence: { frequency: "monthly" }, recurrenceGroupId: "monthly-review" },
  { id: "next-month", title: "月度工作复盘", dueDate: "2026-08-25", recurrence: { frequency: "monthly" }, recurrenceGroupId: "monthly-review" }
];
assert.deepEqual(
  dedupeRecurringTasksForDisplay(recurringTasks).map(task => task.id),
  ["template", "next-month"],
  "one recurring task instance should be shown per month while preserving other months"
);

assert.equal(
  shouldGenerateRecurringMonth({
    targetMonth: "2026-08",
    currentMonth: "2026-08",
    startMonth: "2026-07",
    untilMonth: "2026-12"
  }),
  true,
  "the recurring task instance should be generated when the real calendar reaches that month"
);

assert.equal(
  shouldGenerateRecurringMonth({
    targetMonth: "2026-06",
    currentMonth: "2026-06",
    startMonth: "2026-07",
    untilMonth: "2026-12"
  }),
  false,
  "months before the first due month should never be generated"
);

assert.equal(
  shouldGenerateRecurringMonth({
    targetMonth: "2027-01",
    currentMonth: "2027-01",
    startMonth: "2026-07",
    untilMonth: "2026-12"
  }),
  false,
  "months after the recurrence end month should not be generated"
);

console.log("recurrence policy tests passed");
