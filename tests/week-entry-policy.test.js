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
const formatTime = value => {
  const hour = Math.floor(value);
  const minute = Math.round((value - hour) * 60);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};
assert.strictEqual(
  policy.formatScheduleTimeRange({ start: 9, end: 10.5 }, formatTime),
  "09:00-10:30"
);
assert.strictEqual(
  policy.formatScheduleTimeRange({ dueTime: "18:00" }, formatTime),
  "18:00"
);

const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
assert.ok(app.includes("item.timeText"));
assert.ok(app.includes("WeekEntryPolicy.formatScheduleTimeRange"));
assert.ok(app.includes("renderDayOverviewList(overviewItems, \"week\")"));
assert.ok(app.includes('if (item.dataset.entryId) event.dataTransfer.setData("text/entry-id", item.dataset.entryId)'));
assert.ok(app.includes("openEntryDialog(foundEntry.entry.start, foundEntry.entry)"));
assert.ok(app.includes("taskItems.get(task.id)"));
assert.ok(app.includes("scheduleOverviewItemsForDate"));
assert.ok(app.includes("String(entry.title || task.title || \"\").trim()"));
console.log("week entry policy tests passed");
