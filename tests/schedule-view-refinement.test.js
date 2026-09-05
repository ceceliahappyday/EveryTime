const assert = require("assert");
const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const styles = fs.readFileSync("styles.css", "utf8");

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
assert.ok(app.includes("taskCloseFollowUpButton"));
assert.ok(app.includes("followUpDraftHint"));
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
assert.ok(app.includes("scheduleOverviewItemMatchesFilter"), "day/week/month must follow todo status tabs");
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
assert.match(
  styles,
  /\.month-task-line\s*\{[^}]*grid-template-columns:\s*2em minmax\(0,\s*1fr\)/s,
  "month overview rows must keep badge and title in separate columns"
);
assert.match(
  styles,
  /\.schedule-month-cell\.selected \.month-task-line span\s*\{[^}]*overflow:\s*hidden/s,
  "selected month titles must wrap inside their column instead of overlapping the badge"
);
assert.match(
  styles,
  /body\.in-desktop\.glass-mode \.schedule-month-cell\s*\{[^}]*box-shadow:\s*none/s,
  "month cells must not inherit week-column card shadows in glass mode"
);
assert.ok(styles.includes("grid-template-columns: repeat(5, minmax(0, 1fr))"));
assert.ok(app.includes("ScheduleHoursPolicy.shouldShowWeekColumn"));
assert.ok(styles.includes("grid-template-rows: auto repeat(6, 136px)"));
assert.ok(styles.includes("border-width: 0 0 1px"));
assert.ok(styles.includes(".schedule-month-cell.selected .month-task-list"));
assert.ok(app.includes("goToTodayDayView"));
assert.ok(app.includes('cell.addEventListener("dblclick"'));
assert.ok(styles.includes(".project-gantt-group-chart-spacer"));
assert.match(styles, /\.project-gantt-row-label,\s*\.project-gantt-row-chart\s*\{[^}]*height:\s*36px/s);
assert.match(styles, /\.project-gantt-label-header\s*\{[^}]*height:\s*42px/s);
assert.match(styles, /\.project-gantt-days\s*\{[^}]*height:\s*42px/s);

console.log("schedule view refinement tests passed");
