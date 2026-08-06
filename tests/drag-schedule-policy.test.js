const fs = require("fs");
const app = fs.readFileSync("app.js", "utf8");
const context = fs.readFileSync("DEVELOPMENT_CONTEXT.md", "utf8");

for (const marker of ["text/task-id", "text/entry-id", "copyEntryToDate", "bindProjectDrop"]) {
  if (!app.includes(marker)) throw new Error(`missing drag marker: ${marker}`);
}
for (const rule of ["保留原记录", "会议/普通日程拖动只复制日程记录", "未来投入不计实际工时"]) {
  if (!context.includes(rule)) throw new Error(`missing product rule: ${rule}`);
}
console.log("drag schedule policy tests passed");
