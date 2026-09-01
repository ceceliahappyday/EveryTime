const assert = require("node:assert/strict");
const policy = require("../task-status-policy.js");

assert.strictEqual(policy.followUpTaskTitle("合同审批"), "合同审批 · 跟踪");
assert.strictEqual(policy.followUpTaskTitle("合同审批 · 跟踪"), "合同审批 · 跟踪");
assert.strictEqual(policy.scheduleOverviewKind({ taskStatus: "tracking", investedHours: 0 }), "tracking");
assert.strictEqual(policy.scheduleOverviewKind({ taskStatus: "planned", investedHours: 0 }), "planned");
assert.strictEqual(policy.scheduleOverviewKind({ taskStatus: "tracking", investedHours: 1 }), "actual");
assert.strictEqual(policy.scheduleOverviewBadge({ kind: "tracking" }), "跟踪");
assert.strictEqual(policy.scheduleOverviewBadge({ kind: "planned" }), "计划");
assert.strictEqual(policy.scheduleOverviewBadge({ kind: "actual" }), "进行");
assert.strictEqual(policy.buildFollowUpTask({ id: "a1", title: "上线验收", owner: "我" }, "2026-09-01").status, "tracking");
assert.strictEqual(policy.buildFollowUpTask({ id: "a1", title: "上线验收" }, "2026-09-01").followUpFromTaskId, "a1");

console.log("task status policy tests passed");
