const assert = require("assert");
const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const styles = fs.readFileSync("styles.css", "utf8");
const html = fs.readFileSync("index.html", "utf8");

assert.ok(app.includes("navigateCalendar(-1)"));
assert.ok(app.includes('item.dataset.view === "day"'));
assert.ok(app.includes("openTaskDialog(task)"));
assert.ok(app.includes('if (event.target.closest(".task-check")) return;'));
assert.ok(!app.includes('<span>${formatTime(entry.start)} – ${formatTime(entry.end)} · ${formatHours(entry.end - entry.start)}</span>'));
assert.equal((app.match(/for \(let i = 0; i < 7; i\+\+\)/g) || []).length, 2);
assert.ok(app.includes("taskItems.get(task.id)"));
assert.ok(app.includes("taskItems.set(task.id"));
assert.ok(app.includes("scheduleOverviewItemsForDate"));
assert.ok(app.includes("renderDayOverviewList"));
assert.ok(app.includes("TaskStatusPolicy.scheduleOverviewBadge"));
assert.ok(app.includes("taskFollowUpTracking"));
assert.ok(app.includes("listSideBadge"));
assert.ok(app.includes("requestTaskCompletion"));
assert.ok(app.includes('mode: "followUp"'));
assert.ok(app.includes("taskCloseSuccessorButton"));
assert.ok(app.includes("syncAttentionOnlyChoice"));
assert.ok(app.includes("followUpDraftHint"));
assert.ok(app.includes("Keep ended tasks visible"), "calendars must keep ended tasks visible with strikethrough");
assert.doesNotMatch(html, /id="taskCloseFollowUpButton"/, "close dialog merges tracking into successor flow");
assert.ok(app.includes("follow-up-focus"));
assert.ok(styles.includes("justify-content: center"));
assert.ok(styles.includes("#closeTaskButton"));
assert.ok(!app.includes('return item.kind === "actual" ? "进行" : "计划"'));
assert.ok(!app.includes("renderCalendarEntryList(getCalendarEntriesForDate(key), \"week\")"));
assert.ok(app.includes("gantt-progress-fill"));
assert.ok(app.includes("gantt-progress-pct"));
assert.ok(app.includes("summaryTasks,"));

assert.ok(styles.includes(".month-task-line"));
assert.ok(styles.includes(".week-task-line"));
assert.doesNotMatch(
  styles,
  /\.time-label\s*\{[^}]*transform:\s*translateY\(-/s,
  "timeline hour labels must stay inside their row so start/end hours are not clipped"
);
assert.match(
  styles,
  /\.timeline\s*\{[^}]*padding-top:\s*\d+px/s,
  "timeline needs top padding so the first hour label stays fully visible"
);
assert.ok(styles.includes(".time-row.time-row-end"), "day timeline must render a workday end boundary row");
assert.ok(app.includes("timelineEndLabelHour"), "day timeline must label the workday cutoff hour");
assert.ok(app.includes("scheduleEntryDisplayMeta"), "day timeline should label entries with 会议/计划/进行/备忘 prefixes");
assert.ok(
  app.includes("Left status tabs only reshape the todo list"),
  "left status tabs must not re-filter day/week/month calendars"
);
assert.doesNotMatch(
  app,
  /return items\.filter\(item => scheduleOverviewItemMatchesFilter/,
  "week/month overview must keep all todos and meetings regardless of left status tabs"
);
assert.ok(
  app.includes('filterProjectsForStatus(allProjects, "all")'),
  "gantt must ignore left-panel status tabs and show all status groups"
);
assert.match(
  styles,
  /body\.project-mode \.task-panel\s*\{[^}]*display:\s*none/s,
  "project gantt should hide the left todo list"
);
assert.match(
  styles,
  /\.task-check\s*\{[^}]*place-items:\s*center/s,
  "task checkbox checkmark must be centered"
);
assert.match(
  styles,
  /\.task-close-confirm-actions\s*\{[^}]*display:\s*flex/s,
  "close-task dialog actions should use balanced button widths"
);
assert.match(
  styles,
  /\.modal\s*\{[^}]*padding:\s*24px/s,
  "formless dialogs like close-task need modal padding"
);

console.log("schedule view refinement tests passed");
