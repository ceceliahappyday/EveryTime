const assert = require("assert");
const fs = require("fs");
const path = require("path");
const policy = require("../startup-policy.js");

assert.strictEqual(policy.canonicalName, "EveryTime");
assert.ok(Array.isArray(policy.aliases));
assert.strictEqual(policy.isOwnedCommand('"C:\\Users\\LS\\AppData\\Local\\Programs\\EveryTime\\EveryTime.exe" --hidden', 'C:\\Users\\LS\\AppData\\Local\\Programs\\EveryTime\\EveryTime.exe'), true);
assert.strictEqual(policy.isOwnedCommand('"D:\\OtherApp\\EveryTime.exe"', 'C:\\Users\\LS\\AppData\\Local\\Programs\\EveryTime\\EveryTime.exe'), false);
assert.strictEqual(policy.isOwnedCommand('"C:\\Users\\LS\\AppData\\Local\\Programs\\EveryTime\\other.exe"', 'C:\\Users\\LS\\AppData\\Local\\Programs\\EveryTime\\EveryTime.exe'), false);
const plan = policy.cleanupPlan([
  { name: "\u4eca\u65e5\u65e5\u7a0b", command: '"D:\\\u4eca\u65e5\u65e5\u7a0bAPP\\\u4eca\u65e5\u65e5\u7a0b.exe"' },
  { name: "Chrome", command: '"C:\\Program Files\\Chrome\\chrome.exe"' },
  { name: "EveryTime", command: '"C:\\OtherApp\\EveryTime.exe"' }
], 'C:\\Users\\LS\\AppData\\Local\\Programs\\EveryTime\\EveryTime.exe');
assert.deepStrictEqual(plan.map(item => item.name), ["\u4eca\u65e5\u65e5\u7a0b"]);

const mainSource = fs.readFileSync(path.join(__dirname, "..", "main.js"), "utf8");
assert.ok(mainSource.includes("app.requestSingleInstanceLock()"));
assert.ok(mainSource.includes("StartupPolicy.canonicalName"));
assert.ok(mainSource.includes("--skip-startup-registration"));
assert.ok(mainSource.includes("openAtLogin: !!openAtLogin"));
assert.ok(!fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8").includes("startup-policy.js"));
console.log("startup policy tests passed");
