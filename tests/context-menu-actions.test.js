const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");

const ganttActions = [...app.matchAll(/data-gantt-action="([^"]+)"/g)].map(m => m[1]);
const listActions = [...app.matchAll(/data-list-action="([^"]+)"/g)].map(m => m[1]);
assert.ok(ganttActions.length, "gantt context menu should declare actions");
assert.ok(listActions.includes("edit") && listActions.includes("delete"), "meeting/entry menu needs edit+delete");

const handler = app.slice(
  app.indexOf('ganttContextMenuEl.addEventListener("click"'),
  app.indexOf("function hideGanttContextMenu")
);
for (const action of new Set(ganttActions)) {
  assert.match(
    handler,
    new RegExp(`action === "${action}"|dataset\\.ganttAction`),
    `gantt action "${action}" must be handled in the shared menu click path`
  );
  if (action !== "add-root" && action !== "merge-selection") {
    assert.match(handler, new RegExp(`action === "${action}"`), `missing handler for gantt action "${action}"`);
  }
}
assert.match(handler, /action === "add-root"/, "blank gantt menu add-root must be handled");
assert.match(handler, /action === "merge-selection"/, "merge-selection must be handled");
assert.match(handler, /action === "edit"/, "entry edit must be handled");
assert.match(handler, /confirmDeleteCalendarEntry/, "entry delete must be handled");
assert.match(
  handler,
  /action === "edit"[\s\S]*findEntry\(entryId\)[\s\S]*openEntryDialog/,
  "entry edit must fall back to findEntry when open callback is missing"
);

assert.match(
  app,
  /function deleteTaskById[\s\S]*?rememberRemovedTaskIds\([\s\S]*?isPlannerDateKey/,
  "task delete must tombstone ids and skip __meta when clearing entry links"
);
assert.match(
  app,
  /function findEntry[\s\S]*?isPlannerDateKey/,
  "findEntry must skip __meta / non-day keys"
);
assert.match(
  app,
  /labelRow\.addEventListener\("contextmenu", event => showGanttMeetingContextMenu[\s\S]*chartRow\.addEventListener\("contextmenu", event => showGanttMeetingContextMenu/,
  "gantt meeting label and chart rows must both open the meeting context menu"
);

const surfaces = [
  "bindCardContextMenu",
  "bindGanttRowContextMenu",
  "showGanttMeetingContextMenu",
  "showGanttBlankContextMenu",
  "showListItemContextMenu",
  "el.taskList.addEventListener(\"contextmenu\""
];
for (const token of surfaces) {
  assert.ok(app.includes(token), `missing right-click surface: ${token}`);
}

console.log("context menu actions tests passed");
