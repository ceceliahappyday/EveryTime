const assert = require("node:assert/strict");
const {
  shouldIncludeEntryTaskOption,
  entryTaskOptionLabel,
  parentTaskOptionCandidates,
  taskHierarchyPath,
  isValidParentTarget
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
  "计划 · 07-25 · 集团财务月度复盘",
  "parent tasks should be labeled as plans"
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

const hierarchyTasks = [
  { id: "root", title: "Root", status: "planned", parentId: "", dueDate: "" },
  { id: "phase", title: "Phase", status: "planned", parentId: "root", dueDate: "" },
  { id: "leaf", title: "Leaf", status: "planned", parentId: "phase", dueDate: "" },
  { id: "other", title: "Other", status: "planned", parentId: "", dueDate: "2026-07-22" },
  { id: "closed", title: "Closed", status: "done", parentId: "", dueDate: "" }
];

assert.deepEqual(
  parentTaskOptionCandidates({ tasks: hierarchyTasks, editingTaskId: "phase" }).map(task => task.id),
  ["other", "root"],
  "parent candidates should support many levels while excluding self, descendants, and ended tasks"
);

assert.equal(
  taskHierarchyPath({ task: hierarchyTasks[2], tasks: hierarchyTasks }),
  "Root / Phase / Leaf",
  "hierarchy path should show the full nested chain"
);

assert.equal(isValidParentTarget({ sourceId: "leaf", parentId: "root", tasks: hierarchyTasks }), true);
assert.equal(isValidParentTarget({ sourceId: "leaf", parentId: "leaf", tasks: hierarchyTasks }), false);
assert.equal(isValidParentTarget({ sourceId: "root", parentId: "leaf", tasks: hierarchyTasks }), false, "cannot hang ancestor under its descendant");
assert.equal(isValidParentTarget({ sourceId: "other", parentId: "phase", tasks: hierarchyTasks }), true);

const {
  suggestParentForTitle,
  titleSimilarity
} = require("../task-option-policy");
assert.ok(titleSimilarity("合同审批材料", "合同审批清单") > 0.3);
const historyTasks = [
  { id: "p1", title: "资产管理", status: "in_progress", parentId: "" },
  { id: "c1", title: "科技园盈利结构表", status: "done", parentId: "p1", priority: "kpi", updatedAt: "2026-09-01T00:00:00.000Z" },
  { id: "c2", title: "科技园成本结构复核", status: "planned", parentId: "p1", priority: "kpi", updatedAt: "2026-09-20T00:00:00.000Z" },
  { id: "other", title: "无关事项", status: "planned", parentId: "", priority: "general_daily" }
];
const suggestion = suggestParentForTitle({
  title: "科技园盈利结构更新",
  priority: "kpi",
  tasks: historyTasks
});
assert.equal(suggestion?.parentId, "p1", "similar historical tasks should suggest their shared parent");

console.log("task option policy tests passed");
