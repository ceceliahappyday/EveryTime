const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

assert.match(
  app,
  /await loadDesktopProfileName\(\);\s*migrateData\(\);/s,
  "profile name must load before migrateData fills empty owners"
);
assert.match(
  app,
  /applyProfileName\(state\.profileName,\s*\{\s*migrateOwners:\s*true\s*\}\)/,
  "startup must rewrite legacy self owners"
);
assert.match(
  app,
  /persistedCount > 0 && persistedCount === localCount/,
  "equal-count desktop store must beat stale localStorage"
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
