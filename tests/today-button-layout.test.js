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
  /body\.in-desktop \.topbar\s*\{[^}]*display:\s*flex/s,
  "desktop topbar should use a flex row without trailing whitespace"
);
assert.match(
  styles,
  /body\.in-desktop \.topbar-main\s*\{[^}]*justify-content:\s*space-between/s,
  "topbar controls should balance date and actions without overflowing window controls"
);
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
  /body\.in-desktop \.date-controls\s*\{[^}]*min-width:\s*max-content/s,
  "desktop date controls must keep intrinsic width"
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
