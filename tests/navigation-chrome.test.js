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
assert.ok(app.includes("SHELL_FOCUS_MAX_WIDTH") || app.includes("width < 560") || app.includes("width < 680") || app.includes("width < 720"));
assert.ok(html.includes('id="maximizeWindow"'));
assert.ok(html.includes('id="focusViewButton"'));
assert.match(html, /id="focusViewButton"[^>]*>显示视图</, "default 视图 affordance label is 显示视图");
assert.match(
  app,
  /scheduleRevealed[\s\S]*隐藏视图[\s\S]*显示视图|隐藏视图[\s\S]*显示视图[\s\S]*scheduleRevealed/s,
  "视图 button label must flip between 显示视图 and 隐藏视图"
);
assert.ok(app.includes("expandWindowForView"));
assert.ok(app.includes("shrinkWindowToFocusShell"));
assert.ok(app.includes("revealScheduleSurface"));
assert.ok(app.includes("SCHEDULE_REVEALED_STORAGE_KEY"), "schedule reveal preference must persist across restarts");
assert.ok(app.includes("loadScheduleRevealedPreference"), "boot must restore schedule reveal preference");
assert.ok(app.includes("hideScheduleSurface"));
assert.ok(app.includes("maybeAutoHideScheduleForWidth"));
assert.ok(app.includes("scheduleRevealed"));
assert.ok(app.includes("FOCUS_SHELL_WIDTH"));
assert.match(app, /FOCUS_SHELL_WIDTH\s*=\s*300/, "focus shell width should follow 敬业签 narrow scale");
assert.match(app, /FOCUS_SHELL_MIN_WIDTH\s*=\s*280/, "user drag must be able to reach ~280px");
assert.ok(app.includes("bindFocusViewMenu"));
assert.ok(app.includes("toggleMaximize"));
assert.match(
  app,
  /scheduleRevealed[\s\S]*hideScheduleSurface|hideScheduleSurface[\s\S]*scheduleRevealed/s,
  "视图 must toggle schedule surface without requiring a full mode remount"
);
assert.match(
  app,
  /function hideScheduleSurface\(\)[\s\S]*taskView\s*=\s*"day"/s,
  "collapsing 视图 from gantt/week/month must reset to day so the todo panel is shown again"
);
assert.ok(app.includes("updateMaximizeChrome"));
assert.match(
  app,
  /function bindTopbarWindowChrome/,
  "topbar double-click must toggle adaptive / standard window size"
);
assert.match(
  app,
  /addEventListener\("dblclick"/,
  "topbar chrome must listen for double-click maximize"
);
assert.match(
  main,
  /function standardWindowBounds|STANDARD_WINDOW_WIDTH\s*=\s*1380/,
  "restore size must use the standard 1380x900 window"
);
assert.ok(html.includes('id="taskPanelToggle"'));
assert.ok(html.includes("shell-only-focus"));
assert.ok(html.includes('id="headerMoreButton"'));
assert.ok(html.includes('id="headerChromeMenu"'));
assert.ok(html.includes('data-chrome-action="minimize"'));
assert.match(
  html,
  /data-chrome-action="minimize"[^>]*>[\s\S]*?<svg[\s\S]*?viewBox="0 0 16 16"/,
  "minimize must use a fixed-size SVG icon, not an em-dash glyph"
);
assert.match(
  html,
  /class="menu-ico"/,
  "overflow menu icons should share the menu-ico sizing class"
);
assert.equal(
  (html.match(/id="headerChromeMenu"[\s\S]*?id="headerMoreMenu"|id="headerChromeMenu"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/) || [""])[0]
    .match(/viewBox="0 0 16 16"/g)?.length || 0,
  6,
  "chrome menu actions should all use the same 16×16 icon viewport (view+settings+min+max+restore+close)"
);
assert.ok(app.includes("syncHeaderOverflow"));
assert.ok(app.includes("syncHeaderChromeCollapse"));
assert.ok(app.includes("header-chrome-collapsed"));
assert.ok(app.includes("bindHeaderOverflow"));
const styles = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");
assert.match(
  styles,
  /\.header-more-menu \.header-tools \.soft-button[\s\S]*?border:\s*0\s*!important/s,
  "overflow tray tool rows must be flat list items, not boxed soft-buttons"
);
assert.match(
  styles,
  /--header-menu-icon:\s*20px/,
  "overflow tray must use one shared icon column size"
);
assert.ok(html.includes('id="taskParentTrigger"'));
assert.ok(html.includes("搜索并选择上级任务"));
assert.ok(app.includes("bindTaskParentCombobox"));
assert.ok(app.includes("parentPickerSearchCandidates"));
assert.ok(app.includes("isHiddenRecurringCatalogInstance"));
assert.ok(app.includes("canonicalRecurringKeepIds"));
assert.match(html, /清单、搜索与挂接默认只保留这一条逻辑任务/);

console.log("navigation chrome tests passed");
