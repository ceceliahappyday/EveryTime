const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");

assert.match(html, /id="taskDueDateTime"/, "due date and time should share one datetime-local field");
assert.match(html, /type="datetime-local" id="taskDueDateTime"/, "due datetime should match actual start/end picker style");
assert.match(app, /defaultWorkEndTime/, "due time should default to workday end");
assert.match(app, /defaultWorkStartTime/, "actual start should default to workday start when picking");
assert.match(app, /bindWorkHourDateTimeDefault/, "empty datetime pickers should seed work-hour defaults");
assert.match(app, /getTaskDueParts/, "due datetime UI must still map to dueDate/dueTime storage");
assert.match(styles, /body\.in-desktop \.modal\s*\{[^}]*margin-top:\s*88px/s, "desktop modals must sit below the topbar drag region");
assert.match(styles, /-webkit-app-region:\s*no-drag/, "modal chrome must remain clickable over the desktop drag strip");
assert.match(html, /id="closeTaskButton"/, "edit dialog must keep the close-task action");
assert.match(html, /id="taskCloseFollowUpButton"/, "close confirm must keep 关闭并跟踪");
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
