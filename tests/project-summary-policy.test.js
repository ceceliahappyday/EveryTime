const assert = require("node:assert/strict");
const {
  summarizeProject,
  projectProgressPercent,
  taskProgressPercent,
  classifyProjectStatus
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
    getTaskDuration: taskId => ({ c1: 2.5, c2: 1.25 }[taskId] || 0),
    getTaskScheduledHours: taskId => ({ c1: 2.5, c2: 2.5 }[taskId] || 0)
});

assert.equal(summary.taskCount, 2, "child task count should be summarized");
assert.equal(summary.doneCount, 1, "completed child tasks should be counted");
assert.equal(summary.totalHours, 3.75, "child work hours should be summed");
assert.equal(summary.firstStartIso, "2026-07-02T09:00:00.000Z", "earliest child start should be captured");
assert.equal(summary.lastCompletedIso, "2026-07-03T10:00:00.000Z", "latest completed child time should be captured");
assert.equal(projectProgressPercent(summary), 75, "project progress should use invested hours, with completed work at 100%");
assert.equal(summary.status, "in_progress", "project should be in progress when any child is in progress");
assert.deepEqual(summary.statusCounts, {
  unplanned: 0,
  planned: 0,
  in_progress: 1,
  ended: 1
}, "project should summarize children by status");

assert.equal(classifyProjectStatus([{ status: "planned" }, { status: "unplanned" }]), "planned");
assert.equal(classifyProjectStatus([{ status: "done" }, { status: "closed" }]), "ended");
assert.equal(classifyProjectStatus([{ status: "unplanned" }]), "unplanned");

assert.equal(taskProgressPercent({ status: "planned", investedHours: 0, scheduledHours: 2 }), 0);
assert.equal(taskProgressPercent({ status: "in_progress", investedHours: 1, scheduledHours: 2 }), 50);
assert.equal(taskProgressPercent({ status: "done", investedHours: 0, scheduledHours: 2 }), 100);

console.log("project summary policy tests passed");
