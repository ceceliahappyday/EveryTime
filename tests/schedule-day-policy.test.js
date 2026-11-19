const assert = require("node:assert/strict");
const policy = require("../schedule-day-policy.js");

const ended = status => status === "done" || status === "closed";

assert.equal(
  policy.taskDuePlannedOnDate({ id: "a", dueDate: "2026-11-05", status: "planned" }, "2026-11-05", { isEndedStatus: ended }),
  true
);
assert.equal(
  policy.taskDuePlannedOnDate({ id: "b", dueDate: "2026-11-05", status: "done", completedAt: "2026-11-09T10:00:00.000Z" }, "2026-11-09", { isEndedStatus: ended }),
  false,
  "closed tasks must not show as计划 on calendar due date"
);

assert.equal(
  policy.taskVisibleInDateScope({
    task: { id: "c", dueDate: "2026-10-01", status: "done", completedAt: "2026-10-01T12:00:00.000Z" },
    dateKey: "2026-11-09",
    storageKey: "2026-11-09",
    hasInvestOnDate: false,
    startedOnDate: false,
    completedOnDate: false,
    dueOnDate: false,
    isEndedStatus: ended,
    isHiddenFuture: () => false
  }),
  false,
  "stale storage bucket alone must not pin closed tasks to today"
);

assert.equal(
  policy.pickDefaultCompletionIso(
    { dueDate: "2026-10-12", dueTime: "17:00" },
    { dueDateTimeIso: () => "2026-10-12T09:00:00.000Z" }
  ),
  "2026-10-12T09:00:00.000Z",
  "without now, backfill may use due as historical completion"
);

assert.equal(
  policy.pickDefaultCompletionIso(
    { dueDate: "2026-11-20", startedAt: "2026-11-10T09:00:00.000Z" },
    {
      lastInvestEndIso: "2026-11-15T11:30:00.000Z",
      dueDateTimeIso: () => "2026-11-20T10:00:00.000Z",
      nowIso: "2026-11-17T03:00:00.000Z"
    }
  ),
  "2026-11-15T11:30:00.000Z",
  "last actual invest wins over start/due/now"
);

assert.equal(
  policy.pickDefaultCompletionIso(
    { dueDate: "2026-11-20", startOverrideAt: "2026-11-12T08:00:00.000Z" },
    {
      dueDateTimeIso: () => "2026-11-20T10:00:00.000Z",
      nowIso: "2026-11-17T03:00:00.000Z"
    }
  ),
  "2026-11-12T08:00:00.000Z",
  "without invest, actual start beats due"
);

assert.equal(
  policy.pickDefaultCompletionIso(
    { dueDate: "2026-11-20" },
    {
      dueDateTimeIso: () => "2026-11-20T10:00:00.000Z",
      createdAtIso: "2026-11-01T02:00:00.000Z",
      nowIso: "2026-11-17T03:00:00.000Z"
    }
  ),
  "2026-11-17T03:00:00.000Z",
  "without start/invest, earlier of due and now"
);

assert.equal(
  policy.pickDefaultCompletionIso(
    { dueDate: "2026-11-10" },
    {
      dueDateTimeIso: () => "2026-11-10T10:00:00.000Z",
      nowIso: "2026-11-17T03:00:00.000Z"
    }
  ),
  "2026-11-10T10:00:00.000Z",
  "past due is kept when earlier than now"
);

assert.equal(
  policy.pickDefaultCompletionIso(
    {},
    {
      createdAtIso: "2026-11-01T02:00:00.000Z",
      nowIso: "2026-11-17T03:00:00.000Z"
    }
  ),
  "2026-11-01T02:00:00.000Z",
  "no due/start/invest falls back to createdAt"
);

assert.equal(
  policy.validateCompletionTimeline({
    completedAtIso: "2026-12-01T10:00:00.000Z",
    nowIso: "2026-11-09T10:00:00.000Z"
  }).ok,
  false,
  "future completion must be rejected"
);
assert.match(
  policy.validateCompletionTimeline({ rawInput: "abc", completedAtIso: "" }).message,
  /格式无法识别/
);

const lateVsDue = policy.validateCompletionTimeline({
  completedAtIso: "2026-03-15T10:00:00.000Z",
  dueAtIso: "2025-12-01T10:00:00.000Z",
  nowIso: "2026-03-15T12:00:00.000Z"
});
assert.equal(lateVsDue.ok, true, "late completion beyond 60d is soft confirm, not hard block");
assert.match(String(lateVsDue.confirm || ""), /超过 60 天/);

const retroBackfill = policy.validateCompletionTimeline({
  completedAtIso: "2026-06-26T08:00:00.000Z",
  createdAtIso: "2026-11-09T10:00:00.000Z",
  dueAtIso: "2026-06-26T09:00:00.000Z",
  nowIso: "2026-11-09T12:00:00.000Z"
});
assert.equal(retroBackfill.ok, true, "retro entry may complete before record createdAt when due is earlier");
assert.match(String(retroBackfill.confirm || ""), /后补记录/);

assert.equal(
  policy.validateCompletionTimeline({
    completedAtIso: "2026-11-08T10:00:00.000Z",
    createdAtIso: "2026-11-09T10:00:00.000Z",
    dueAtIso: "2026-11-20T18:00:00.000Z",
    nowIso: "2026-11-09T12:00:00.000Z"
  }).ok,
  false,
  "same-day tasks still cannot complete before record time when due is still in the future"
);

console.log("schedule day policy tests passed");
