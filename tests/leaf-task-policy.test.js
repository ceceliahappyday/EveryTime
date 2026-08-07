const fs = require("fs");
const app = fs.readFileSync("app.js", "utf8");
const context = fs.readFileSync("DEVELOPMENT_CONTEXT.md", "utf8");

if (!app.includes("function isTodoListTask(task)")) throw new Error("leaf task predicate missing");
if (!app.includes("return !!task && !hasChildTasks(task.id);")) throw new Error("all leaf levels must be listable");
if (!app.includes("task.parentId || task.parentTaskId || task.parentTask || task.parent")) throw new Error("legacy parent field migration missing");
if (!app.includes("function updateTaskRecords(id, updater)")) throw new Error("duplicate task records must be synchronized");
for (const rule of ["支持无限层级父子任务", "只有没有子任务时才作为普通待办叶子显示", "保持原层级/父级线索"]) {
  if (!context.includes(rule)) throw new Error(`missing hierarchy rule: ${rule}`);
}
console.log("leaf task policy tests passed");
