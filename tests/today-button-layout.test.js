const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const styles = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

assert.match(html, /id="todayButton"[^>]*>回到今天</);
assert.match(app, /goToTodayDayView/, "today button must switch project gantt back to day view");
assert.match(app, /el\.todayButton\.addEventListener\("click",\s*\(\)\s*=>\s*goToTodayDayView\(\)/);
assert.match(
  styles,
  /#todayButton\s*\{[^}]*white-space:\s*nowrap/s,
  "today button text must stay on one line"
);
assert.match(
  styles,
  /#todayButton\s*\{[^}]*min-width:\s*max-content/s,
  "today button must not shrink below its label width"
);
assert.match(
  styles,
  /\.soft-button\s*\{[^}]*white-space:\s*nowrap/s,
  "soft buttons should not wrap label characters vertically"
);
assert.match(
  styles,
  /\.date-controls\s*>\s*\*\s*\{[^}]*flex:\s*0\s+0\s+auto/s,
  "date-control children must not flex-shrink into a vertical stack"
);
assert.match(
  styles,
  /body\.in-desktop\.shell-narrow #todayButton\s*\{[^}]*min-width:\s*max-content/s,
  "narrow shell must keep today button readable and clickable"
);
assert.doesNotMatch(
  styles,
  /body\.in-desktop\.shell-narrow #todayButton\s*\{[^}]*min-width:\s*0/s,
  "narrow shell must not force today button width to zero"
);
assert.match(
  styles,
  /body\.in-desktop \.topbar\s*\{[^}]*display:\s*grid/s,
  "desktop topbar should use a grid row with a fixed trailing window-controls track"
);
assert.match(
  styles,
  /body\.in-desktop \.topbar\s*\{[^}]*grid-template-columns:\s*auto\s+auto\s+auto\s+minmax\(0,\s*1fr\)\s+max-content/s,
  "window controls must occupy a dedicated max-content column after brand/date/view/actions"
);
assert.match(
  styles,
  /body\.in-desktop \.topbar-main\s*\{[^}]*justify-content:\s*flex-start/s,
  "topbar date region should keep date controls left-aligned"
);
assert.match(
  styles,
  /body\.in-desktop \.header-view-switcher\s*\{[^}]*grid-column:\s*3/s,
  "view switcher must sit in its own topbar column so tools cannot overlap it"
);
assert.match(
  app,
  /function syncHeaderOverflow\(/,
  "secondary header tools should move into an overflow menu when narrow"
);
assert.ok(html.includes('id="headerMoreButton"'));
assert.ok(html.includes('id="headerTools"'));
assert.ok(html.includes('id="viewSwitcher"'));
assert.ok(!html.includes("shell-hide-compact"));
assert.match(
  styles,
  /body\.in-desktop \.window-controls\s*\{[^}]*flex-direction:\s*row/s,
  "window controls must stay horizontal"
);
assert.match(
  styles,
  /body\.in-desktop \.window-controls\s*\{[^}]*min-width:\s*max-content/s,
  "window controls must not shrink into a vertical strip"
);
assert.match(
  styles,
  /body\.in-desktop \.header-view-switcher\s*\{[^}]*min-width:\s*max-content/s,
  "view switcher must keep its intrinsic width"
);
assert.match(
  styles,
  /\.topbar\s*\{\s*-webkit-app-region:\s*drag/s,
  "topbar must remain the desktop window drag surface"
);
assert.doesNotMatch(
  styles,
  /\.topbar \.date-controls,\s*\.topbar \.header-actions|\.topbar button,[^}]*\.topbar \.header-actions/s,
  "only interactive controls should disable drag, not entire header clusters"
);
assert.match(
  styles,
  /body\.in-desktop \.header-actions\s*\{[^}]*justify-content:\s*flex-end/s,
  "header actions should pack toward window controls without overflowing them"
);

console.log("today button layout tests passed");
