const assert = require("node:assert/strict");
const {
  shouldGenerateRecurringMonth,
  dedupeRecurringTasksForDisplay,
  dedupeRecurringTasksForProject,
  filterCanonicalRecurringTasks,
  canonicalRecurringKeepIds,
  isNonCanonicalRecurringInstance,
  pickCanonicalRecurringTask
} = require("../recurrence-policy");

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
  { id: "template", title: "月度工作复盘", dueDate: "2026-07-25", status: "planned", recurrence: { frequency: "monthly" }, recurrenceGroupId: "monthly-review" },
  { id: "instance", title: "月度工作复盘", dueDate: "2026-07-25", status: "planned", recurrence: { frequency: "monthly" }, recurrenceGroupId: "monthly-review" },
  { id: "next-month", title: "月度工作复盘", dueDate: "2026-08-25", status: "planned", recurrence: { frequency: "monthly" }, recurrenceGroupId: "monthly-review" }
];
assert.deepEqual(
  dedupeRecurringTasksForDisplay(recurringTasks).map(task => task.id),
  ["template", "next-month"],
  "one recurring task instance should be shown per month while preserving other months"
);
assert.deepEqual(
  dedupeRecurringTasksForProject(recurringTasks, "2026-08").map(task => task.id),
  ["next-month"],
  "project/catalog view should keep one logical recurring task for the current month"
);

const historical = [
  { id: "jul", title: "月报", dueDate: "2026-07-10", status: "done", recurrence: { frequency: "monthly" }, recurrenceGroupId: "monthly-report" },
  { id: "aug", title: "月报", dueDate: "2026-08-10", status: "planned", recurrence: { frequency: "monthly" }, recurrenceGroupId: "monthly-report" },
  { id: "sep", title: "月报", dueDate: "2026-09-10", status: "planned", recurrence: { frequency: "monthly" }, recurrenceGroupId: "monthly-report" },
  { id: "other", title: "普通任务", dueDate: "2026-08-01", status: "planned" }
];
const { keepIds } = canonicalRecurringKeepIds(historical, "2026-09");
assert.ok(keepIds.has("sep"));
assert.ok(!keepIds.has("jul"));
assert.ok(!keepIds.has("aug"));
assert.equal(pickCanonicalRecurringTask(historical.filter(task => task.recurrenceGroupId === "monthly-report"), "2026-09").id, "sep");
assert.deepEqual(
  filterCanonicalRecurringTasks(historical, "2026-09").map(task => task.id).sort(),
  ["other", "sep"],
  "catalog should expose one logical monthly task plus ordinary tasks"
);
assert.equal(isNonCanonicalRecurringInstance(historical[0], keepIds), true);
assert.equal(isNonCanonicalRecurringInstance(historical[2], keepIds), false);

const {
  relatedRecurringParentIds,
  childBelongsToParentInstance
} = require("../recurrence-policy");

const monthlyParentFamily = [
  { id: "jul-parent", title: "月度结账", dueDate: "2026-07-28", recurrence: { frequency: "monthly" }, recurrenceGroupId: "month-close" },
  { id: "aug-parent", title: "月度结账", dueDate: "2026-08-28", recurrence: { frequency: "monthly" }, recurrenceGroupId: "month-close" },
  { id: "child-undated", title: "对账明细", parentId: "jul-parent", dueDate: "", status: "planned" },
  { id: "child-aug", title: "税务申报", parentId: "jul-parent", dueDate: "2026-08-15", status: "planned" }
];
const augRelated = relatedRecurringParentIds(monthlyParentFamily, "aug-parent");
assert.ok(augRelated.has("jul-parent") && augRelated.has("aug-parent"));
assert.equal(
  childBelongsToParentInstance({
    child: monthlyParentFamily[2],
    parent: monthlyParentFamily[1],
    relatedParentIds: augRelated
  }),
  true,
  "undated children under an older monthly parent instance must still resolve for the current month parent"
);
assert.equal(
  childBelongsToParentInstance({
    child: monthlyParentFamily[3],
    parent: monthlyParentFamily[1],
    relatedParentIds: augRelated
  }),
  true,
  "same-month dated children must resolve even when parentId still points at last month"
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
