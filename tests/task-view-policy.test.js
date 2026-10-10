const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const styles = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");

assert.match(app, /function renderUnifiedTodoList\(\)/, "the left panel should have one unified todo list");
assert.match(app, /function renderTasks\(\) \{\s*renderUnifiedTodoList\(\);\s*return;/s, "calendar and project views should not replace the todo list");
assert.match(app, /function applyListKind/, "todo and meeting lists should switch via list-kind controls");
assert.match(app, /function syncListKindSwitch/, "list-kind switch state should stay in sync with the active filter");
assert.match(app, /function applyMeetingFilter/, "meeting list should support status filters");
assert.match(app, /function getMeetingPhase/, "meetings should classify as planned/in_progress/ended");
assert.match(html, /data-list-kind="todo"/, "todo list should be a clickable list-kind title");
assert.match(html, /data-list-kind="meeting"/, "meeting list should sit parallel to the todo title");
assert.match(html, /id="listKindMenu"/, "narrow panels should offer a list-kind dropdown");
assert.match(app, /useKindSelect/, "minimum column width should switch titles to a dropdown menu");
assert.match(app, /LIST_KIND_DROPDOWN_MAX_WIDTH/, "dropdown should stay until dual titles fit beside search");
assert.match(app, /taskPanelScaleProgress/, "title and 新增事项 chrome should scale with panel width");
assert.match(app, /--task-add-font-size/, "新增事项 font should track the same scale as list titles");
assert.match(app, /function openListKindMenu/, "list-kind dropdown should open a custom menu");
assert.match(app, /document\.body\.appendChild\(el\.listKindMenuPanel\)/, "list-kind menu must escape task-panel overflow clipping");
assert.doesNotMatch(app, /shortInline/, "mid-width panels should keep full 待办清单/会议清单 labels");
assert.doesNotMatch(html, /<select[^>]*id="listKindSelect"/, "native select must not paint OS dropdown colors");
assert.match(
  app,
  /const plannedDisabled = currentStatus === "planned" \? "" : " disabled"/,
  "current automatic status must remain selectable so the browser does not fall through to done"
);
assert.match(
  app,
  /const progressDisabled = currentStatus === "in_progress" \? "" : " disabled"/,
  "in-progress tasks from past schedule entries must keep their automatic status visible"
);
assert.match(html, /data-meeting-filter="all"/, "meeting list should expose an all-meetings tab");
assert.match(html, /placeholder="新增"/, "heading quick-add should use a short 新增 placeholder");
assert.match(html, /placeholder="搜索\.\.\.\/@负责人"/, "toolbar search should hint @负责人 filtering");
assert.match(styles, /\.task-side-control/, "search and continue-yesterday should share side-control styles");
assert.match(app, /function matchesUnifiedTaskFilter\(task, filter\)/, "status filtering should happen inside the unified task list");

console.log("task view policy tests passed");
