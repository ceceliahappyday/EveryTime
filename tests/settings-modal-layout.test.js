const assert = require("assert");
const fs = require("fs");

const html = fs.readFileSync("index.html", "utf8");
const styles = fs.readFileSync("styles.css", "utf8");
const workflow = fs.readFileSync(".github/workflows/release.yml", "utf8");

assert.match(
  html,
  /id="settingsDialog"[\s\S]*id="settingsDialogScroll"[\s\S]*id="checkUpdateButton"[\s\S]*class="modal-actions"/,
  "settings body must scroll while update/save actions stay outside the clipped area"
);
assert.match(
  styles,
  /\.settings-modal\[open\]\s*\{[^}]*display:\s*flex/s,
  "open settings dialog must use flex so the scroll region can shrink"
);
assert.doesNotMatch(
  styles,
  /\.settings-modal\s*\{[^}]*display:\s*flex/s,
  "closed settings dialog must keep UA display:none"
);
assert.match(
  workflow,
  /package\.json version[\s\S]*does not match tag/,
  "release workflow must refuse mismatched package/tag versions that poison latest.yml"
);
assert.match(
  workflow,
  /latest\.yml does not advertise version/,
  "release workflow must verify latest.yml before upload"
);

console.log("settings modal layout tests passed");
