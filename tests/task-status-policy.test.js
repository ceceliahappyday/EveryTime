const assert = require("node:assert/strict");
const policy = require("../task-status-policy.js");

assert.strictEqual(policy.followUpTaskTitle("合同审批"), "合同审批");
assert.strictEqual(policy.followUpTaskTitle("合同审批 · 跟踪"), "合同审批");
assert.strictEqual(policy.followUpTaskTitle(""), "后续事项");
assert.strictEqual(policy.scheduleOverviewKind({ taskStatus: "tracking", investedHours: 0 }), "tracking");
assert.strictEqual(policy.scheduleOverviewKind({ taskStatus: "planned", investedHours: 0 }), "planned");
assert.strictEqual(policy.scheduleOverviewKind({ taskStatus: "tracking", investedHours: 1 }), "tracking");
assert.strictEqual(policy.scheduleOverviewBadge({ kind: "tracking" }), "备忘");
assert.strictEqual(policy.scheduleOverviewBadge({ kind: "planned" }), "计划");
assert.strictEqual(policy.scheduleOverviewBadge({ kind: "actual" }), "进行");
assert.strictEqual(policy.statusLabel("tracking"), "待跟踪");
assert.strictEqual(policy.statusLabel("done"), "已关闭");
assert.strictEqual(policy.listSideBadge({ status: "done", priority: "follow_up" }).text, "关闭");
assert.strictEqual(policy.listSideBadge({ status: "tracking", priority: "follow_up" }).text, "跟踪");
assert.equal(policy.listSideBadge({ status: "planned", priority: "follow_up" }), null);

assert.equal(policy.isMemoReminder({ status: "tracking" }), true);
assert.equal(policy.isMemoReminder({ status: "planned" }), false);
assert.equal(policy.isFollowUpPriority({ priority: "follow_up" }), true);
assert.equal(policy.belongsInMemoList({ status: "planned", priority: "follow_up" }), true);
assert.equal(policy.belongsInMemoList({ status: "tracking", priority: "general_daily" }), true);
assert.equal(policy.belongsInMemoList({ status: "done", priority: "follow_up" }), false);
assert.equal(policy.belongsInMemoList({ status: "planned", priority: "kpi" }), false);
assert.equal(policy.isSchedulableStatus("tracking"), false);
assert.equal(policy.isSchedulableStatus("planned"), true);
assert.equal(policy.isSchedulableStatus("in_progress"), true);
assert.equal(policy.countsTowardWorkHours({ status: "tracking" }), false);

const closedAt = "2026-09-04T10:00:00.000Z";
const followUp = policy.buildFollowUpTask({
  id: "a1",
  title: "上线验收",
  parentId: "parent-1",
  businessBackground: "保障版本按期上线",
  description: "完成验收清单",
  problemReason: "验收材料不全",
  completedAt: closedAt
}, { closedAt });
assert.strictEqual(followUp.status, "tracking");
assert.strictEqual(followUp.followUpFromTaskId, "a1");
assert.strictEqual(followUp.parentId, "parent-1");
assert.strictEqual(followUp.title, "上线验收");
assert.strictEqual(followUp.dueDate, "");
assert.strictEqual(followUp.deliveryNote, "");
assert.strictEqual(followUp.startedAt, closedAt);
assert.strictEqual(followUp.startOverrideAt, closedAt);
assert.strictEqual(followUp.description, "完成验收清单");
assert.strictEqual(followUp.problemReason, "验收材料不全");
assert.strictEqual(followUp.businessBackground, "上线验收\n保障版本按期上线");
assert.strictEqual(followUp.priority, "follow_up");

const successor = policy.buildSuccessorTask({
  id: "a1",
  title: "上线验收",
  parentId: "parent-1",
  priority: "kpi",
  owner: "我",
  businessBackground: "保障版本按期上线",
  completedAt: closedAt
}, { closedAt });
assert.strictEqual(successor.status, "planned");
assert.strictEqual(successor.successorFromTaskId, "a1");
assert.strictEqual(successor.parentId, "parent-1");
assert.strictEqual(successor.title, "上线验收 · 后续");
assert.strictEqual(successor.priority, "kpi");
assert.strictEqual(successor.startedAt, closedAt);
assert.strictEqual(successor.startOverrideAt, closedAt);
assert.equal(policy.isMemoReminder(successor), false);
assert.equal(policy.countsTowardWorkHours(successor), true);

const workFromMemo = policy.buildWorkTodoFromMemo({
  id: "memo-1",
  title: "上线验收",
  parentId: "parent-1",
  priority: "follow_up",
  description: "关注材料齐备",
  businessBackground: "上线验收\n保障版本按期上线",
  owner: "我"
}, { dueDate: "2026-09-23", dueTime: "18:00" });
assert.strictEqual(workFromMemo.status, "planned");
assert.strictEqual(workFromMemo.memoFromTaskId, "memo-1");
assert.strictEqual(workFromMemo.parentId, "parent-1");
assert.strictEqual(workFromMemo.title, "上线验收");
assert.strictEqual(workFromMemo.dueDate, "2026-09-23");
assert.strictEqual(workFromMemo.dueTime, "18:00");
assert.strictEqual(workFromMemo.priority, "general_daily");
assert.strictEqual(workFromMemo.progress, 0);

console.log("task status policy tests passed");
