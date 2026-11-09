const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

assert.match(
  app,
  /function backfillHistoricalTaskTimelines\(\)/,
  "migrate must backfill historical task timelines"
);
assert.match(
  app,
  /backfillHistoricalTaskTimelines\(\);\s*saveData\(\);/,
  "backfill must run at end of migrateData before persist"
);
assert.match(html, /task-timeline-backfill-policy\.js/, "index must load timeline backfill policy");

console.log("task timeline migration tests passed");
