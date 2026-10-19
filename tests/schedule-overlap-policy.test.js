const assert = require("assert");
const fs = require("fs");
const policy = require("../schedule-overlap-policy.js");

const solo = policy.layoutEntries([{ id: "a", start: 9, end: 10, title: "单独" }]);
assert.strictEqual(solo.length, 1);
assert.strictEqual(solo[0].columns, 1);
assert.strictEqual(solo[0].column, 0);

const parallel = policy.layoutEntries([
  { id: "a", start: 9, end: 11, title: "甲任务", owner: "甲" },
  { id: "b", start: 9, end: 11, title: "乙任务", owner: "乙" }
], {
  compare: (left, right) => String(left.owner || "").localeCompare(String(right.owner || ""))
});
assert.strictEqual(parallel.length, 2);
assert.strictEqual(parallel[0].columns, 2);
assert.strictEqual(parallel[1].columns, 2);
assert.notStrictEqual(parallel[0].column, parallel[1].column, "parallel blocks must sit in different columns");
assert.deepStrictEqual(
  parallel.map(item => item.entry.id).sort(),
  ["a", "b"]
);

const staggered = policy.layoutEntries([
  { id: "long", start: 9, end: 12, title: "长" },
  { id: "early", start: 9, end: 10, title: "早" },
  { id: "late", start: 10, end: 11, title: "晚" }
]);
assert.strictEqual(staggered.find(item => item.entry.id === "long").columns, 2);
assert.strictEqual(staggered.find(item => item.entry.id === "early").column, 0);
assert.strictEqual(staggered.find(item => item.entry.id === "long").column, 1);
assert.strictEqual(
  staggered.find(item => item.entry.id === "late").column,
  0,
  "late block reuses the lane freed when early ends"
);

const separate = policy.layoutEntries([
  { id: "morning", start: 9, end: 10, title: "上午" },
  { id: "afternoon", start: 14, end: 15, title: "下午" }
]);
assert.ok(separate.every(item => item.columns === 1), "non-overlapping clusters stay full width");

const app = fs.readFileSync("app.js", "utf8");
const styles = fs.readFileSync("styles.css", "utf8");
const html = fs.readFileSync("index.html", "utf8");
assert.match(html, /schedule-overlap-policy\.js/, "day timeline must load overlap layout policy");
assert.match(app, /ScheduleOverlapPolicy\.layoutEntries/, "day render must use side-by-side overlap packing");
assert.match(app, /--overlap-cols/, "overlap columns must be applied as CSS variables");
assert.match(
  styles,
  /\.schedule-entry\.is-overlap\s*\{[^}]*width:\s*calc\(\(100%\s*-\s*var\(--entry-left\)\)\s*\/\s*var\(--overlap-cols\)/s,
  "overlap CSS must shrink width per column instead of full-bleed stacking"
);
assert.doesNotMatch(
  styles,
  /Fantastical\s*\/\s*Apple Calendar：重叠全宽叠放/,
  "full-bleed Fantastical stacking comment must be retired"
);

console.log("schedule overlap policy tests passed");
