(function (root, factory) {
  const policy = factory(
    typeof require === "function" ? require("exceljs") : root.ExcelJS,
    typeof require === "function" ? require("./rich-note-policy.js") : root.RichNotePolicy
  );
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.ExcelExportPolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function (ExcelJS, RichNotePolicy) {
  const EXCEL_CELL_MAX = 32000;

  function plainNote(value) {
    try {
      return String(RichNotePolicy?.plainTextFromNote?.(value) || value || "").slice(0, EXCEL_CELL_MAX);
    } catch {
      return String(value || "").replace(/<[^>]+>/g, " ").slice(0, EXCEL_CELL_MAX);
    }
  }

  function clip(value) {
    if (value == null) return "";
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? "" : value;
    if (typeof value === "number") return Number.isFinite(value) ? value : "";
    return String(value).slice(0, EXCEL_CELL_MAX);
  }

  function asDate(value) {
    if (!value) return "";
    const raw = String(value).slice(0, 10);
    const date = new Date(`${raw}T00:00:00`);
    return Number.isNaN(date.getTime()) ? clip(value) : date;
  }

  function asDateTime(value) {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? clip(value) : date;
  }

  function decimalTime(value) {
    if (value === undefined || value === null || value === "") return "";
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "";
    const hour = Math.floor(numeric);
    const minute = Math.round((numeric - hour) * 60);
    const date = new Date(1899, 11, 30, hour, minute, 0, 0);
    return Number.isNaN(date.getTime()) ? "" : date;
  }

  function displayLength(value) {
    if (value instanceof Date) return 16;
    if (value === null || value === undefined) return 0;
    return Math.min(String(value).length, 64);
  }

  function statusLabel(status) {
    return {
      unplanned: "未计划",
      planned: "计划中",
      in_progress: "进行中",
      tracking: "待跟踪",
      done: "已完成",
      closed: "已关闭"
    }[status] || "计划中";
  }

  function priorityLabel(priority) {
    return {
      general_daily: "一般日常",
      kpi: "KPI",
      follow_up: "跟踪关注",
      important_urgent: "重要紧急",
      paused: "中止暂停",
      monthly_fixed: "每月例行"
    }[priority] || "一般日常";
  }

  function maxWidth(header, values) {
    let max = String(header || "").length;
    for (let i = 0; i < values.length; i += 1) {
      const length = displayLength(values[i]);
      if (length > max) max = length;
    }
    return max;
  }

  function addSheet(workbook, name, headers, rows, formats = {}) {
    const sheet = workbook.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
    sheet.addRow(headers);
    rows.forEach(row => sheet.addRow(row.map(clip)));
    const header = sheet.getRow(1);
    header.height = 24;
    header.eachCell(cell => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3C6655" } };
      cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });
    sheet.eachRow((row, rowNumber) => {
      row.eachCell(cell => {
        cell.font = { name: "Microsoft YaHei", size: 10, ...(cell.font || {}) };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E6E1" } },
          left: { style: "thin", color: { argb: "FFE2E6E1" } },
          bottom: { style: "thin", color: { argb: "FFE2E6E1" } },
          right: { style: "thin", color: { argb: "FFE2E6E1" } }
        };
        if (rowNumber > 1) cell.alignment = { vertical: "top", wrapText: false };
      });
    });
    (formats.percentCols || []).forEach(index => { sheet.getColumn(index).numFmt = "0%"; });
    (formats.dateCols || []).forEach(index => { sheet.getColumn(index).numFmt = "yyyy-mm-dd"; });
    (formats.dateTimeCols || []).forEach(index => { sheet.getColumn(index).numFmt = "yyyy-mm-dd hh:mm"; });
    (formats.timeCols || []).forEach(index => { sheet.getColumn(index).numFmt = "hh:mm"; });
    (formats.numberCols || []).forEach(index => { sheet.getColumn(index).numFmt = "0.0"; });
    (formats.wrapCols || []).forEach(index => {
      sheet.getColumn(index).alignment = { vertical: "top", wrapText: true };
    });
    sheet.columns.forEach((column, index) => {
      const values = Array.isArray(column.values) ? column.values.slice(2) : [];
      const width = maxWidth(headers[index], values);
      column.width = Math.min(Math.max(width + 2, 10), formats.wrapCols?.includes(index + 1) ? 36 : 24);
    });
    if (rows.length) {
      sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } };
    }
  }

  function normalizeExportData(data = {}) {
    return {
      tasks: Array.isArray(data.tasks) ? data.tasks : [],
      schedules: Array.isArray(data.schedules) ? data.schedules : [],
      notes: Array.isArray(data.notes) ? data.notes : []
    };
  }

  function buildExportDataFromStore(store = {}) {
    const taskMap = new Map();
    const schedules = [];
    const notes = [];
    Object.entries(store || {}).forEach(([date, day]) => {
      if (!day || typeof day !== "object") return;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) return;
      if (day.note) notes.push({ date, note: String(day.note) });
      (day.entries || []).forEach(entry => {
        if (!entry || typeof entry !== "object") return;
        schedules.push({
          date,
          plannedDurationHours: Number(entry.end || 0) - Number(entry.start || 0),
          durationHours: Number(entry.end || 0) - Number(entry.start || 0),
          ...entry
        });
      });
      (day.tasks || []).forEach(task => {
        if (!task || !task.id || taskMap.has(task.id)) return;
        taskMap.set(task.id, {
          id: task.id,
          title: task.title,
          planDate: date,
          dueDate: task.dueDate,
          dueTime: task.dueTime,
          owner: task.owner,
          parentId: task.parentId || null,
          priority: task.priority,
          status: task.status,
          progress: task.progress,
          startedAt: task.startedAt || null,
          startOverrideAt: task.startOverrideAt || null,
          completedAt: task.completedAt || null,
          workHours: Number(task.workHours || 0),
          businessBackground: task.businessBackground || "",
          problemReason: task.problemReason || "",
          deliveryNote: task.deliveryNote || "",
          description: task.description || "",
          createdAt: task.createdAtIso || task.createdAt || null,
          updatedAt: task.updatedAt || null,
          recurrence: task.recurrence || null,
          recurrenceGroupId: task.recurrenceGroupId || null
        });
      });
    });
    return {
      tasks: [...taskMap.values()],
      schedules,
      notes
    };
  }

  function slimExportDataForExcel(data = {}) {
    const normalized = normalizeExportData(data);
    return {
      ...normalized,
      tasks: normalized.tasks.map(task => ({
        ...task,
        businessBackground: plainNote(task.businessBackground),
        deliveryNote: plainNote(task.deliveryNote),
        problemReason: clip(task.problemReason),
        description: clip(task.description)
      })),
      schedules: normalized.schedules.map(entry => ({
        ...entry,
        title: clip(entry.title),
        note: clip(entry.note),
        owner: clip(entry.owner)
      })),
      notes: normalized.notes.map(note => ({
        date: note.date,
        note: clip(note.note)
      }))
    };
  }

  function ensureXlsxPath(filePath) {
    const target = String(filePath || "");
    return /\.xlsx$/i.test(target) ? target : `${target}.xlsx`;
  }

  async function writeExcelFile(outputPath, data) {
    if (!ExcelJS?.Workbook) throw new Error("Excel 组件不可用");
    const payload = slimExportDataForExcel(data);
    if (!payload.tasks.length && !payload.schedules.length && !payload.notes.length) {
      throw new Error("没有可导出的任务或日程数据");
    }
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "今日日程";
    workbook.created = new Date();
    workbook.modified = new Date();

    addSheet(workbook, "任务清单", [
      "任务ID", "任务名称", "层级", "父任务ID", "责任人", "优先级", "状态", "进度",
      "计划归属日期", "截止日期", "截止时间", "实际开始", "实际完成/关闭", "投入工时",
      "业务背景", "问题原因", "详细计划/交付件", "任务说明", "每月重复", "重复至月份",
      "重复组ID", "创建时间", "最后更新时间"
    ], payload.tasks.map(task => [
      task.id, task.title, task.parentId ? "子任务" : "父任务", task.parentId || "", task.owner || "",
      priorityLabel(task.priority), statusLabel(task.status), Number(task.progress || 0) / 100,
      asDate(task.planDate), asDate(task.dueDate), task.dueTime || "", asDateTime(task.startedAt || task.startOverrideAt),
      asDateTime(task.completedAt), Number(task.workHours || 0), plainNote(task.businessBackground || ""),
      clip(task.problemReason || ""), plainNote(task.deliveryNote || ""), clip(task.description || ""),
      task.recurrence?.frequency === "monthly" ? "是" : "否", task.recurrence?.until || "",
      task.recurrenceGroupId || "", asDateTime(task.createdAt), asDateTime(task.updatedAt)
    ]), {
      percentCols: [8],
      dateCols: [9, 10],
      dateTimeCols: [12, 13, 22, 23],
      numberCols: [14],
      wrapCols: [15, 16, 17, 18]
    });

    addSheet(workbook, "日程记录", [
      "日期", "开始时间", "结束时间", "计划时长", "实际投入工时", "事项", "关联任务ID", "参会人", "备注", "颜色"
    ], payload.schedules.map(entry => [
      asDate(entry.date), decimalTime(entry.start), decimalTime(entry.end),
      Number(entry.plannedDurationHours || 0), Number(entry.durationHours || 0),
      entry.title || "", entry.taskId || "", entry.owner || "", entry.note || "", entry.color || ""
    ]), {
      dateCols: [1],
      timeCols: [2, 3],
      numberCols: [4, 5],
      wrapCols: [6, 8, 9]
    });

    addSheet(workbook, "每日备注", ["日期", "当天备注"], payload.notes.map(note => [
      asDate(note.date), note.note || ""
    ]), {
      dateCols: [1],
      wrapCols: [2]
    });

    const target = ensureXlsxPath(outputPath);
    const buffer = await workbook.xlsx.writeBuffer();
    return { target, buffer: Buffer.from(buffer), taskCount: payload.tasks.length, scheduleCount: payload.schedules.length };
  }

  return {
    plainNote,
    slimExportDataForExcel,
    buildExportDataFromStore,
    normalizeExportData,
    ensureXlsxPath,
    writeExcelFile,
    addSheet,
    asDate,
    asDateTime,
    decimalTime
  };
});
