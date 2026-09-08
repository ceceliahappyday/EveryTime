const assert = require("assert");
const {
  repairPlannerData,
  normalizeTitle,
  isTaskWorkEntry
} = require("../schedule-hierarchy-repair-policy.js");

assert.equal(normalizeTitle("  a  b "), "a b");
assert.equal(isTaskWorkEntry({ entryType: "calendar", taskId: "x" }), false);
assert.equal(isTaskWorkEntry({ entryType: "task_work", taskId: "x" }), true);
assert.equal(isTaskWorkEntry({ taskId: "x" }), true);

let ids = 0;
const createId = () => `new-${++ids}`;

const data = {
  "2026-09-04": {
    note: "",
    tasks: [
      {
        id: "close",
        title: "月度结账",
        parentId: "",
        status: "in_progress",
        dueDate: "",
        owner: "我"
      },
      {
        id: "flow",
        title: "流程制度",
        parentId: "",
        status: "planned",
        dueDate: "2026-08-01",
        owner: "我"
      },
      {
        id: "flow-child",
        title: "既有子任务",
        parentId: "flow",
        status: "planned",
        dueDate: "2026-08-02",
        owner: "我"
      }
    ],
    entries: [
      { id: "e1", title: "完成应收款分析报告", entryType: "task_work", taskId: "close", start: 9, end: 12 },
      { id: "e2", title: "完成存货分析报告", entryType: "task_work", taskId: "close", start: 14, end: 15 },
      { id: "e3", title: "事前申请流程方案内部沟通", entryType: "task_work", taskId: "flow", start: 10, end: 11 },
      { id: "e4", title: "会议", entryType: "calendar", start: 16, end: 17 }
    ]
  }
};

const first = repairPlannerData(data, { createId, now: new Date("2026-09-08T12:00:00") });
assert.equal(first.changed, true);
assert.equal(first.report.createdChildren, 3);
assert.equal(first.report.retargetedEntries, 3);

const tasks = Object.values(data).flatMap(day => day.tasks);
const closeChildren = tasks.filter(task => task.parentId === "close");
assert.equal(closeChildren.length, 2);
assert.ok(closeChildren.some(task => task.title === "完成应收款分析报告"));
assert.ok(closeChildren.some(task => task.title === "完成存货分析报告"));

const flowChildren = tasks.filter(task => task.parentId === "flow");
assert.equal(flowChildren.length, 2);
assert.ok(flowChildren.some(task => task.title === "事前申请流程方案内部沟通"));

const entries = data["2026-09-04"].entries;
assert.notEqual(entries[0].taskId, "close");
assert.notEqual(entries[1].taskId, "close");
assert.notEqual(entries[2].taskId, "flow");
assert.equal(entries[3].entryType, "calendar");
assert.ok(!entries[3].taskId);

const second = repairPlannerData(data, { createId, now: new Date("2026-09-08T12:00:00") });
assert.equal(second.changed, false, "repair must be idempotent");
assert.equal(tasks.filter(task => task.parentId === "close").length, 2);

console.log("schedule hierarchy repair policy tests passed");
