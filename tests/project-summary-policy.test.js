const assert = require("node:assert/strict");
const {
  summarizeProject,
  projectProgressPercent
} = require("../project-summary-policy");

const parent = { id: "p1", title: "月度财务复盘", status: "planned" };
const children = [
  {
    id: "c1",
    parentId: "p1",
    title: "整理台账",
    status: "done",
    startedAt: "2026-07-02T09:00:00.000Z",
    completedAt: "2026-07-03T10:00:00.000Z",
    dueDate: "2026-07-05"
  },
  {
    id: "c2",
    parentId: "p1",
    title: "输出复盘结论",
    status: "in_progress",
    startedAt: "2026-07-04T09:00:00.000Z",
    completedAt: "",
    dueDate: "2026-07-08"
  }
];

const summary = summarizeProject({
  parent,
  children,
  getTaskDuration: taskId => ({ c1: 2.5, c2: 1.25 }[taskId] || 0)
});

assert.equal(summary.taskCount, 2, "child task count should be summarized");
assert.equal(summary.doneCount, 1, "completed child tasks should be counted");
assert.equal(summary.totalHours, 3.75, "child work hours should be summed");
assert.equal(summary.firstStartIso, "2026-07-02T09:00:00.000Z", "earliest child start should be captured");
assert.equal(summary.lastCompletedIso, "2026-07-03T10:00:00.000Z", "latest completed child time should be captured");
assert.equal(projectProgressPercent(summary), 50, "project progress should use completed child count");

console.log("project summary policy tests passed");
