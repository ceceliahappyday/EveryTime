const assert = require("assert");
const fs = require("fs");
const path = require("path");

global.TaskOptionPolicy = {
  taskHierarchyPath: ({ task, separator }) => ["父级", task.title].join(separator)
};
const policy = require("../week-entry-policy.js");
const entries = [
  { id: "pm", start: 13, end: 14.5, taskId: "leaf", note: "下午继续修改" },
  { id: "am", start: 9, end: 10, taskId: "leaf", note: "上午完成初稿" }
];
assert.deepStrictEqual(policy.sortEntries(entries).map(entry => entry.id), ["am", "pm"]);
assert.strictEqual(policy.entryTitle(entries[0], { title: "会议纪要修改" }), "会议纪要修改");
assert.strictEqual(policy.entryTitle({ title: "独立投入" }, null), "独立投入");
assert.strictEqual(policy.parentPath({ title: "会议纪要修改" }, [], " › "), "父级");
assert.strictEqual(policy.durationHours(entries[0]), 1.5);
assert.strictEqual(policy.durationHours({ start: 10, end: 10 }), 0);

const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
assert.ok(app.includes("renderWeekTaskWorkList(dayEntries, key)"));
assert.ok(app.includes('dataTransfer.setData("text/entry-id", item.dataset.entryId)'));
assert.ok(app.includes("openEntryDialog(found.entry.start, found.entry)"));
assert.ok(app.includes("WeekEntryPolicy.entryTitle(entry, task)"));
console.log("week entry policy tests passed");
