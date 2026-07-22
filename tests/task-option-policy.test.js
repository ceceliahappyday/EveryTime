const assert = require("node:assert/strict");
const {
  shouldIncludeEntryTaskOption,
  entryTaskOptionLabel
} = require("../task-option-policy");

const parentTask = {
  id: "parent-1",
  title: "集团财务月度复盘",
  status: "planned",
  dueDate: "2026-07-25"
};

assert.equal(
  shouldIncludeEntryTaskOption({
    task: parentTask,
    isHiddenFutureRecurringInstance: false
  }),
  true,
  "the schedule task picker should include parent/main-plan tasks"
);

assert.equal(
  shouldIncludeEntryTaskOption({
    task: { ...parentTask, status: "done" },
    isHiddenFutureRecurringInstance: false
  }),
  false,
  "ended tasks should stay out of the schedule task picker by default"
);

assert.equal(
  shouldIncludeEntryTaskOption({
    task: parentTask,
    isHiddenFutureRecurringInstance: true
  }),
  false,
  "future recurring instances hidden from the app should stay out of the schedule task picker"
);

assert.equal(
  entryTaskOptionLabel({
    task: parentTask,
    selectedDate: "2026-07-22",
    hasChildren: true
  }),
  "主计划 · 07-25 · 集团财务月度复盘",
  "parent tasks should be labeled as main plans"
);

assert.equal(
  entryTaskOptionLabel({
    task: { id: "leaf-1", title: "面试黄佩佩", status: "planned", dueDate: "2026-07-22" },
    selectedDate: "2026-07-22",
    hasChildren: false
  }),
  "待办 · 今天 · 面试黄佩佩",
  "leaf tasks should be labeled as todos"
);

console.log("task option policy tests passed");
