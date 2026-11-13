const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

assert.match(html, /id="entryType"/, "entry dialog should expose an explicit schedule type");
assert.match(app, /entry\.entryType \|\|= entry\.taskId \? "task_work" : "calendar"/, "existing entries should migrate without losing records");
assert.match(app, /entryType === "calendar" && !linkedId/, "meetings may save without a todo link");
assert.match(html, /data-list-kind="meeting"/, "meeting should be a parallel list-kind switch beside todos");
assert.doesNotMatch(html, /data-filter="meeting"/, "meeting should not remain a status tab");
assert.match(app, /function getMeetingListItems/, "meetings must surface as list items with invested hours");
assert.match(app, /TodoListPolicy\.compareMeetingScheduleAsc/, "meeting list must sort by schedule ascending");
assert.match(app, /TodoListPolicy\.buildMeetingAllSections/, "all-meetings view must group by phase");
assert.match(app, /function createMeetingCard/, "meeting cards should open the schedule entry, not a todo");
assert.match(html, />会议日程</, "calendar entry type label should be 会议日程");
assert.match(html, />任务处理</, "task_work entry type label should be 任务处理");
assert.match(html, /id="entryTitleField"/, "meeting title field is separable from task investment");
assert.match(html, /选择已有叶子任务/, "hang-task trigger only allows existing leaf");
assert.match(html, /本时段投入内容/, "entry note is the session investment content field");
assert.match(html, /写这次做了什么；显示在日程块，并记入任务进度/, "entry note copy explains schedule + task progress");
assert.match(app, /normalizeEntryNote/, "duplicate title/note is collapsed on save");
assert.match(app, /shouldShowEntryNoteOnSchedule|resolveScheduleEntryPrimaryText/, "schedule cards prefer concrete note on the primary line");
assert.match(app, /resolveScheduleEntryPrimaryText/, "dragged and new entries share one primary-line resolver");
assert.match(app, /function getEntryFieldLockState/, "schedule form exposes association lock state");
assert.match(app, /function updateEntryFieldLocks/, "schedule form applies field locks for linked investments");
assert.match(app, /function syncEntryTitleFromLinkedSelection/, "task_work title mirrors the selected leaf only");
assert.match(app, /function syncEntryCategoryFromTask/, "schedule category mirrors the linked task");
assert.match(app, /分类跟随任务/, "linked schedule hides/locks category because it follows the task");
assert.doesNotMatch(app, /function adoptLinkedLeafTitle/, "schedule must not migrate typed title into note");
assert.match(app, /绝不改写本时段投入内容/, "selecting a leaf must not overwrite session note");
assert.doesNotMatch(
  app,
  /if \(id === payload\.taskId\) \{\s*task\.category = category/s,
  "saving schedule must not rewrite the task category"
);
assert.match(app, /lockLink: editingLinked/, "saved linked entries lock the task association");
assert.match(app, /computeScheduleDerivedProgress/, "parent and leaf progress share one schedule-derived helper");
assert.match(app, /taskHasActiveChildWork/, "parents become in_progress from active child work");
assert.match(
  app,
  /while \(currentId && !seen\.has\(currentId\)\)/,
  "refreshTaskStatusForId walks ancestors after leaf investment"
);
assert.match(
  app,
  /function createEntryFromTask[\s\S]*openEntryDialog/s,
  "dragging a leaf opens the schedule form to fill session investment"
);
assert.match(
  app,
  /function finalizeEntrySave[\s\S]*applyInvestmentNoteToTask/s,
  "saving a schedule writes the session note into task progress"
);
assert.doesNotMatch(html, /option value="task_work">新建待办</, "schedule type must not keep the old 新建待办 label");
assert.doesNotMatch(html, /计入投入，在「会议」清单查看/, "entry type labels should not keep parenthetical hints");
assert.match(app, /resolveEntryTaskLinkWithGuard/, "task work entries should resolve an explicit leaf task link");
assert.match(app, /任务处理须选择已有叶子任务/, "empty link task_work must refuse and ask for an existing leaf");
assert.match(app, /任务处理须挂接已有叶子/, "link guard also refuses empty task_work links");
assert.doesNotMatch(app, /el\.entryTaskLink\.add\(new Option\("在已有父级下新建并关联"/, "schedule link list must not offer create-under-parent");
assert.doesNotMatch(app, /el\.entryTaskLink\.add\(new Option\("新建父级任务并挂入当前事项"/, "schedule link list must not offer create-parent");
assert.doesNotMatch(app, /空着则新建顶层任务/, "schedule copy must not invite empty-link task creation");
assert.doesNotMatch(app, /data-value="__create__"/, "schedule popup must not expose __create__ actions");
assert.doesNotMatch(app, /data-value="__create_parent__"/, "schedule popup must not expose __create_parent__ actions");
assert.match(app, /ensureScheduleLinkedLeafTask/, "schedule save must retarget parent links onto an existing leaf");
assert.match(app, /请选择其下已有叶子记工时/, "parent links must refuse create-from-schedule");
assert.match(app, /if \(taskId && !linkedTaskId\) return/, "save aborts when parent cannot be retargeted to an existing leaf");
assert.match(app, /highlightTaskId/, "newly linked leaf should be highlighted in the todo list");
assert.match(app, /cancelPendingEntryLinkConfirm/, "canceling link confirm steps back to the schedule dialog");
assert.match(app, /已返回日程，可继续修改挂接/, "cancel must keep the schedule draft and return to it");
assert.match(app, /entryTaskOptions\.innerHTML = items \|\| empty/, "link list shows existing leaves only");
assert.match(app, /＋ 新建</, "week column quick-create uses short 新建 label");
assert.match(html, /搜索\.\.\.\/@人员/, "list search placeholder hints @人员");
assert.match(app, /Meetings stay in the meeting list, but may optionally link a todo/, "meetings should support optional todo linking");
assert.match(
  app,
  /entryType:\s*"task_work"[\s\S]*taskId:\s*workTask\.id/,
  "dragging a task into the calendar should remain task work"
);
assert.doesNotMatch(app, /fromMemo \? materializeWorkTodoFromMemo/, "仅关注 tasks must invest in place instead of spawning a second todo");
assert.match(app, /isMemoReminderTask\(task\)/, "待跟踪 remains a mark filter, not a second work item");
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
assert.doesNotMatch(taskCardFn, /task-created-at/, "creation time belongs in task detail, not list cards");

console.log("entry type policy tests passed");
