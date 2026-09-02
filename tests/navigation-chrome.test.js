const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

assert.match(app, /function navigateCalendar\(/);
assert.match(app, /NavigationPolicy\.moveDateKey/);
assert.match(app, /updateDateNavigationChrome/);
assert.match(html, /id="dateNavPrev"/);
assert.match(html, /id="dateNavNext"/);
assert.ok(!html.includes("id=\"toggleCompact\""));
assert.ok(!html.includes("id=\"glassMode\""));
assert.ok(html.includes("id=\"glassToggleButton\""));
assert.ok(app.includes("toggleGlassMode"));
assert.ok(app.includes("updateGlassToggleChrome"));
assert.ok(!html.includes("id=\"previousWeek\""));
assert.ok(app.includes("bindWindowResize"));
assert.ok(app.includes("shell-narrow"));
assert.ok(app.includes("shell-focus"));
assert.ok(app.includes("bindTaskPanelToggle"));
assert.ok(app.includes("window.innerWidth < 1520") || app.includes("width < 1520"));
assert.ok(app.includes("width < 960"));
assert.ok(app.includes("width < 760"));
assert.ok(html.includes('data-resize-axis="both"'));
assert.ok(html.includes('data-resize-axis="x"'));
assert.ok(html.includes('id="taskPanelToggle"'));
assert.ok(html.includes("shell-hide-compact"));
assert.ok(html.includes('id="taskParentTrigger"'));
assert.ok(html.includes("搜索并选择上级任务"));
assert.ok(app.includes("bindTaskParentCombobox"));
assert.ok(app.includes("parentPickerSearchCandidates"));
assert.ok(app.includes("isHiddenRecurringCatalogInstance"));
assert.ok(app.includes("canonicalRecurringKeepIds"));
assert.match(html, /清单、搜索与挂接默认只保留这一条逻辑任务/);

console.log("navigation chrome tests passed");
