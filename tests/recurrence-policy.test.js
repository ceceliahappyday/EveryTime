const assert = require("node:assert/strict");
const { shouldGenerateRecurringMonth } = require("../recurrence-policy");

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
