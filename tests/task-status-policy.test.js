const assert = require("node:assert/strict");
const policy = require("../task-status-policy.js");

assert.strictEqual(policy.followUpTaskTitle("合同审批"), "合同审批");
assert.strictEqual(policy.followUpTaskTitle("合同审批 · 跟踪"), "合同审批");
assert.strictEqual(policy.followUpTaskTitle(""), "后续事项");
assert.strictEqual(policy.listDisplayTitle({ title: "234 · 跟踪", status: "tracking" }), "234");
assert.strictEqual(policy.listDisplayTitle("234 · 跟踪"), "234");
assert.strictEqual(policy.stripTrackingTitleSuffix("合同审批 · 跟踪"), "合同审批");
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
assert.strictEqual(policy.listSideBadge({ status: "planned", priority: "follow_up" }).text, "跟踪");
assert.strictEqual(policy.listSideBadge({ status: "in_progress", attentionOnly: true }).text, "跟踪");

assert.equal(policy.isMemoReminder({ status: "tracking" }), true);
assert.equal(policy.isMemoReminder({ status: "planned" }), false);
assert.equal(policy.isAttentionOnly({ status: "in_progress", attentionOnly: true }), true);
assert.equal(policy.isFollowUpPriority({ priority: "follow_up" }), true);
assert.equal(policy.belongsInMemoList({ status: "planned", priority: "follow_up" }), true);
assert.equal(policy.belongsInMemoList({ status: "tracking", priority: "general_daily" }), true);
assert.equal(policy.belongsInMemoList({ status: "in_progress", attentionOnly: true }), true);
assert.equal(policy.belongsInMemoList({ status: "done", priority: "follow_up" }), false);
assert.equal(policy.belongsInMemoList({ status: "planned", priority: "kpi" }), false);
assert.equal(policy.isSchedulableStatus("tracking"), true);
assert.equal(policy.isSchedulableStatus("planned"), true);
assert.equal(policy.isSchedulableStatus("in_progress"), true);
assert.equal(policy.countsTowardWorkHours({ status: "tracking" }), true);
assert.equal(policy.countsTowardWorkHours({ status: "in_progress", attentionOnly: true }), true);
assert.equal(policy.countsTowardWorkHours({ status: "done" }), false);

const normalizedTracking = policy.normalizeAttentionTask({
  status: "tracking",
  title: "合同审批",
  startedAt: "2026-09-04T10:00:00.000Z",
  completedAt: "2026-09-04T12:00:00.000Z"
});
assert.equal(normalizedTracking.attentionOnly, true);
assert.equal(normalizedTracking.status, "in_progress");
assert.equal(normalizedTracking.completedAt, "");

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
assert.strictEqual(successor.status, "planned", "successor defaults to normal work task");
assert.strictEqual(successor.successorFromTaskId, "a1");
assert.strictEqual(successor.parentId, "parent-1");
assert.strictEqual(successor.title, "上线验收");
assert.strictEqual(successor.priority, "kpi", "successor inherits source priority");
assert.strictEqual(successor.startedAt, closedAt);
assert.strictEqual(successor.startOverrideAt, closedAt);
assert.equal(policy.isMemoReminder(successor), false);
assert.equal(policy.countsTowardWorkHours(successor), true);
const attentionSuccessor = policy.buildSuccessorTask({
  id: "a1",
  title: "上线验收",
  parentId: "parent-1",
  owner: "我",
  priority: "kpi",
  businessBackground: "保障版本按期上线",
  completedAt: closedAt
}, { closedAt, attentionOnly: true });
assert.equal(attentionSuccessor.attentionOnly, true);
assert.strictEqual(attentionSuccessor.status, "planned");
assert.strictEqual(attentionSuccessor.priority, "kpi");
assert.equal(policy.isMemoReminder(attentionSuccessor), true);
assert.deepEqual(
  policy.attentionSuccessorIdsToRemove([
    { id: "a1", status: "done", title: "上线验收" },
    { id: "a2", status: "in_progress", attentionOnly: true, followUpFromTaskId: "a1", title: "上线验收" }
  ]),
  ["a2"]
);
assert.deepEqual(
  policy.attentionSuccessorIdsToRemove([
    { id: "a1", status: "done", title: "上线验收" },
    { id: "a3", status: "planned", attentionOnly: true, successorFromTaskId: "a1", priority: "kpi", title: "上线验收" }
  ]),
  [],
  "a marked work successor after 关闭并新建后续 is not a legacy tracking clone"
);
assert.equal(
  policy.isSupersededByOpenFollowOn(
    { id: "a1", status: "done", title: "上线验收" },
    [{ id: "a1", status: "done" }, { ...attentionSuccessor, id: "a2" }]
  ),
  true,
  "closed source with a live 仅关注 successor must not also occupy 待办"
);
assert.equal(
  policy.isSupersededByOpenFollowOn(
    { id: "a1", status: "done", title: "上线验收" },
    [{ id: "a1", status: "done" }, { ...successor, id: "a3" }]
  ),
  false,
  "a normal work successor should not hide the closed source"
);

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
