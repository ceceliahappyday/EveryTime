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
  styles,
  /\.settings-main-footer\s*>\s*button\s*\{[^}]*white-space:\s*nowrap/s,
  "settings footer actions must not wrap character-by-character when squeezed"
);
const app = fs.readFileSync("app.js", "utf8");
assert.match(
  app,
  /SETTINGS_HOST_MIN_WIDTH\s*=\s*860/,
  "settings must expand the host window to a comfortable width"
);
assert.match(
  app,
  /function ensureSettingsHostSize[\s\S]*setWindowBounds[\s\S]*function restoreSettingsHostSize/,
  "narrow shells must temporarily grow for settings, then restore on close"
);
assert.match(
  app,
  /ensureSettingsHostSize\(\);\s*\n\s*el\.settingsDialog\.showModal\(\)/,
  "settings open must expand the host before showing the dialog"
);
assert.match(
  app,
  /settingsDialog\?\.addEventListener\("close"[\s\S]*restoreSettingsHostSize\(\)/,
  "closing settings must restore the previous shell size"
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
assert.match(
  html,
  /id="updateProgress"[^>]*popover="manual"/,
  "update progress must use popover so it stays above open dialogs"
);
assert.match(
  styles,
  /\.update-progress\s*\{[^}]*z-index:\s*2147483646/s,
  "update progress needs a top-layer-friendly z-index fallback"
);
assert.ok(
  fs.readFileSync("app.js", "utf8").includes("showUpdateProgressBanner"),
  "update progress must call showPopover when visible"
);

console.log("settings modal layout tests passed");
