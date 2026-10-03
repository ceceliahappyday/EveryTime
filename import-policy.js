(function (root) {
  function countPlannerRecords(data) {
    return Object.values(data || {}).reduce((sum, day) =>
      sum + (day?.tasks?.length || 0) + (day?.entries?.length || 0) + (day?.note ? 1 : 0), 0);
  }

  function isDayKeyedPlannerData(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) return false;
    return Object.values(data).every(day => {
      if (!day || typeof day !== "object") return false;
      if (day.tasks != null && !Array.isArray(day.tasks)) return false;
      if (day.entries != null && !Array.isArray(day.entries)) return false;
      if (day.note != null && typeof day.note !== "string") return false;
      return true;
    });
  }

  function ensureDay(result, dateKey) {
    if (!result[dateKey]) result[dateKey] = { tasks: [], entries: [], note: "" };
    return result[dateKey];
  }

  function plannerDataFromExport(payload) {
    const result = {};
    (payload.tasks || []).forEach(task => {
      const dateKey = task.planDate || task.dueDate || "";
      if (!dateKey || typeof dateKey !== "string") return;
      const day = ensureDay(result, dateKey);
      day.tasks.push({
        id: task.id,
        title: task.title || "未命名待办",
        dueDate: task.dueDate || dateKey,
        dueTime: task.dueTime || "18:00",
        owner: task.owner || "我",
        parentId: task.parentId || "",
        priority: task.priority || "general_daily",
        status: task.status || "planned",
        progress: Number(task.progress || 0),
        startedAt: task.startedAt || "",
        startOverrideAt: task.startOverrideAt || "",
        completedAt: task.completedAt || "",
        businessBackground: task.businessBackground || "",
        problemReason: task.problemReason || "",
        deliveryNote: task.deliveryNote || "",
        description: task.description || "",
        createdAtIso: task.createdAt || task.createdAtIso || "",
        updatedAt: task.updatedAt || "",
        recurrence: task.recurrence || null,
        recurrenceGroupId: task.recurrenceGroupId || ""
      });
    });
    (payload.schedules || []).forEach(entry => {
      const dateKey = entry.date;
      if (!dateKey || typeof dateKey !== "string") return;
      const day = ensureDay(result, dateKey);
      day.entries.push({
        id: entry.id || undefined,
        title: entry.title || "",
        start: Number(entry.start),
        end: Number(entry.end),
        note: entry.note || "",
        color: entry.color || "sage",
        entryType: entry.entryType || (entry.taskId ? "task_work" : "calendar"),
        taskId: entry.taskId || ""
      });
    });
    (payload.notes || []).forEach(item => {
      if (!item?.date || typeof item.date !== "string") return;
      ensureDay(result, item.date).note = item.note || "";
    });
    return result;
  }

  function parseImportPayload(raw) {
    let payload = raw;
    if (typeof raw === "string") {
      try {
        payload = JSON.parse(raw);
      } catch {
        return { ok: false, error: "文件不是有效的 JSON" };
      }
    }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return { ok: false, error: "备份文件格式无效" };
    }

    if (payload.format === "today-planner-backup" || payload.format === "everytime-cloud-backup") {
      if (!isDayKeyedPlannerData(payload.data)) {
        return { ok: false, error: "备份中的日程数据无效" };
      }
      return {
        ok: true,
        source: payload.format,
        data: payload.data,
        recordCount: Number.isFinite(payload.recordCount) ? payload.recordCount : countPlannerRecords(payload.data),
        exportedAt: payload.exportedAt || payload.uploadedAt || ""
      };
    }

    if (payload.format === "today-planner-export") {
      const data = plannerDataFromExport(payload);
      if (!isDayKeyedPlannerData(data)) {
        return { ok: false, error: "导出文件无法还原为日程数据" };
      }
      return {
        ok: true,
        source: payload.format,
        data,
        recordCount: countPlannerRecords(data),
        exportedAt: payload.exportedAt || ""
      };
    }

    if (isDayKeyedPlannerData(payload)) {
      return {
        ok: true,
        source: "planner-data",
        data: payload,
        recordCount: countPlannerRecords(payload),
        exportedAt: ""
      };
    }

    return { ok: false, error: "无法识别的备份格式，请选择 EveryTime 导出的 JSON 文件" };
  }

  const policy = {
    countPlannerRecords,
    isDayKeyedPlannerData,
    plannerDataFromExport,
    parseImportPayload
  };

  root.ImportPolicy = policy;
  if (typeof module !== "undefined" && module.exports) module.exports = policy;
})(typeof window === "undefined" ? globalThis : window);
