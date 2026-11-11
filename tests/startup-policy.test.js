const assert = require("node:assert/strict");
const policy = require("../startup-policy.js");

assert.strictEqual(policy.canonicalName, "DailyPlanner");
assert.ok(policy.aliases.includes("EveryTime"), "legacy EveryTime startup alias remains");
assert.strictEqual(
  policy.isOwnedCommand(
    '"C:\\Users\\LS\\AppData\\Local\\Programs\\EveryTime\\EveryTime.exe" --hidden',
    "C:\\Users\\LS\\AppData\\Local\\Programs\\EveryTime\\EveryTime.exe"
  ),
  true
);
assert.strictEqual(
  policy.isOwnedCommand(
    '"C:\\Users\\LS\\AppData\\Local\\Programs\\DailyPlanner\\今日日程.exe" --hidden',
    "C:\\Users\\LS\\AppData\\Local\\Programs\\DailyPlanner\\今日日程.exe"
  ),
  true
);
assert.strictEqual(
  policy.isOwnedCommand(
    "D:\\Program Files\\today-daily-planner\\今日日程.exe",
    "D:\\Program Files\\today-daily-planner\\今日日程.exe"
  ),
  true,
  "unquoted Program Files paths with spaces must still count as owned"
);
assert.strictEqual(
  policy.quoteCommand("D:\\Program Files\\today-daily-planner\\今日日程.exe"),
  '"D:\\Program Files\\today-daily-planner\\今日日程.exe"'
);
assert.strictEqual(
  policy.isOwnedCommand('"D:\\OtherApp\\EveryTime.exe"', "C:\\Users\\LS\\AppData\\Local\\Programs\\EveryTime\\EveryTime.exe"),
  false
);
assert.strictEqual(
  policy.isOwnedCommand('"C:\\Users\\LS\\AppData\\Local\\Programs\\EveryTime\\other.exe"', "C:\\Users\\LS\\AppData\\Local\\Programs\\EveryTime\\EveryTime.exe"),
  false
);
assert.deepEqual(
  policy.cleanupPlan([
    { name: "EveryTime", command: '"C:\\OtherApp\\EveryTime.exe"' }
  ], "C:\\Users\\LS\\AppData\\Local\\Programs\\EveryTime\\EveryTime.exe"),
  []
);

console.log("startup policy tests passed");
