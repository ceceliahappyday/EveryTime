const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const styles = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

assert.match(
  styles,
  /\.task-list\.project-view\s+\.task-group-heading\s*\{[^}]*position:\s*static/s,
  "project status headings should scroll with the project list instead of sticking over cards"
);

assert.match(
  styles,
  /\.project-gantt\s*\{[^}]*width:\s*100%[^}]*min-width:\s*0/s,
  "gantt container should stay inside the visible panel instead of expanding to content width"
);
assert.doesNotMatch(
  styles,
  /\.project-gantt\s*\{[^}]*width:\s*max-content/s,
  "gantt should not create an oversized draggable horizontal surface"
);

assert.match(
  styles,
  /\.project-gantt-days\s*\{[^}]*position:\s*sticky/s,
  "gantt date header should stay visible while task rows scroll vertically"
);
assert.match(
  styles,
  /\.project-gantt-chrome\s*\{[^}]*flex:\s*0\s*0\s*auto/s,
  "gantt toolbar and legend should stay fixed above the scrolling chart area"
);
assert.match(
  styles,
  /\.project-gantt-hscroll\s*\{[^}]*overflow-x:\s*auto/s,
  "gantt horizontal scrollbar should stay fixed at the bottom of the chart area"
);
assert.match(
  styles,
  /\.timeline-wrap:has\(\.project-gantt\)\s*\{[^}]*overflow-x:\s*hidden/s,
  "project timeline wrapper should not horizontally scroll the toolbar away"
);
assert.match(
  styles,
  /\.project-gantt-split\s*\{[^}]*display:\s*flex/s,
  "gantt should use a fixed label pane beside the scrolling chart"
);
assert.match(
  styles,
  /\.project-gantt-label-pane\s*\{[^}]*flex:\s*0\s*0\s*var\(--gantt-label-width/s,
  "task titles should stay in a fixed left column while dates scroll"
);
assert.match(
  styles,
  /\.project-gantt-title strong\s*\{[^}]*text-overflow:\s*ellipsis/s,
  "gantt titles should truncate inside the fixed label column"
);
assert.match(
  styles,
  /\.gantt-progress-pct\s*\{/s,
  "task progress should render on the gantt bar instead of under the title"
);
assert.match(
  styles,
  /body\.in-desktop\.glass-mode\s+\.app-shell|body\.in-desktop\s+\.app-shell/s,
  "desktop shell should be allowed to use the resized window width"
);
assert.match(
  styles,
  /body\.in-desktop\s+\.topbar\s*\{/s,
  "desktop topbar should use a compact responsive grid inside a resized window"
);
assert.match(
  styles,
  /body\.in-desktop\s+\.header-actions\s+\.primary-button\s*\{[^}]*min-width:/s,
  "desktop quick-add button should remain fully visible"
);

assert.match(
  styles,
  /body\.in-desktop \.app-shell\s*\{[^}]*margin:\s*0/s,
  "desktop shell should be full-bleed without outer margin"
);
assert.match(
  styles,
  /body\.in-desktop \.app-shell\s*\{[^}]*border:\s*0/s,
  "desktop shell should not show a visible window border"
);
assert.match(
  styles,
  /body\.in-desktop \.app-shell\s*\{[^}]*border-radius:\s*16px/s,
  "desktop shell should keep soft rounded corners"
);
assert.match(
  styles,
  /\.resize-edge-right/s,
  "resize edges should attach to the app shell border"
);
assert.doesNotMatch(
  styles,
  /\.app-shell\s*\{[^}]*zoom:/s,
  "app shell should not use css zoom, which breaks resize hit targets"
);
assert.match(
  styles,
  /body\.in-desktop \.header-actions\s*\{[^}]*flex-wrap:\s*nowrap/s,
  "desktop header should stay on one row"
);
assert.match(
  styles,
  /body\.in-desktop\.shell-compact-topbar \.shell-hide-compact\s*\{[^}]*display:\s*none/s,
  "compact windows should hide secondary header tools instead of wrapping"
);
assert.match(
  styles,
  /body\.in-desktop\.shell-focus:not\(\.task-panel-open\) \.task-panel\s*\{[^}]*display:\s*none/s,
  "focus windows should hide the task module until toggled"
);
assert.match(
  styles,
  /body\.in-desktop\.shell-focus \.workspace\s*\{[^}]*grid-template-rows:\s*minmax\(0,\s*1fr\)/s,
  "focus schedule-only layout should fill the full workspace height"
);
assert.match(
  styles,
  /\.date-picker-button\s*\{[^}]*height:\s*40px/s,
  "date picker should share the same control height as other topbar buttons"
);
assert.match(
  styles,
  /\.soft-button\s*\{[^}]*height:\s*40px/s,
  "soft buttons should use a fixed topbar control height"
);
assert.match(
  styles,
  /\.header-view-switcher\s*\{[^}]*height:\s*40px/s,
  "view switcher should match the shared topbar control height"
);
assert.match(
  styles,
  /body\.in-desktop\.glass-mode \.date-picker-button(?:\s*,[^,{]*)*\{[^}]*color:\s*#f4fbff/s,
  "glass mode date picker text should stay light on dark frosted controls"
);
assert.match(
  styles,
  /\.date-picker-button\s*\{[^}]*color:\s*var\(--ink\)/s,
  "date picker should use ink color so glass mode can flip to light text"
);
assert.match(
  styles,
  /\.day-button\s*\{[^}]*color:\s*var\(--ink\)/s,
  "week-strip day buttons should use ink color so glass mode can flip to light text"
);
assert.match(
  styles,
  /body\.in-desktop\.glass-mode \.day-button(?:\s*,[^,{]*)*\{[^}]*color:\s*#f4fbff/s,
  "glass mode week-strip day labels must stay light on frosted surfaces"
);
assert.match(
  styles,
  /body\.week-mode \.week-strip/s,
  "week calendar should hide the day-selection strip like month view"
);
assert.match(
  html,
  /id="settingWorkStartHour"/,
  "settings should expose work-hour start control"
);
assert.match(
  app,
  /ScheduleHoursPolicy\.visibleTimelineHours/,
  "day timeline should respect configured work hours"
);

console.log("project style policy tests passed");
