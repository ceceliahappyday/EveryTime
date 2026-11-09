const assert = require("node:assert/strict");
const policy = require("../task-actual-start-policy.js");

assert.equal(
  policy.resolveActualStartIso({ startOverrideAt: "2026-01-01T08:00:00.000Z" }, { firstInvestIso: "2026-02-01T08:00:00.000Z" }),
  "2026-01-01T08:00:00.000Z"
);
assert.equal(
  policy.resolveActualStartIso({ startedAt: "2026-03-01T08:00:00.000Z" }, { firstInvestIso: "2026-02-01T08:00:00.000Z" }),
  "2026-02-01T08:00:00.000Z",
  "first invest beats legacy startedAt when no override"
);

console.log("task actual start policy tests passed");
