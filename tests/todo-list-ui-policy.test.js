const fs = require("fs");
const app = fs.readFileSync("app.js", "utf8");

const required = [
  "TodoListPolicy.loadSavedFilter",
  "TodoListPolicy.saveFilter",
  "TodoListPolicy.buildTodoGroups",
  "TodoListPolicy.flattenGroups",
  "taskListSearch",
  "continueYesterdayButton",
  "entryLinkConfirmDialog",
  "mergeTaskIntoTarget",
  "leafOnly: true",
  "task-parent-path",
  "task-group-heading",
  "createLinkedWorkCard",
  "materializeLinkedWorkLeaf",
  "__create_parent__",
  "promptEntryParentCreate",
  "createParentAndLeafFromEntryPayload",
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
if (!styles.includes('.task-list-toolbar input[type="search"]')) {
  throw new Error("glass mode should provide readable task search colors");
}
if (!styles.includes(".entry-parent-create-field")) {
  throw new Error("entry linking should provide a readable parent creation field");
}

console.log("todo list ui policy tests passed");
