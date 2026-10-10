const fs = require("fs");
const app = fs.readFileSync("app.js", "utf8");

const required = [
  "TodoListPolicy.loadSavedFilter",
  "TodoListPolicy.saveFilter",
  "TodoListPolicy.buildTodoGroups",
  "TodoListPolicy.flattenGroups",
  "TodoListPolicy.sortByCreatedAtDesc",
  "taskListSearch",
  "continueYesterdayButton",
  "entryLinkConfirmDialog",
  "taskCloseConfirmDialog",
  "requestTaskCompletion",
  "mergeTaskIntoTarget",
  "bindTaskMergePicker",
  "renderTaskMergeOptions",
  "taskMergeSearch",
  "leafOnly: true",
  "priority-mark",
  "priorityShortLabel",
  "task-group-heading",
  "createLinkedWorkCard",
  "materializeLinkedWorkLeaf",
  "__create_parent__",
  "promptEntryParentCreate",
  "createParentAndLeafFromEntryPayload",
  "syncEntryParentCreateDialog",
  "findTaskByNormalizedTitle",
  "挂入已有父级并关联",
  "不会再新建同名父级",
  "preferredParents",
  "挂到父级「${escapeHtml(task.title)}」",
  "resolveCreateUnderExistingParent",
  "创建父级并关联",
  "text/entry-id",
  "taskListSearchTimer",
  "todoCollapsedSections"
];

required.forEach(token => {
  if (!app.includes(token)) throw new Error(`missing todo list enhancement: ${token}`);
});

const styles = fs.readFileSync("styles.css", "utf8");
if (!styles.includes(".task-list.unified-view .task-group-heading")) {
  throw new Error("unified todo headings must not overlap while scrolling");
}
if (!styles.includes('.task-search input[type="search"]')) {
  throw new Error("glass mode should provide readable task search colors");
}
if (!styles.includes("--task-side-action-w") || !styles.includes("task-side-slot")) {
  throw new Error("task search and continue-yesterday should share a side-action width");
}
if (!app.includes("applyListKind") || !app.includes("syncListKindSwitch")) {
  throw new Error("todo/meeting list titles should switch via list-kind controls");
}
if (!app.includes("syncTaskPanelDensity") || !styles.includes("density-md")) {
  throw new Error("task panel should adapt layout density by width");
}
const html = fs.readFileSync("index.html", "utf8");
if (!app.includes("useKindSelect") || !html.includes('id="listKindMenu"') || !app.includes("openListKindMenu")) {
  throw new Error("minimum width should switch list kind to a custom dropdown");
}
const kindTriggerRule = styles.match(/\.list-kind-menu-trigger\s*\{[^}]*\}/);
if (!kindTriggerRule || /border-bottom/.test(kindTriggerRule[0])) {
  throw new Error("list-kind dropdown trigger must not show a bottom underline");
}
if (!/\.task-panel\.density-md \.panel-heading-row[\s\S]*?flex-direction:\s*row/.test(styles)) {
  throw new Error("density-md must keep title and quick-add on one row (scale title, do not stack)");
}
if (!html.includes('placeholder="搜索.../@人员"')) {
  throw new Error("task search placeholder should hint @人员 filtering");
}
if (!/task-list-toolbar[\s\S]*?id="taskSearchWrap"/.test(html) || !/panel-heading-actions[\s\S]*?id="quickTaskForm"/.test(html)) {
  throw new Error("search should sit in the toolbar row; quick-add should sit in the heading side slot");
}
if (/glass-mode \.task-panel \.panel-heading[\s\S]*?background:\s*rgba\(6,\s*16,\s*28/.test(styles)) {
  throw new Error("glass mode must not paint separate opaque chrome strips on task heading");
}
if (!styles.includes(".entry-parent-create-field")) {
  throw new Error("entry linking should provide a readable parent creation field");
}
if (!app.includes("matchesOwnerTokens") || !app.includes("parseOwnerSearchQuery")) {
  throw new Error("todo/meeting search should support @owner/@attendee filtering");
}
if (!html.includes('id="entryOwner"') || !html.includes("参会人")) {
  throw new Error("schedule dialog should collect attendees without crowding list cards");
}

console.log("todo list ui policy tests passed");
