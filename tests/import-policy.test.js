const assert = require("assert");
const fs = require("fs");
const path = require("path");
const ImportPolicy = require("../import-policy.js");

const dayData = {
  "2026-10-03": {
    tasks: [{ id: "t1", title: "写计划", dueDate: "2026-10-03", status: "planned" }],
    entries: [{ id: "e1", title: "会议", start: 9, end: 10, entryType: "calendar" }],
    note: "备注"
  }
};

assert.strictEqual(ImportPolicy.countPlannerRecords(dayData), 3);
assert.strictEqual(ImportPolicy.isDayKeyedPlannerData(dayData), true);
assert.strictEqual(ImportPolicy.isDayKeyedPlannerData({ bad: { tasks: "x" } }), false);

const backup = {
  format: "today-planner-backup",
  version: 1,
  exportedAt: "2026-10-03T08:00:00.000Z",
  recordCount: 3,
  data: dayData
};
const fromBackup = ImportPolicy.parseImportPayload(JSON.stringify(backup));
assert.strictEqual(fromBackup.ok, true);
assert.deepStrictEqual(fromBackup.data, dayData);
assert.strictEqual(fromBackup.recordCount, 3);

const exportPayload = {
  format: "today-planner-export",
  version: 1,
  exportedAt: "2026-10-03T08:00:00.000Z",
  tasks: [{
    id: "t1",
    title: "写计划",
    planDate: "2026-10-03",
    dueDate: "2026-10-03",
    status: "planned"
  }],
  schedules: [{
    id: "e1",
    date: "2026-10-03",
    title: "会议",
    start: 9,
    end: 10,
    entryType: "calendar"
  }],
  notes: [{ date: "2026-10-03", note: "备注" }]
};
const fromExport = ImportPolicy.parseImportPayload(exportPayload);
assert.strictEqual(fromExport.ok, true);
assert.strictEqual(fromExport.data["2026-10-03"].tasks[0].title, "写计划");
assert.strictEqual(fromExport.data["2026-10-03"].entries[0].title, "会议");
assert.strictEqual(fromExport.data["2026-10-03"].note, "备注");
assert.strictEqual(fromExport.recordCount, 3);

const fromRaw = ImportPolicy.parseImportPayload(dayData);
assert.strictEqual(fromRaw.ok, true);
assert.deepStrictEqual(fromRaw.data, dayData);

const invalid = ImportPolicy.parseImportPayload("{not-json");
assert.strictEqual(invalid.ok, false);

const mainSource = fs.readFileSync(path.join(__dirname, "..", "main.js"), "utf8").replace(/\r\n/g, "\n");
assert.ok(mainSource.includes('ipcMain.handle("data:import"'));
assert.ok(mainSource.includes("writePlannerBackup"));
assert.ok(mainSource.includes("ImportPolicy.parseImportPayload"));
assert.ok(!mainSource.includes("cloud:login"));
assert.ok(!mainSource.includes("CloudSync"));

const preload = fs.readFileSync(path.join(__dirname, "..", "preload.js"), "utf8");
assert.ok(preload.includes("importData"));
assert.ok(!preload.includes("cloudLogin"));

const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8").replace(/\r\n/g, "\n");
assert.ok(app.includes("today-planner-backup"));
assert.ok(app.includes("async function importAllData"));
assert.ok(app.includes("importButton"));
assert.ok(!app.includes("cloudLogin"));

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
assert.ok(html.includes('id="importButton"'));
assert.ok(html.includes("import-policy.js"));
assert.ok(!html.includes("cloudSyncPanel"));

console.log("import policy tests passed");
