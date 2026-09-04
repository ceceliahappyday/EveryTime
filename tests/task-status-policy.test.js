const assert = require("node:assert/strict");
const policy = require("../task-status-policy.js");

assert.strictEqual(policy.followUpTaskTitle("合同审批"), "合同审批");
assert.strictEqual(policy.followUpTaskTitle("合同审批 · 跟踪"), "合同审批");
assert.strictEqual(policy.followUpTaskTitle(""), "后续事项");
assert.strictEqual(policy.scheduleOverviewKind({ taskStatus: "tracking", investedHours: 0 }), "tracking");
assert.strictEqual(policy.scheduleOverviewKind({ taskStatus: "planned", investedHours: 0 }), "planned");
assert.strictEqual(policy.scheduleOverviewKind({ taskStatus: "tracking", investedHours: 1 }), "actual");
assert.strictEqual(policy.scheduleOverviewBadge({ kind: "tracking" }), "跟踪");
assert.strictEqual(policy.scheduleOverviewBadge({ kind: "planned" }), "计划");
assert.strictEqual(policy.scheduleOverviewBadge({ kind: "actual" }), "进行");
assert.strictEqual(policy.statusLabel("tracking"), "待跟踪");
assert.strictEqual(policy.statusLabel("done"), "已关闭");
assert.strictEqual(policy.listSideBadge({ status: "done", priority: "follow_up" }).text, "关闭");
assert.strictEqual(policy.listSideBadge({ status: "tracking", priority: "follow_up" }).text, "跟踪");
assert.equal(policy.listSideBadge({ status: "planned", priority: "follow_up" }), null);

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

console.log("task status policy tests passed");
