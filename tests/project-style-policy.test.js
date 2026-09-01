const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const styles = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");

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
  /body\.in-desktop \.app-shell\s*\{[^}]*width:\s*100%/s,
  "desktop shell should fill the native window"
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
  /body\.in-desktop \.header-actions > \.soft-button[^}]*font-size:\s*12px/s,
  "desktop header buttons should keep readable labels when the window is narrow"
);

console.log("project style policy tests passed");
