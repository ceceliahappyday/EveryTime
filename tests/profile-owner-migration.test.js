const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

assert.match(
  app,
  /await loadDesktopProfileName\(\);[\s\S]*?migrateData\(\);/,
  "profile name must load before migrateData fills empty owners"
);
assert.match(
  app,
  /applyProfileName\(state\.profileName,\s*\{\s*migrateOwners:\s*true\s*\}\)/,
  "startup must rewrite legacy self owners"
);
assert.match(
  app,
  /function chooseFresherPlannerData/,
  "desktop store must reconcile with localStorage through chooseFresherPlannerData"
);
assert.match(
  app,
  /localCount < diskCount \? localData : diskData/,
  "when stamps are missing, prefer the smaller store so merges are not resurrected"
);
assert.match(
  app,
  /unionPlannerRemovedTaskIds/,
  "startup must union delete tombstones across local and disk stores"
);
assert.match(app, /function isLegacySelfOwner/);
assert.match(
  app,
  /migrateOwners:\s*true[\s\S]*saveDesktopSettings|saveDesktopSettings[\s\S]*migrateOwners:\s*true/,
  "saving settings must migrate legacy owners"
);
assert.doesNotMatch(
  html,
  /用作新建任务的默认责任人/,
  "settings must not imply only new tasks get the profile name"
);

console.log("profile owner migration tests passed");
