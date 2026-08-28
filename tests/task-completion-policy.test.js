const fs = require("fs");
const app = fs.readFileSync("app.js", "utf8");

for (const marker of ["function findTaskRecords", "function updateTaskRecords", "toggleTaskCompletion(task)", "record.completedAt = closing ? now : \"\"", "saveData();\n  render();"]) {
  if (!app.includes(marker)) throw new Error(`missing completion persistence marker: ${marker}`);
}
for (const marker of [
  "if (payload.completedAt) {",
  "payload.status = \"done\";",
  "payload.progress = 100;",
  "实际完成时间不能早于实际开始时间",
  "if (closing && !record.startedAt && firstStartIso) record.startedAt = firstStartIso;"
]) {
  if (!app.includes(marker)) throw new Error(`missing completion timestamp rule: ${marker}`);
}
if (!app.includes("if (!task || [\"done\", \"closed\"].includes(task.status)) return false;")) {
  throw new Error("automatic status must not reopen ended tasks");
}
console.log("task completion policy tests passed");
