const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

assert.match(app, /function renderUnifiedTodoList\(\)/, "the left panel should have one unified todo list");
assert.match(app, /function renderTasks\(\) \{\s*renderUnifiedTodoList\(\);\s*return;/s, "calendar and project views should not replace the todo list");
assert.match(app, /el\.taskViewTitle\.textContent = "待办清单"/, "the left panel should keep a stable todo title");
assert.match(app, /function matchesUnifiedTaskFilter\(task, filter\)/, "status filtering should happen inside the unified task list");

console.log("task view policy tests passed");
