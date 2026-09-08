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
assert.ok(html.includes("id=\"settingGlass\""));
assert.ok(!html.includes("id=\"glassToggleButton\""));
assert.ok(!html.includes("id=\"quickAddButton\""));
assert.ok(app.includes("toggleGlassMode"));
assert.ok(app.includes("updateGlassToggleChrome"));
assert.ok(!html.includes("id=\"previousWeek\""));
assert.ok(app.includes("bindWindowResize"));
assert.ok(app.includes("setWindowBounds"));
assert.match(
  app,
  /syncFocusSurfaceVisibility|schedule\.hidden/,
  "focus mode must hard-hide schedule so glass cannot ghost the calendar"
);
assert.match(
  app,
  /frameChromeX[\s\S]*shellLayoutDragWidth\s*=\s*Math\.max\(0,\s*width\s*-\s*frameChromeX\)/s,
  "live window drag must sync shell classes from estimated layout width"
);
assert.match(
  app,
  /onShellWidthChanged/,
  "renderer must listen for main-process content width during resize"
);
const main = fs.readFileSync(path.join(__dirname, "..", "main.js"), "utf8");
assert.match(
  main,
  /notifyShellLayoutWidth/,
  "main process must publish content width after setBounds/resize"
);
const preload = fs.readFileSync(path.join(__dirname, "..", "preload.js"), "utf8");
assert.match(
  preload,
  /onShellWidthChanged/,
  "preload must expose shell width change events"
);
assert.ok(app.includes('edge === "left"'));
assert.ok(app.includes('edge === "top"'));
assert.ok(html.includes('data-resize-edge="left"'));
assert.ok(html.includes('data-resize-edge="right"'));
assert.ok(html.includes('data-resize-edge="top"'));
assert.ok(html.includes('data-resize-edge="bottom"'));
assert.ok(html.includes('data-resize-edge="se"'));
assert.ok(html.includes('data-resize-edge="nw"'));
assert.ok(app.includes("shell-narrow"));
assert.ok(app.includes("shell-focus"));
assert.ok(app.includes("bindTaskPanelToggle"));
assert.ok(app.includes("window.innerWidth < 1180") || app.includes("width < 1180"));
assert.ok(app.includes("width < 960"));
assert.ok(app.includes("SHELL_FOCUS_MAX_WIDTH") || app.includes("width < 560"));
assert.ok(html.includes('id="maximizeWindow"'));
assert.ok(html.includes('id="focusViewButton"'));
assert.ok(app.includes("expandWindowForView"));
assert.ok(app.includes("bindFocusViewMenu"));
assert.ok(app.includes("toggleMaximize"));
assert.ok(app.includes("updateMaximizeChrome"));
assert.ok(html.includes('id="taskPanelToggle"'));
assert.ok(html.includes("shell-only-focus"));
assert.ok(html.includes('id="headerMoreButton"'));
assert.ok(app.includes("syncHeaderOverflow"));
assert.ok(app.includes("bindHeaderOverflow"));
assert.ok(html.includes('id="taskParentTrigger"'));
assert.ok(html.includes("搜索并选择上级任务"));
assert.ok(app.includes("bindTaskParentCombobox"));
assert.ok(app.includes("parentPickerSearchCandidates"));
assert.ok(app.includes("isHiddenRecurringCatalogInstance"));
assert.ok(app.includes("canonicalRecurringKeepIds"));
assert.match(html, /清单、搜索与挂接默认只保留这一条逻辑任务/);

console.log("navigation chrome tests passed");
