import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputPath = process.argv[2];
let input = "";
for await (const chunk of process.stdin) input += chunk;
const data = JSON.parse(input);

const workbook = Workbook.create();
const tasks = workbook.worksheets.add("任务清单");
const schedules = workbook.worksheets.add("日程记录");
const notes = workbook.worksheets.add("每日备注");
const headerFill = "#3C6655";
const lightFill = "#E6EFE9";

const taskHeaders = ["任务ID","任务名称","层级","父任务ID","责任人","优先级","状态","进度","截止日期","截止时间","实际开始","实际完成/关闭","投入工时","业务背景","问题原因","交付进度说明","任务说明","每月重复","重复至月份","重复组ID","创建时间","最后更新时间"];
const taskRows = data.tasks.map(t => [
  t.id, t.title, t.parentId ? "子任务" : "父任务", t.parentId || "", t.owner,
  priority(t.priority), status(t.status), Number(t.progress || 0) / 100,
  asDate(t.dueDate), t.dueTime, asDateTime(t.startedAt), asDateTime(t.completedAt),
  Number(t.workHours || 0), t.businessBackground, t.problemReason, t.deliveryNote,
  t.description, t.recurrence?.frequency === "monthly" ? "是" : "否",
  t.recurrence?.until || "", t.recurrenceGroupId || "", asDateTime(t.createdAt), asDateTime(t.updatedAt)
]);
tasks.getRangeByIndexes(0, 0, taskRows.length + 1, taskHeaders.length).values = [taskHeaders, ...taskRows];
styleSheet(tasks, taskHeaders.length, taskRows.length + 1);
if (taskRows.length) {
  tasks.getRange(`H2:H${taskRows.length + 1}`).format.numberFormat = "0%";
  tasks.getRange(`I2:I${taskRows.length + 1}`).format.numberFormat = "yyyy-mm-dd";
  tasks.getRange(`K2:L${taskRows.length + 1}`).format.numberFormat = "yyyy-mm-dd hh:mm";
  tasks.getRange(`M2:M${taskRows.length + 1}`).format.numberFormat = "0.0";
  tasks.getRange(`U2:V${taskRows.length + 1}`).format.numberFormat = "yyyy-mm-dd hh:mm";
}
tasks.tables.add(`A1:V${Math.max(2, taskRows.length + 1)}`, true, "TasksTable").style = "TableStyleMedium4";
tasks.getRange(`B1:B${Math.max(2, taskRows.length + 1)}`).format.columnWidth = 24;
tasks.getRange(`N1:Q${Math.max(2, taskRows.length + 1)}`).format.columnWidth = 28;
tasks.getRange(`N1:Q${Math.max(2, taskRows.length + 1)}`).format.wrapText = true;
tasks.getRange(`K1:L${Math.max(2, taskRows.length + 1)}`).format.columnWidth = 19;
tasks.getRange(`U1:V${Math.max(2, taskRows.length + 1)}`).format.columnWidth = 19;
tasks.getRange(`I1:I${Math.max(2, taskRows.length + 1)}`).format.columnWidth = 12;
tasks.getRange(`J1:J${Math.max(2, taskRows.length + 1)}`).format.columnWidth = 10;

const scheduleHeaders = ["日期","开始时间","结束时间","计划时长","实际投入工时","事项","关联任务ID","备注","颜色"];
const scheduleRows = data.schedules.map(s => [
  asDate(s.date), decimalTime(s.start), decimalTime(s.end),
  Number(s.plannedDurationHours || 0), Number(s.durationHours || 0),
  s.title, s.taskId || "", s.note || "", s.color || ""
]);
schedules.getRangeByIndexes(0, 0, scheduleRows.length + 1, scheduleHeaders.length).values = [scheduleHeaders, ...scheduleRows];
styleSheet(schedules, scheduleHeaders.length, scheduleRows.length + 1);
if (scheduleRows.length) {
  schedules.getRange(`A2:A${scheduleRows.length + 1}`).format.numberFormat = "yyyy-mm-dd";
  schedules.getRange(`B2:C${scheduleRows.length + 1}`).format.numberFormat = "hh:mm";
  schedules.getRange(`D2:E${scheduleRows.length + 1}`).format.numberFormat = "0.0";
}
schedules.tables.add(`A1:I${Math.max(2, scheduleRows.length + 1)}`, true, "SchedulesTable").style = "TableStyleMedium4";
schedules.getRange(`F1:F${Math.max(2, scheduleRows.length + 1)}`).format.columnWidth = 24;
schedules.getRange(`H1:H${Math.max(2, scheduleRows.length + 1)}`).format.columnWidth = 28;
schedules.getRange(`H1:H${Math.max(2, scheduleRows.length + 1)}`).format.wrapText = true;
schedules.getRange(`A1:A${Math.max(2, scheduleRows.length + 1)}`).format.columnWidth = 12;

const noteHeaders = ["日期","当天备注"];
const noteRows = data.notes.map(n => [asDate(n.date), n.note]);
notes.getRangeByIndexes(0, 0, noteRows.length + 1, 2).values = [noteHeaders, ...noteRows];
styleSheet(notes, 2, noteRows.length + 1);
if (noteRows.length) {
  notes.getRange(`A2:A${noteRows.length + 1}`).format.numberFormat = "yyyy-mm-dd";
  notes.getRange(`B2:B${noteRows.length + 1}`).format.wrapText = true;
}
notes.tables.add(`A1:B${Math.max(2, noteRows.length + 1)}`, true, "NotesTable").style = "TableStyleMedium4";
notes.getRange(`B1:B${Math.max(2, noteRows.length + 1)}`).format.columnWidth = 45;
notes.getRange(`A1:A${Math.max(2, noteRows.length + 1)}`).format.columnWidth = 12;

function styleSheet(sheet, colCount, rowCount) {
  sheet.showGridLines = false;
  sheet.freezePanes.freezeRows(1);
  const header = sheet.getRangeByIndexes(0, 0, 1, colCount);
  header.format = { fill: headerFill, font: { bold: true, color: "#FFFFFF" }, rowHeight: 28 };
  const all = sheet.getRangeByIndexes(0, 0, Math.max(2, rowCount), colCount);
  all.format.font = { name: "Microsoft YaHei", size: 10 };
  all.format.autofitColumns();
  all.format.autofitRows();
  for (let c = 0; c < colCount; c++) {
    const column = sheet.getRangeByIndexes(0, c, Math.max(2, rowCount), 1);
    if (column.format.columnWidth > 28) column.format.columnWidth = 28;
  }
  if (rowCount > 1) sheet.getRangeByIndexes(1, 0, rowCount - 1, colCount).format.borders = {
    insideHorizontal: { style: "thin", color: "#E5E7E2" }
  };
}

function asDate(value) {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function asDateTime(value) { return value ? new Date(value) : null; }
function decimalTime(value) {
  if (value === null || value === undefined) return null;
  return Number(value) / 24;
}
function status(value) { return ({ planned:"计划中", in_progress:"进行中", done:"已完成", closed:"已关闭" })[value] || value; }
function priority(value) {
  return ({
    general_daily:"一般日常",
    kpi:"KPI",
    follow_up:"跟踪关注",
    important_urgent:"重要紧急",
    paused:"中止暂停",
    low:"跟踪关注",
    medium:"跟踪关注",
    high:"重要紧急",
    urgent:"重要紧急"
  })[value] || "一般日常";
}

const exported = await SpreadsheetFile.exportXlsx(workbook);
await exported.save(outputPath);
