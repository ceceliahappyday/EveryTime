const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

assert.match(app, /function chooseFresherPlannerData/);
assert.match(app, /function unionPlannerRemovedTaskIds/);
assert.match(app, /getPlannerMeta\(chosen\)\.removedTaskIds = unionPlannerRemovedTaskIds/);
assert.match(app, /purgeRememberedRemovedTasks\(chosen\)/);
assert.doesNotMatch(
  app,
  /diskCount > localCount \|\| \(diskCount > 0 && diskCount === localCount\)/,
  "must not prefer the fatter store (resurrects merged tasks after updates)"
);
assert.match(
  app,
  /state\.data = chooseFresherPlannerData\(state\.data, persisted\);[\s\S]{0,120}localStorage\.setItem/,
  "startup must keep the chosen store + tombstones in localStorage"
);

function isPlannerDateKey(key) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(key || ""));
}

function getPlannerMeta(data = {}) {
  if (!data.__meta || typeof data.__meta !== "object" || Array.isArray(data.__meta)) {
    data.__meta = { savedAt: "", removedTaskIds: [] };
  }
  if (!Array.isArray(data.__meta.removedTaskIds)) data.__meta.removedTaskIds = [];
  return data.__meta;
}

function plannerSavedAtMs(data) {
  const ms = Date.parse(String(getPlannerMeta(data).savedAt || "").trim());
  return Number.isFinite(ms) ? ms : 0;
}

function countPlannerRecords(data) {
  return Object.entries(data || {}).reduce((sum, [dateKey, day]) => {
    if (!isPlannerDateKey(dateKey) || !day || typeof day !== "object") return sum;
    return sum + (day.tasks?.length || 0) + (day.entries?.length || 0) + (day.note ? 1 : 0);
  }, 0);
}

function unionPlannerRemovedTaskIds(...stores) {
  const set = new Set();
  stores.forEach(data => {
    (getPlannerMeta(data).removedTaskIds || []).forEach(id => {
      if (id) set.add(String(id));
    });
  });
  return [...set].slice(-800);
}

function purgeRememberedRemovedTasks(data) {
  const removed = new Set((getPlannerMeta(data).removedTaskIds || []).filter(Boolean));
  Object.entries(data || {}).forEach(([dateKey, day]) => {
    if (!isPlannerDateKey(dateKey) || !day || typeof day !== "object") return;
    day.tasks = (day.tasks || []).filter(task => !removed.has(task?.id));
  });
}

function chooseFresherPlannerData(localData, diskData) {
  const localMs = plannerSavedAtMs(localData);
  const diskMs = plannerSavedAtMs(diskData);
  let chosen;
  if (diskMs && localMs) chosen = diskMs >= localMs ? diskData : localData;
  else if (diskMs && !localMs) chosen = diskData;
  else if (localMs && !diskMs) chosen = localData;
  else {
    const localRemoved = (getPlannerMeta(localData).removedTaskIds || []).length;
    const diskRemoved = (getPlannerMeta(diskData).removedTaskIds || []).length;
    if (localRemoved !== diskRemoved) {
      chosen = localRemoved > diskRemoved ? localData : diskData;
    } else {
      const localCount = countPlannerRecords(localData);
      const diskCount = countPlannerRecords(diskData);
      if (localCount !== diskCount) chosen = localCount < diskCount ? localData : diskData;
      else chosen = diskCount > 0 ? diskData : localData;
    }
  }
  getPlannerMeta(chosen).removedTaskIds = unionPlannerRemovedTaskIds(localData, diskData, chosen);
  purgeRememberedRemovedTasks(chosen);
  return chosen;
}

const mergedLocal = {
  __meta: { savedAt: "", removedTaskIds: ["gone-1"] },
  "2026-11-16": {
    tasks: [{ id: "keep", title: "survivor" }],
    entries: [],
    note: ""
  }
};
const fatDisk = {
  __meta: { savedAt: "", removedTaskIds: [] },
  "2026-11-16": {
    tasks: [
      { id: "keep", title: "survivor" },
      { id: "gone-1", title: "should stay deleted" },
      { id: "gone-2", title: "extra old" }
    ],
    entries: [],
    note: ""
  }
};

const chosenNoStamp = chooseFresherPlannerData(
  JSON.parse(JSON.stringify(mergedLocal)),
  JSON.parse(JSON.stringify(fatDisk))
);
assert.equal(chosenNoStamp["2026-11-16"].tasks.length, 1);
assert.equal(chosenNoStamp["2026-11-16"].tasks[0].id, "keep");
assert.ok(chosenNoStamp.__meta.removedTaskIds.includes("gone-1"));

const newerFatDisk = {
  __meta: { savedAt: "2026-11-16T12:00:00.000Z", removedTaskIds: [] },
  "2026-11-16": {
    tasks: [
      { id: "keep", title: "survivor" },
      { id: "gone-1", title: "resurrected" }
    ],
    entries: [],
    note: ""
  }
};
const olderMergedLocal = {
  __meta: { savedAt: "2026-11-16T11:00:00.000Z", removedTaskIds: ["gone-1"] },
  "2026-11-16": {
    tasks: [{ id: "keep", title: "survivor" }],
    entries: [],
    note: ""
  }
};
const chosenStamp = chooseFresherPlannerData(
  JSON.parse(JSON.stringify(olderMergedLocal)),
  JSON.parse(JSON.stringify(newerFatDisk))
);
assert.equal(chosenStamp["2026-11-16"].tasks.map(t => t.id).join(","), "keep");
assert.ok(chosenStamp.__meta.removedTaskIds.includes("gone-1"));

console.log("planner store merge tests passed");
