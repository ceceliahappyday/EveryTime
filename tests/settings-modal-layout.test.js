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
const main = fs.readFileSync("main.js", "utf8");
assert.match(
  main,
  /getLoginItemSettings\(\{\s*name:\s*StartupPolicy\.canonicalName\s*\}\)/,
  "Windows login items must query the DailyPlanner registry key"
);
assert.match(main, /keepCanonical:\s*enable/, "enabling startup must not delete the canonical Run entry before re-registering");
assert.match(main, /ensureStartupApproved/, "Windows startup must mark StartupApproved as enabled");
assert.match(main, /startAtLoginApplied/, "settings API must report whether the Run key was actually written");
assert.match(main, /ensureRunKeyRegistration\(StartupPolicy\.canonicalName,\s*exePath\)/, "enabling startup always force-writes a quoted Run value");
assert.match(main, /menu:popup/, "renderer can open a native context menu through IPC");
assert.match(main, /canManageStartupRegistration|!isDevRuntime/, "dev preview must not mutate the installed DailyPlanner Run key");
assert.match(main, /registeredStartupBelongsToThisExe/, "disabling startup only removes this install's Run value");
assert.match(main, /Set-ItemProperty/, "startup Run writes prefer PowerShell Set-ItemProperty");
assert.match(main, /CurrentVersion\\\\Run/, "startup Run PowerShell path targets HKCU Run");
assert.match(main, /importUtf16RegFile/, "Windows startup registration keeps UTF-16 .reg fallback for Unicode exe paths");
assert.match(main, /WriteAllText\(/, "startup Run value reads must avoid console code-page mojibake");
assert.match(
  fs.readFileSync("app.js", "utf8"),
  /startAtLoginApplied/,
  "settings toast must distinguish saved intent from registry application"
);
assert.match(
  fs.readFileSync("app.js", "utf8"),
  /开发预览不会改系统启动项/,
  "dev preview explains that autostart belongs to the installed build"
);

console.log("settings modal layout tests passed");
