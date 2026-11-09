const assert = require("node:assert/strict");
global.TaskActualStartPolicy = require("../task-actual-start-policy.js");
global.ScheduleDayPolicy = require("../schedule-day-policy.js");
global.TaskStatusPolicy = require("../task-status-policy.js");
const policy = require("../task-timeline-backfill-policy.js");

assert.equal(
  policy.inferPersistedStartedAt(
    {},
    { firstInvestIso: "2026-02-01T08:00:00.000Z" }
  ),
  "2026-02-01T08:00:00.000Z",
  "empty startedAt should backfill from first invest"
);
assert.equal(
  policy.inferPersistedStartedAt(
    { startedAt: "2026-01-01T08:00:00.000Z" },
    { firstInvestIso: "2026-02-01T08:00:00.000Z" }
  ),
  "",
  "existing startedAt must not be replaced"
);

assert.equal(
  policy.inferPersistedCompletedAt(
    { status: "done", dueDate: "2026-03-01", dueTime: "18:00" },
    {
      lastInvestEndIso: "2026-03-01T11:00:00.000Z",
      dueDateTimeIso: task => (task.dueDate ? `${task.dueDate}T18:00:00.000Z` : "")
    }
  ),
  "2026-03-01T11:00:00.000Z",
  "ended task should prefer last invest over due"
);

const openTask = { status: "planned", startedAt: "" };
policy.ensureTaskTimelineBackfill(openTask, { firstInvestIso: "2026-04-01T09:00:00.000Z" });
assert.equal(openTask.startedAt, "2026-04-01T09:00:00.000Z");

const doneTask = {
  status: "done",
  completedAt: "",
  updatedAt: "2026-05-02T15:00:00.000Z",
  createdAtIso: "2026-05-01T09:00:00.000Z"
};
policy.ensureTaskTimelineBackfill(doneTask, {});
assert.equal(doneTask.completedAt, "2026-05-02T15:00:00.000Z", "done without schedule should use updatedAt");

const tracking = { status: "tracking", completedAt: "", updatedAt: "2026-06-01T09:00:00.000Z" };
policy.ensureTaskTimelineBackfill(tracking, {});
assert.equal(tracking.completedAt, "", "tracking tasks must not get completedAt");

const retro = {
  createdAtIso: "2026-09-17T10:11:00.000Z",
  dueDate: "2026-06-25",
  startedAt: "2026-06-25T07:00:00.000Z",
  status: "in_progress",
  completedAt: "2026-10-10T10:10:00.000Z"
};
policy.ensureTaskTimelineBackfill(retro, {
  firstInvestIso: "2026-06-25T07:00:00.000Z",
  dueDateTimeIso: task => `${task.dueDate}T18:00:00.000Z`
});
assert.equal(retro.createdAtIso, "2026-09-17T10:11:00.000Z", "createdAtIso is record time and must not move");
assert.equal(retro.status, "done", "completedAt should sync status to done");

console.log("task timeline backfill policy tests passed");
