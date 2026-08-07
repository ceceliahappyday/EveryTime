const fs = require("fs");
const app = fs.readFileSync("app.js", "utf8");

for (const marker of ["function findTaskRecords", "function updateTaskRecords", "toggleTaskCompletion(task)", "record.completedAt = closing ? now : \"\"", "saveData();\n  render();"]) {
  if (!app.includes(marker)) throw new Error(`missing completion persistence marker: ${marker}`);
}
if (!app.includes("if (!task || [\"done\", \"closed\"].includes(task.status)) return false;")) {
  throw new Error("automatic status must not reopen ended tasks");
}
console.log("task completion policy tests passed");
