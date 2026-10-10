const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const policy = require("../task-category-policy.js");

const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

const memory = new Map();
const storage = {
  getItem: key => (memory.has(key) ? memory.get(key) : null),
  setItem: (key, value) => memory.set(key, String(value))
};

policy.resetCatalog(storage);
assert.equal(policy.DEFAULT_CATEGORY, "work");
assert.equal(policy.normalizeColor("sage"), "#638576");
assert.equal(policy.normalizeColor("#ed7d31"), "#ED7D31");
assert.equal(policy.colorForCategory("work"), "#638576");
assert.equal(policy.labelForCategory("meeting"), "会议");
assert.ok(policy.THEME_PALETTE?.length >= 6, "Excel theme palette rows");
assert.equal(policy.STANDARD_PALETTE?.length, 10, "Excel standard colors row");
assert.ok(policy.COLOR_PALETTE.length > 40, "palette offers many choices");

policy.upsertCategory({ id: "work", label: "交付", color: "#4472C4" });
assert.equal(policy.findCategory("work").label, "交付");
assert.equal(policy.colorForCategory("work"), "#4472C4");
assert.equal(policy.colorTokens("#4472C4").entry, "#4472C4");
assert.match(policy.colorTokens("#4472C4").entryBg, /^#[0-9A-F]{6}$/);
assert.match(policy.colorTokens("#4472C4", { glass: true }).entryBg, /^rgba\(/);
assert.match(
  styles,
  /body\.in-desktop\.glass-mode \.schedule-entry\s*\{[^}]*color-mix\(in srgb, var\(--entry/s,
  "glass day entries keep dark readable surfaces even if --entry-bg is stale"
);

policy.createCategory({ label: "客户A", color: "#C00000" });
const custom = policy.listCategories().find(item => item.label === "客户A");
assert.ok(custom, "custom category should be created");
assert.equal(custom.color, "#C00000");
assert.equal(policy.resolveEntryColor({}, { category: custom.id }), "#C00000");

policy.removeCategory(custom.id);
assert.equal(policy.findCategory(custom.id), null);
assert.ok(policy.findCategory("work"));

assert.match(html, /id="settingsCategoryList"/, "settings expose category color list");
assert.match(html, /Excel/, "hint mentions Excel palette");
assert.match(html, /id="addCategoryButton"/, "settings can add categories");
assert.match(html, /id="entryDialogScroll"/, "entry dialog body must scroll");
assert.ok((pkg.build?.files || []).includes("task-category-policy.js"));

assert.match(app, /openCategoryColorPalette/, "click swatch opens Excel palette");
assert.match(app, /settingsDialog \|\| document\.body/, "palette attaches inside settings dialog top layer");
assert.match(app, /THEME_PALETTE|STANDARD_PALETTE/, "palette uses Excel theme + standard colors");
assert.match(app, /applyCategoryColorStyle/, "schedule applies hex via CSS variables");
assert.match(app, /data-category-open-palette/, "one color circle opens palette");

assert.match(styles, /\.category-color-palette/, "palette popover styles");
assert.match(styles, /\.category-color-palette-cell/, "palette cell styles");
assert.match(styles, /\.settings-category-swatch/, "single category swatch");

console.log("task category policy tests passed");
