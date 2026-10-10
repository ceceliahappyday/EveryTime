const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

assert.match(html, /id="entryType"/, "entry dialog should expose an explicit schedule type");
assert.match(app, /entry\.entryType \|\|= entry\.taskId \? "task_work" : "calendar"/, "existing entries should migrate without losing records");
assert.match(app, /entryType === "calendar" && !linkSelected/, "meetings may save without a todo link");
assert.match(html, /data-list-kind="meeting"/, "meeting should be a parallel list-kind switch beside todos");
assert.doesNotMatch(html, /data-filter="meeting"/, "meeting should not remain a status tab");
assert.match(app, /function getMeetingListItems/, "meetings must surface as list items with invested hours");
assert.match(app, /function createMeetingCard/, "meeting cards should open the schedule entry, not a todo");
assert.match(html, />会议日程</, "calendar entry type label should be 会议日程");
assert.match(html, />新建待办</, "task_work entry type label should be 新建待办");
assert.doesNotMatch(html, /计入投入，在「会议」清单查看/, "entry type labels should not keep parenthetical hints");
assert.match(app, /resolveEntryTaskLinkWithGuard/, "task work entries should resolve an explicit leaf task link");
assert.match(app, /Meetings stay in the meeting list, but may optionally link a todo/, "meetings should support optional todo linking");
assert.match(app, /entryType: "task_work", taskId: workTask\.id/, "dragging a task into the calendar should remain task work");
assert.match(app, /materializeWorkTodoFromMemo/, "investing on a memo reminder must spawn a new work todo");
assert.match(app, /isMemoReminderTask\(task\)/, "memo reminders are distinct from work leaf todos");
assert.match(
  app,
  /function focusLinkedTaskFilter[\s\S]*state\.filter = "planned"/s,
  "schedule-created planned leaves must switch the todo filter so they are visible"
);
assert.match(
  app,
  /retargetChildrenToMonthlyParentInstance|relatedRecurringParentIds/,
  "monthly parent clones must keep children discoverable across instance ids"
);
assert.doesNotMatch(app, /从日程自动补建，确保左侧待办状态与右侧日程一致/, "unlinked calendar events should not be silently promoted to todos");
assert.match(app, /state\.taskView === "day" && state\.filter === "in_progress"/, "day view should have a global ongoing-task pool");
assert.match(app, /isOngoingTask\(task\)/, "unfinished work should remain draggable across dates until closed");
assert.match(app, /taskHasWorkHistory\(task\.id\)/, "a historical started worklog should keep the task discoverable");
assert.match(app, /monthCanonicalTasks = RecurringPolicy\.dedupeRecurringTasksForDisplay/, "month view should deduplicate recurring tasks across all dates");
assert.match(html, /id="entryOwner"/, "schedule dialog should expose attendees as entryOwner");
assert.match(html, />参会人</, "schedule dialog label for owner field should read 参会人");
assert.match(app, /entry\.owner \|\|= ""/, "calendar entries should migrate an empty owner/attendee field");
assert.match(app, /parseOwnerSearchQuery/, "meeting and todo lists should parse @attendee search tokens");
assert.match(
  app,
  /function createMeetingCard[\s\S]*?function createTaskCard/s,
  "meeting cards stay before task cards for structural assertions"
);
function sliceFn(source, name) {
  const start = source.indexOf(`function ${name}`);
  if (start < 0) return "";
  const end = source.indexOf("\nfunction ", start + 1);
  return end > start ? source.slice(start, end) : source.slice(start);
}
const meetingCardFn = sliceFn(app, "createMeetingCard");
assert.ok(meetingCardFn.startsWith("function createMeetingCard"), "createMeetingCard must exist for card copy checks");
assert.doesNotMatch(meetingCardFn, /责任人|参会人/, "meeting list cards must not render 责任人/参会人 text");
const taskCardFn = sliceFn(app, "createTaskCard");
assert.ok(taskCardFn.startsWith("function createTaskCard"), "createTaskCard must exist for card copy checks");
assert.doesNotMatch(taskCardFn, /责任人/, "todo list cards must not render 责任人 text");

console.log("entry type policy tests passed");
