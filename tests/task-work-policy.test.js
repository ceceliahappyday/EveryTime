const assert = require("assert");
require("../task-work-policy.js");
const policy = global.TaskWorkPolicy;
const now = new Date(2026, 7, 10, 15, 0, 0);

assert.deepStrictEqual(policy.copyPlacement({ start: 12, end: 13 }, 14), { start: 14, end: 15 });
assert.deepStrictEqual(policy.copyPlacement({ start: 12, end: 14 }, 21), { start: 21, end: 22 });
assert.strictEqual(policy.copyPlacement({ start: 12, end: 12 }, 14), null);
assert.strictEqual(policy.copyPlacement({ start: 12, end: 13 }, 22), null);
assert.strictEqual(policy.statusForEntries([{ dateKey: "2026-08-10", start: 14 }], now), "in_progress");
assert.strictEqual(policy.statusForEntries([{ dateKey: "2026-08-10", start: 16 }], now), "planned");
assert.strictEqual(policy.statusForEntries([
  { dateKey: "2026-08-10", start: 16 },
  { dateKey: "2026-08-10", start: 9 }
], now), "in_progress");
console.log("task work behavior tests passed");
