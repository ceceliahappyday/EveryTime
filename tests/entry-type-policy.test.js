const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

assert.match(html, /id="entryType"/, "entry dialog should expose an explicit schedule type");
assert.match(app, /entry\.entryType \|\|= entry\.taskId \? "task_work" : "calendar"/, "existing entries should migrate without losing records");
assert.match(app, /payload\.taskId = payload\.entryType === "task_work"/, "calendar entries should not be linked into the todo list");
assert.match(app, /entryType: "task_work", taskId: task\.id/, "dragging a task into the calendar should remain task work");
assert.doesNotMatch(app, /从日程自动补建，确保左侧待办状态与右侧日程一致/, "unlinked calendar events should not be silently promoted to todos");
assert.match(app, /state\.taskView === "day" && state\.filter === "in_progress"/, "day view should have a global ongoing-task pool");
assert.match(app, /isTodoListTask\(task\) && isOngoingTask\(task\)/, "unfinished work should remain draggable across dates until closed");
assert.match(app, /getTaskScheduleInfo\(task\.id\)\?\.hasStarted/, "a historical started worklog should keep the task discoverable");
assert.match(app, /monthCanonicalTasks = RecurringPolicy\.dedupeRecurringTasksForDisplay/, "month view should deduplicate recurring tasks across all dates");

console.log("entry type policy tests passed");
