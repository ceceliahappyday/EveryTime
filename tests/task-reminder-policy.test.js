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
const overdue = { id: "o", status: "planned", dueDate: "2026-11-07" };
const today = { id: "t", status: "planned", dueDate: "2026-11-09" };
const upcoming = { id: "u", status: "planned", dueDate: "2026-11-10" };
const later = { id: "l", status: "planned", dueDate: "2026-11-20" };

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

assert.equal(policy.classifyDueReminder(overdue, "2026-11-09", settings, deps), "overdue");
assert.equal(policy.classifyDueReminder(today, "2026-11-09", settings, deps), "due_today");
assert.equal(policy.classifyDueReminder(upcoming, "2026-11-09", settings, deps), "upcoming");
assert.equal(policy.classifyDueReminder(later, "2026-11-09", settings, deps), null);
assert.match(policy.tierLabel("overdue", -2), /已逾期 2 天/);
assert.match(policy.tierLabel("upcoming", 1), /还有 1 天/);

const groups = policy.groupAttentionAlarmOverlay(
  [overdue, today, upcoming, later],
  "2026-11-09",
  settings,
  deps
);
assert.deepEqual(groups.map(g => g.tier), ["overdue", "due_today", "upcoming"]);
assert.equal(groups.every(g => g.tasks.every(task => task.id !== "l")), true, "out-of-window tasks are hidden");

console.log("task reminder policy tests passed");
