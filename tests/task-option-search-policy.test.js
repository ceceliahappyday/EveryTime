const assert = require("assert");
const policy = require("../task-option-policy.js");
const tasks = [
  { id: "root", title: "资产管理", status: "planned", dueDate: "2026-08-20" },
  { id: "child", title: "员工培训", parentId: "root", status: "in_progress", dueDate: "2026-08-20" },
  { id: "leaf", title: "准备材料", parentId: "child", status: "planned", dueDate: "2026-08-20" },
  { id: "ended", title: "已关闭事项", status: "closed", dueDate: "2026-08-20" }
];
assert.deepStrictEqual(policy.hierarchyMeta({ task: tasks[0], tasks }), { depth: 1, parentPath: "", path: "资产管理", hasChildren: true, kind: "计划" });
assert.deepStrictEqual(policy.hierarchyMeta({ task: tasks[2], tasks }), { depth: 3, parentPath: "资产管理 › 员工培训", path: "资产管理 › 员工培训 › 准备材料", hasChildren: false, kind: "任务" });
const all = policy.searchTaskCandidates({ tasks, query: "员工培训" });
assert.strictEqual(all[0].task.id, "child");
assert.strictEqual(policy.searchTaskCandidates({ tasks, query: "资产" })[0].task.id, "root");
assert.strictEqual(policy.searchTaskCandidates({ tasks, query: "资产 准备" })[0].task.id, "leaf");
const statusText = task => ({ planned: "计划中", in_progress: "进行中", closed: "已结束" }[task.status] || task.status);
assert.strictEqual(policy.searchTaskCandidates({ tasks, query: "进行中", statusText })[0].task.id, "child");
assert.strictEqual(policy.searchTaskCandidates({ tasks, query: "已关闭", selectedId: "ended", statusText })[0].task.id, "ended");
assert.strictEqual(policy.searchTaskCandidates({ tasks, query: "已关闭", statusText }).length, 0);
assert.strictEqual(policy.normalizeSearchText("资产管理 › 员工培训"), "资产管理 员工培训");
console.log("task option search policy tests passed");
