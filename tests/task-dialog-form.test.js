const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");

assert.match(html, /id="taskDueDateTime"/, "due date and time should share one field");
assert.match(html, /type="text" id="taskDueDateTime"/, "due datetime should allow free typing");
assert.match(html, /id="taskScheduleTimeRow"/, "status and due time share one compact row");
assert.match(html, /id="taskTitleField"/, "task title field remains");
assert.match(html, /id="taskTitleAttentionRow"/, "title shares a row with 仅关注");
assert.match(html, /任务类别/, "category field labeled 任务类别");
assert.match(html, /目标完成时间/, "due field labeled 目标完成时间");
assert.match(html, /实际关闭时间/, "actual end labeled 实际关闭时间");
assert.match(html, /id="taskStatusField"/, "task status remains a dedicated field");
assert.match(html, /id="taskMeetingEndDateTime"/, "meeting create needs end datetime");
assert.match(app, /parseFlexibleDateTime|bindFlexibleDateTimeInput/, "typed datetime text must normalize to standard format");
assert.match(app, /finalizeFlexibleDateTimeParts/, "compact YYYYMMDDHHmm must share one parse path");
assert.match(app, /replace\(\/-\/g,\s*"\/"\)/, "display datetime uses 2026/10/10 style");
assert.match(app, /data-datetime-target[\s\S]*openDateTimePickerForInput/, "datetime calendar opens from the icon button");
assert.match(app, /datetime-native-picker-anchor/, "native datetime picker overlays the field wrap");
assert.match(styles, /\.datetime-native-picker-anchor/, "picker overlay styles keep calendar under the field");
assert.doesNotMatch(app, /left:-9999/, "datetime picker must not anchor off-screen / top-left");
assert.doesNotMatch(app, /datetimeDblclickBound/, "datetime fields no longer open calendar on double-click");
assert.match(app, /bindFlexibleDateTimeInput\(el\.taskActualStart/, "actual start supports typed parse");
assert.match(app, /bindFlexibleDateTimeInput\(el\.taskActualEnd/, "actual end supports typed parse");
assert.match(app, /bindFlexibleDateTimeInput\(el\.taskCloseCompletedAt/, "close confirm time supports typed parse");
assert.match(html, /type="text" id="taskActualStart"/, "actual start is a free-typed text field");
assert.match(html, /type="text" id="taskActualEnd"/, "actual end is a free-typed text field");
assert.match(html, /type="text" id="taskCloseCompletedAt"/, "close confirm completion time is free-typed");
assert.match(app, /defaultWorkEndTime/, "due time should default to workday end");
assert.match(app, /defaultWorkStartTime/, "actual start should default to workday start when picking");
assert.match(app, /bindWorkHourDateTimeDefault/, "empty datetime pickers should seed work-hour defaults");
assert.match(
  app,
  /bindWorkHourDateTimeDefault\(el\.taskDueDateTime/,
  "目标完成时间 must auto-seed date/time on click like actual start/end"
);
assert.match(app, /getTaskDueParts/, "due datetime UI must still map to dueDate/dueTime storage");
assert.match(styles, /body\.in-desktop \.modal\s*\{[^}]*margin-top:\s*88px/s, "desktop modals must sit below the topbar drag region");
assert.match(styles, /-webkit-app-region:\s*no-drag/, "modal chrome must remain clickable over the desktop drag strip");
assert.match(html, /id="closeTaskButton"/, "edit dialog must keep the close-task action");
assert.doesNotMatch(html, /id="taskCloseFollowUpButton"/, "tracking is folded into 关闭并新建后续");
assert.match(html, /id="taskCloseSuccessorButton"/, "close confirm must offer 关闭并新建后续");
assert.match(app, /createSuccessorWorkTask/, "closing may spawn a successor work todo");
assert.match(app, /buildSuccessorTask/, "successor payload must come from status policy");
assert.match(app, /syncAttentionMode|syncAttentionOnlyChoice/, "successor dialog must expose 仅关注 toggle");
assert.match(
  app,
  /if \(attentionOnly\) \{[\s\S]*payload\.attentionOnly = true[\s\S]*payload\.completedAt = ""/,
  "完善时勾选仅关注 must mark in place and must not close the task"
);
assert.doesNotMatch(
  app,
  /payload\.status = TaskStatusPolicy\.TRACKING_STATUS/,
  "仅关注 must not switch the work status to tracking"
);
assert.match(app, /isSupersededClosedWorkTask/, "closed originals with a live tracking successor stay out of 待办");
assert.match(html, /task-attention-inline/, "仅关注 remains available inline");
assert.match(
  html,
  /taskTitleCaption[\s\S]*taskFollowUpOption[\s\S]*taskTitleField[\s\S]*taskCreateKind[\s\S]*taskCategory[\s\S]*taskPriority[\s\S]*taskOwner[\s\S]*taskParent[\s\S]*taskStatusField[\s\S]*taskDueDateTime[\s\S]*taskActualStart[\s\S]*taskActualEnd[\s\S]*taskBusinessBackground/,
  "form order: title caption|attention → title input → kind|category → priority|owner → parent → status|due → actual → background"
);
assert.match(html, /task-kind-category-row/, "type and category share one row");
assert.match(html, /task-title-block|task-title-heading/, "title caption and 仅关注 share the heading row");
assert.match(html, /id="taskTitleCaption"/, "title caption sits on the heading row");
assert.match(styles, /\.task-title-heading[\s\S]*justify-content:\s*space-between/, "仅关注 sits on the right of the title caption row");
assert.match(html, /task-status-due-row/, "status and due time share one row");
assert.match(html, /待办类型/, "create kind labeled 待办类型");
assert.match(html, /id="taskDueDateTime"[^>]*placeholder="2026\/10\/10 09:10"/, "datetime placeholder shows format only");
assert.match(html, /任务级别/, "priority labeled 任务级别");
assert.match(html, /责任人员/, "owner labeled 责任人员");
assert.match(html, /<option value="planned">计划中<\/option>/, "status option drops parenthetical hint");
assert.match(app, /计划中<\/option>[\s\S]*进行中<\/option>/, "status options rebuilt without parenthetical hints");
assert.match(styles, /minmax\(0,\s*1fr\)\s+minmax\(0,\s*1fr\)/, "paired form columns keep equal widths");
assert.match(styles, /#taskEditForm[\s\S]*min-height:\s*42px/, "short controls share a unified 42px height");
assert.match(app, /settingsDialog \|\| document\.body/, "color palette mounts inside settings dialog");
assert.doesNotMatch(html, /task-attention-hint|只提醒，不排投入/, "仅关注 no longer shows helper microcopy");
assert.match(html, /到目标完成日当天会用红色感叹号提醒/, "仅关注 explains the due-day alarm");
assert.match(app, /isAttentionAlarmDue/, "attention tasks raise an alarm on the due date");
assert.match(app, /task-attention-alarm-mark/, "due attention tasks show a red exclamation mark");
assert.match(styles, /\.task-attention-alarm-mark[\s\S]*background:\s*#e24b4b/, "due-day alarm mark is red");
assert.match(app, /maybePromptAttentionAlarms/, "startup should prompt due attention reminders");
assert.match(html, /id="attentionAlarmBanner"/, "due attention reminders use a sticky clickable banner");
assert.match(app, /openAttentionAlarmList/, "clicking the reminder must open those tasks in the todo list");
assert.match(app, /attentionAlarmTaskIds/, "reminder click filters the todo list to the due attention tasks");
assert.match(app, /\$\{count\} 条任务已到目标完成日期，点击查看/, "banner summarizes the task count instead of joining titles");
assert.doesNotMatch(app, /titles\.join\("、"\)/, "reminder popup must not concatenate task titles");
assert.match(app, /kind: "attention-alarm"/, "desktop notification click must route back to the same task list");
assert.match(app, /onNotifyClicked/, "renderer listens for notification clicks");
assert.match(styles, /\.attention-alarm-banner\.show[\s\S]*pointer-events:\s*auto/, "reminder banner stays clickable until viewed");
assert.match(app, /返回全部任务/, "attention reminder list must offer a way back to all tasks");
assert.match(styles, /#taskEditForm \.form-row > label:not\(#taskTitleField\):not\(\.checkbox-setting\)/, "short task fields keep label and control on one row");
assert.match(
  styles,
  /body\.in-desktop\.shell-focus #taskEditForm \.form-row[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*!important/s,
  "narrow focus shell must stack paired task/meeting form columns"
);
assert.match(
  styles,
  /body\.in-desktop\.shell-focus #taskEditForm[\s\S]*display:\s*grid\s*!important[\s\S]*width:\s*auto\s*!important/s,
  "narrow focus shell must drop the fixed 7em side labels so inputs keep full width"
);
assert.match(
  styles,
  /body\.in-desktop\.shell-focus #entryDialog[\s\S]*calc\(100vw - 12px\)/s,
  "entry dialog must also fit the focus shell width"
);
assert.match(styles, /\.task-attention-inline\s*\{[^}]*border:\s*0/s, "仅关注 has no outer border");
assert.match(app, /abandonPendingSuccessorRollback/, "canceling successor draft must restore the closed source task");
assert.match(app, /pendingSuccessorRollback/, "close-and-successor must be reversible until saved");
assert.match(app, /继承原任务的优先级与上级/, "successor draft should explain inherited priority/parent");
assert.match(html, /id="taskDialogCancelButton"/, "new-task cancel must have a dedicated button id");
assert.match(app, /closeDialogById/, "cancel buttons must close dialogs reliably");
assert.match(app, /taskDialogCancelButton/, "cancel button must bind a direct close handler");
assert.match(app, /requestTaskCompletion\(task\)/, "closing from edit dialog must offer follow-up creation");
assert.doesNotMatch(
  styles,
  /\.modal\s*\{[^}]*transform:\s*translate/s,
  "dialogs must not use translate positioning that breaks Electron hit testing"
);
assert.doesNotMatch(
  styles,
  /body\.in-desktop:has\(dialog\.modal\[open\]\) \.topbar[^{]*\{[^}]*pointer-events:\s*none/s,
  "open dialogs must not disable the whole topbar hit-testing layer in a way that blocks cancels"
);
assert.match(html, /option value="monthly_fixed">每月例行</, "monthly recurrence should live in the priority select as 每月例行");
assert.doesNotMatch(
  html,
  /class="checkbox-setting"[\s\S]*taskMonthlyRecurring/,
  "monthly checkbox should not remain a visible form control"
);
assert.match(app, /resolvePersistedPriority/, "monthly UI option must not persist monthly_fixed as priority");
assert.doesNotMatch(
  app,
  /if \(task\.recurrence\?\.frequency === "monthly"\) task\.priority = "monthly_fixed"/,
  "migrate must not overwrite historical priority for monthly recurrence"
);
assert.match(
  app,
  /if \(task\.priority === "monthly_fixed"\) task\.priority = "general_daily"/,
  "any leftover monthly_fixed priority sentinel should be repaired to general_daily"
);
assert.match(html, /归属上级任务/, "parent task field must remain in the create/edit dialog");
assert.match(html, /id="taskParentTrigger"/, "parent task combobox trigger must remain available");
assert.match(html, /背景与说明/, "background and reason should merge into one visible field");
assert.match(html, /id="taskBusinessBackground"/, "businessBackground input must remain for storage");
assert.match(html, /id="taskBusinessBackground"[\s\S]*contenteditable="true"/, "business background uses rich note editor");
assert.match(app, /bindRichNoteEditor\(el\.taskBusinessBackground\)/, "business background must bind rich note paste/drop");
assert.match(app, /businessBackground,/, "save payload keeps businessBackground from rich editor");
assert.match(html, /id="problemReasonLabel" class="hidden"/, "problem reason stays in DOM but hidden");
assert.match(html, /id="taskDeliveryField" class="hidden"/, "delivery note stays in DOM but hidden");
assert.match(html, /id="taskDescription"/, "description input must remain for storage compatibility");
assert.match(html, /下级任务 \/ 交付拆解/, "child tasks replace the delivery textarea in the UI");
assert.match(html, /id="taskSubtaskList"/, "next-level child list must be present");
assert.match(app, /deliveryNote: editing\?\.task\?\.deliveryNote/, "saving must preserve historical deliveryNote");
assert.match(app, /problemReason: ""/, "saving merged context must clear problemReason to avoid duplicate reopen text");
assert.match(styles, /#taskDialog\[open\]\s*\{[^}]*display:\s*flex/s, "task dialog flex layout must only apply while open");
assert.doesNotMatch(
  styles,
  /#taskDialog\s*\{[^}]*display:\s*flex/s,
  "closed task dialog must keep UA display:none so cancel/close can hide it"
);
assert.match(styles, /\.modal-scroll\s*\{[^}]*overflow-y:\s*auto/s, "only the inner modal body should scroll");
assert.match(app, /isMonthlyPrioritySelected/, "monthly priority option must drive recurrence");
assert.match(app, /defaultDueTime/, "due time helper should remain as workday-end alias");
assert.match(app, /createDraftChildTasks/, "new child titles entered in the dialog must be saved");
assert.match(app, /mergeTaskContextText/, "legacy background/reason text should merge for editing");

console.log("task dialog form tests passed");
