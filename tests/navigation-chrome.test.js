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
assert.ok(!html.includes("id=\"previousWeek\""));
assert.ok(app.includes("bindWindowResize"));
assert.ok(app.includes("shell-narrow"));
assert.ok(html.includes('data-resize-axis="both"'));
assert.ok(html.includes('data-resize-axis="x"'));

console.log("navigation chrome tests passed");
