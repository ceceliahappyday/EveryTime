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
  /\.project-gantt-days\s*\{[^}]*width:\s*max-content[^}]*min-width:\s*100%/s,
  "gantt header should keep all date columns available inside the horizontal scroll area"
);
assert.match(
  styles,
  /\.gantt-lane-status\s*\{/s,
  "gantt status should remain visible even when there is no colored actual bar"
);
assert.match(
  styles,
  /body\.in-desktop\.glass-mode\s+\.app-shell|body\.in-desktop\s+\.app-shell/s,
  "desktop shell should be allowed to use the resized window width"
);

console.log("project style policy tests passed");
