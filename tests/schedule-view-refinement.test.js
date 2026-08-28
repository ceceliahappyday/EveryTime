const assert = require("assert");
const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const styles = fs.readFileSync("styles.css", "utf8");

assert.ok(app.includes('state.taskView = "day";\n    state.projectViewNeedsAnchor = false;'));
assert.ok(app.includes('item.dataset.view === "day"'));
assert.ok(app.includes('if (!event.target.closest("button")) openTaskDialog(task);'));
assert.ok(!app.includes('<span>${formatTime(entry.start)} – ${formatTime(entry.end)} · ${formatHours(entry.end - entry.start)}</span>'));
assert.equal((app.match(/for \(let i = 0; i < 7; i\+\+\)/g) || []).length, 2);
assert.ok(app.includes("taskItems.get(task.id)"));
assert.ok(app.includes("taskItems.set(task.id"));
assert.ok(app.includes("scheduleOverviewItemsForDate"));
assert.ok(app.includes("renderDayOverviewList"));
assert.ok(app.includes('overviewItemBadge(item)'));
assert.ok(app.includes('"进行"'));
assert.ok(!app.includes("renderCalendarEntryList(getCalendarEntriesForDate(key), \"week\")"));
assert.ok(app.includes("gantt-progress-fill"));
assert.ok(app.includes("gantt-progress-pct"));
assert.ok(app.includes("summaryTasks,"));

assert.ok(styles.includes(".month-task-line"));
assert.ok(styles.includes(".week-task-line"));
assert.ok(styles.includes("repeat(2, minmax(76px, .52fr))"));
assert.ok(styles.includes("grid-auto-rows: minmax(124px, auto)"));
assert.ok(styles.includes("border-width: 0 0 1px"));

console.log("schedule view refinement tests passed");
