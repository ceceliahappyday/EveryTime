const assert = require("node:assert/strict");
const policy = require("../task-reminder-policy.js");
const status = require("../task-status-policy.js");

const deps = {
  isEndedStatus: status.isEndedStatus,
  isAttentionOnlyFn: status.isAttentionOnly
};
const settings = policy.normalizeSettings({ dueReminderLeadDays: [1, 0] });

const attention = { status: "planned", attentionOnly: true, dueDate: "2026-11-09" };
const work = { status: "planned", attentionOnly: false, dueDate: "2026-11-10" };

assert.equal(policy.isDueReminderDue(attention, "2026-11-09", settings, deps), true);
assert.equal(policy.isDueReminderDue(work, "2026-11-09", settings, deps), true, "lead 1 day");
assert.equal(policy.isDueReminderDue(work, "2026-11-08", settings, deps), false);
assert.equal(policy.isAttentionBadgeDue(attention, "2026-11-09", settings, deps), true);
assert.equal(policy.isAttentionBadgeDue(work, "2026-11-09", settings, deps), false);

const offAttention = policy.normalizeSettings({ dueReminderIncludeAttention: false });
assert.equal(policy.isDueReminderDue(attention, "2026-11-09", offAttention, deps), false);
assert.equal(policy.isAttentionBadgeDue(attention, "2026-11-09", offAttention, deps), false);

const list = policy.filterDueReminderTasks([attention, work], "2026-11-09", settings, deps);
assert.equal(list.length, 2, "same task must not duplicate paths");

console.log("task reminder policy tests passed");
