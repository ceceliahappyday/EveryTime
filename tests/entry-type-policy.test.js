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
assert.match(html, />任务处理</, "task_work entry type label should be 任务处理");
assert.doesNotMatch(html, /option value="task_work">新建待办</, "schedule type must not keep the old 新建待办 label");
assert.doesNotMatch(html, /计入投入，在「会议」清单查看/, "entry type labels should not keep parenthetical hints");
assert.match(app, /resolveEntryTaskLinkWithGuard/, "task work entries should resolve an explicit leaf task link");
assert.match(app, /在已有父级下新建并关联/, "create-under-existing-parent is the primary create label");
assert.match(app, /promptEntryCreateUnderParent/, "creating under an existing parent requires an explicit parent pick");
assert.match(app, /createMode === "under_parent"/, "confirm dialog supports under_parent create mode");
assert.match(app, /formatParentPickPathHtml/, "parent picker lists tasks as hierarchy paths");
assert.match(app, /join\(" \/ "\)/, "parent picker uses spaced / separators for clear hierarchy");
assert.doesNotMatch(app, /将作为父级/, "parent picker must not use confusing 将作为父级 labels");
assert.match(app, /按层级搜索任务/, "parent picker search label describes hierarchy listing");
assert.match(app, /新建父级任务并挂入当前事项/, "create-new-parent option remains available");
assert.match(app, /ensureScheduleLinkedLeafTask/, "schedule save must retarget parent links onto a concrete leaf");
assert.match(app, /highlightTaskId/, "newly linked leaf should be highlighted in the todo list");
assert.match(app, /cancelPendingEntryLinkConfirm/, "canceling link confirm steps back to the schedule dialog");
assert.match(app, /已返回日程，可继续修改挂接/, "cancel must keep the schedule draft and return to it");
assert.match(app, /entryTaskOptions\.innerHTML = create \+/, "create-under-parent / create-parent actions stay at top of link list");
assert.match(app, /＋ 新建</, "week column quick-create uses short 新建 label");
assert.match(html, /搜索\.\.\.\/@人员/, "list search placeholder hints @人员");
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
