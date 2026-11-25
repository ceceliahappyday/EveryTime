const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const ExcelJS = require("exceljs");
const ExcelExportPolicy = require("../excel-export-policy.js");

assert.equal(ExcelExportPolicy.ensureXlsxPath("a/b/out"), "a/b/out.xlsx");
assert.equal(ExcelExportPolicy.ensureXlsxPath("a/b/out.XLSX"), "a/b/out.XLSX");

const sample = {
  tasks: [{
    id: "t1",
    title: "示例任务",
    parentId: null,
    owner: "A",
    priority: "kpi",
    status: "in_progress",
    progress: 40,
    planDate: "2026-11-25",
    dueDate: "2026-11-26",
    businessBackground: "背景<br><img src=\"data:image/png;base64,AAAA\">",
    deliveryNote: "交付说明",
    workHours: 1.5
  }],
  schedules: [{
    date: "2026-11-25",
    start: 9,
    end: 10.5,
    plannedDurationHours: 1.5,
    durationHours: 1.5,
    title: "日程事项",
    taskId: "t1",
    owner: "A",
    note: "备注",
    color: "#333"
  }],
  notes: [{ date: "2026-11-25", note: "当天备注" }]
};

const slim = ExcelExportPolicy.slimExportDataForExcel(sample);
assert.match(slim.tasks[0].businessBackground, /背景/);
assert.doesNotMatch(slim.tasks[0].businessBackground, /data:image/);

const fromStore = ExcelExportPolicy.buildExportDataFromStore({
  "2026-11-25": {
    tasks: [{ id: "t2", title: "库内任务", status: "planned" }],
    entries: [{ id: "e1", title: "库内日程", start: 14, end: 15 }],
    note: "库备注"
  },
  __meta: { ignore: true }
});
assert.equal(fromStore.tasks.length, 1);
assert.equal(fromStore.schedules.length, 1);
assert.equal(fromStore.notes.length, 1);

(async () => {
  const out = path.join(os.tmpdir(), `everytime-excel-export-test-${Date.now()}.xlsx`);
  const written = await ExcelExportPolicy.writeExcelFile(out, sample);
  fs.writeFileSync(written.target, written.buffer);
  assert.ok(fs.existsSync(written.target));
  assert.ok(fs.statSync(written.target).size > 1000);
  assert.equal(written.taskCount, 1);
  assert.equal(written.scheduleCount, 1);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(written.target);
  assert.equal(workbook.getWorksheet("任务清单").rowCount >= 2, true);
  assert.equal(workbook.getWorksheet("日程记录").rowCount >= 2, true);
  assert.equal(workbook.getWorksheet("每日备注").rowCount >= 2, true);

  await assert.rejects(
    () => ExcelExportPolicy.writeExcelFile(out, { tasks: [], schedules: [], notes: [] }),
    /没有可导出/
  );

  // Real backup smoke test when present.
  const real = "D:/今日日程APP/导出/今日日程-全部数据-2026-11-25.json";
  if (fs.existsSync(real)) {
    const json = JSON.parse(fs.readFileSync(real, "utf8"));
    const realOut = path.join(os.tmpdir(), `everytime-excel-real-${Date.now()}.xlsx`);
    const realWritten = await ExcelExportPolicy.writeExcelFile(realOut, {
      tasks: json.tasks,
      schedules: json.schedules,
      notes: json.notes
    });
    fs.writeFileSync(realWritten.target, realWritten.buffer);
    assert.ok(realWritten.taskCount > 0);
    assert.ok(realWritten.scheduleCount > 0);
    assert.ok(fs.statSync(realWritten.target).size > 10000);
    fs.unlinkSync(realWritten.target);
  }

  fs.unlinkSync(written.target);
  console.log("excel export policy tests passed");
})().catch(error => {
  console.error(error);
  process.exit(1);
});
