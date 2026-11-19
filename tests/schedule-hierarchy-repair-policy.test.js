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
const retroLeaf = closeChildren.find(task => task.title === "完成应收款分析报告");
assert.ok(retroLeaf?.createdAtIso?.startsWith("2026-09-08"), "split leaf createdAtIso should be record creation (repair run time)");

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

// Merge survivor leaf under a parent keeps differently titled invests; do not re-split.
const mergeSurvivor = {
  "2026-11-09": {
    note: "",
    tasks: [
      {
        id: "parent-feedback",
        title: "产业公司贡献值业务规则方案评估意见反馈",
        parentId: "root-plan",
        status: "in_progress",
        dueDate: "2026-12-09",
        owner: "黄湾湾"
      },
      {
        id: "leaf-feedback",
        title: "产业公司贡献值业务规则方案评估意见反馈",
        parentId: "parent-feedback",
        status: "in_progress",
        dueDate: "2026-10-26",
        owner: "黄湾湾"
      }
    ],
    entries: [
      {
        id: "inv-1",
        title: "产业公司贡献值业务规则方案评估意见反馈",
        entryType: "task_work",
        taskId: "leaf-feedback",
        start: 11.5,
        end: 14
      },
      {
        id: "inv-2",
        title: "产业公司贡献值业务规则方案第二轮评估",
        entryType: "task_work",
        taskId: "leaf-feedback",
        start: 8.75,
        end: 9.75
      }
    ]
  },
  "2026-12-26": {
    note: "",
    tasks: [
      {
        id: "root-plan",
        title: "产业公司贡献值业务规则方案",
        parentId: "",
        status: "in_progress",
        dueDate: "2026-12-26",
        owner: "黄湾湾"
      }
    ],
    entries: []
  }
};
const afterMerge = repairPlannerData(mergeSurvivor, {
  createId: () => "should-not-create",
  now: new Date("2026-11-19T12:00:00")
});
assert.equal(afterMerge.changed, false, "merged child leaf must not be re-split by entry title");
assert.equal(
  mergeSurvivor["2026-11-09"].tasks.filter(task => task.parentId === "leaf-feedback").length,
  0,
  "no grandchild under merge survivor"
);
assert.equal(mergeSurvivor["2026-11-09"].entries[1].taskId, "leaf-feedback");

console.log("schedule hierarchy repair policy tests passed");
