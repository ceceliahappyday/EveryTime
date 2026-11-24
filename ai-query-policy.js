(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.AiQueryPolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  function roundHours(value) {
    const num = Number(value) || 0;
    return Number(num.toFixed(2));
  }

  function isMeetingEntry(entry = {}) {
    return Boolean(
      entry.isMeeting
      || entry.entryType === "calendar"
      || entry.category === "meeting"
    );
  }

  function isClosedStatus(status = "") {
    return ["done", "closed"].includes(String(status || ""));
  }

  function buildAiMetrics(context = {}) {
    const entries = Array.isArray(context.calendarEntries) ? context.calendarEntries : [];
    let taskWorkHours = 0;
    let meetingHours = 0;
    let taskWorkEntryCount = 0;
    let meetingEntryCount = 0;
    entries.forEach(entry => {
      const hours = roundHours(entry.hours);
      if (isMeetingEntry(entry)) {
        meetingHours += hours;
        meetingEntryCount += 1;
      } else {
        taskWorkHours += hours;
        taskWorkEntryCount += 1;
      }
    });
    taskWorkHours = roundHours(taskWorkHours);
    meetingHours = roundHours(meetingHours);
    const totalInvestedHours = roundHours(taskWorkHours + meetingHours);
    const meetingSharePercent = totalInvestedHours > 0
      ? roundHours((meetingHours / totalInvestedHours) * 100)
      : 0;
    const taskWorkSharePercent = totalInvestedHours > 0
      ? roundHours((taskWorkHours / totalInvestedHours) * 100)
      : 0;
    const tasks = Array.isArray(context.tasks) ? context.tasks : [];
    const openTasks = tasks.filter(task => !isClosedStatus(task.status));
    const periodStart = context.period?.start || "";
    const periodEnd = context.period?.end || "";
    const createdInPeriodCount = tasks.filter(task => {
      const created = createdDateKey(task.createdAtIso || task.createdAt);
      if (!created) return false;
      if (periodStart && created < periodStart) return false;
      if (periodEnd && created > periodEnd) return false;
      return true;
    }).length;
    return {
      period: context.period || {},
      totalInvestedHours,
      taskWorkHours,
      meetingHours,
      meetingSharePercent,
      taskWorkSharePercent,
      taskCount: tasks.length,
      openTaskCount: openTasks.length,
      createdInPeriodCount,
      taskWorkEntryCount,
      meetingEntryCount
    };
  }

  function classifyAiIntent(question = "") {
    const q = String(question || "").trim();
    if (!q) return "summary";
    if (/截图|识图|从图片|附加图片/.test(q)) return "screenshot";
    const wantsSummary = /总结|汇报|完成情况|工作小结|点评|综述/.test(q);
    const wantsList = /未完成|列出|清单|有哪些任务|哪些任务|任务明细/.test(q);
    const wantsStats = /多少小时|总投入|投入时长|工时汇总|统计.*(?:工时|投入|小时)|(?:工时|投入|小时).*(?:多少|总计|合计)|会议.*小时|小时.*会议|工作时长|投入多少|占比|比例/.test(q);
    if (wantsStats && !wantsSummary) return "stats";
    if (wantsList && !wantsSummary) return "list";
    if (wantsSummary) return "summary";
    if (/(小时|工时|投入|占比|比例)/.test(q)) return "stats";
    if (wantsList) return "list";
    return "summary";
  }

  function statusLabel(status = "") {
    const map = {
      planned: "未计划/计划中",
      in_progress: "进行中",
      done: "已完成",
      closed: "已关闭"
    };
    return map[status] || String(status || "");
  }

  function buildStatsTables(context = {}) {
    const tables = [];
    const entries = Array.isArray(context.calendarEntries) ? context.calendarEntries : [];
    const meetingRows = entries
      .filter(entry => isMeetingEntry(entry) && Number(entry.hours) > 0)
      .map(entry => [
        entry.date || "",
        entry.title || "",
        Number(entry.hours) || 0,
        entry.note || ""
      ]);
    if (meetingRows.length) {
      tables.push({
        name: "会议投入明细",
        headers: ["日期", "会议", "投入工时", "备注"],
        rows: meetingRows
      });
    }
    const workRows = entries
      .filter(entry => !isMeetingEntry(entry) && Number(entry.hours) > 0)
      .map(entry => [
        entry.date || "",
        entry.title || "",
        Number(entry.hours) || 0,
        entry.note || ""
      ]);
    if (workRows.length) {
      tables.push({
        name: "任务工作投入明细",
        headers: ["日期", "事项", "投入工时", "备注"],
        rows: workRows
      });
    }
    return tables;
  }

  /** Offline / test helper only — UI answers always go through the model. */
  function formatLocalStatsAnswer(metrics = {}, context = {}, question = "") {
    const m = metrics || buildAiMetrics(context);
    const start = m.period?.start || context.period?.start || "";
    const end = m.period?.end || context.period?.end || "";
    const range = start && end ? `${start} 至 ${end}` : "当前选择区间";
    const q = String(question || "");
    const wantsShare = /占比|比例|百分比/.test(q);
    const lines = wantsShare
      ? [
        `统计区间：${range}`,
        `会议投入占比：${m.meetingSharePercent}%（${m.meetingHours} / ${m.totalInvestedHours} 小时）`,
        `任务工作占比：${m.taskWorkSharePercent}%（${m.taskWorkHours} / ${m.totalInvestedHours} 小时）`
      ]
      : [
        `统计区间：${range}`,
        `工作时长总投入：${m.totalInvestedHours} 小时`,
        `其中会议投入：${m.meetingHours} 小时（占比 ${m.meetingSharePercent}%）`,
        `任务工作投入：${m.taskWorkHours} 小时（占比 ${m.taskWorkSharePercent}%）`
      ];
    return { displayText: lines.join("\n").trim(), tables: buildStatsTables(context), metrics: m };
  }

  function slimConversation(messages = [], limit = 6) {
    return (Array.isArray(messages) ? messages : [])
      .filter(item => item && !item.pending && String(item.text || "").trim())
      .slice(-limit)
      .map(item => ({
        role: item.role === "assistant" ? "assistant" : "user",
        text: String(item.text || "").trim().slice(0, 2000)
      }));
  }

  function formatLocalListAnswer(context = {}, question = "") {
    const tasks = Array.isArray(context.tasks) ? context.tasks : [];
    const openOnly = /未完成/.test(String(question || ""));
    const list = openOnly
      ? tasks.filter(task => !isClosedStatus(task.status))
      : tasks;
    const start = context.period?.start || "";
    const end = context.period?.end || "";
    const label = openOnly ? "未完成任务" : "任务明细";
    if (!list.length) {
      return {
        displayText: `在 ${start || "起始"} 至 ${end || "结束"} 区间内，没有${openOnly ? "未完成" : ""}任务。`,
        tables: []
      };
    }
    const sorted = [...list].sort((a, b) => String(a.dueDate || "9999").localeCompare(String(b.dueDate || "9999")));
    const lines = [
      `${label}共 ${sorted.length} 项（区间 ${start} 至 ${end}）：`,
      ...sorted.slice(0, 40).map((task, index) => (
        `${index + 1}. ${task.title || "未命名"} · ${statusLabel(task.status)} · 截止 ${task.dueDate || "无"} · 投入 ${roundHours(task.actualHours)}h`
      ))
    ];
    if (sorted.length > 40) lines.push(`…其余 ${sorted.length - 40} 项见表格。`);
    const tables = [{
      name: label.slice(0, 31),
      headers: ["任务", "状态", "优先级", "责任人", "截止日期", "计划工时", "投入工时"],
      rows: sorted.map(task => [
        task.title || "",
        statusLabel(task.status),
        task.priority || "",
        task.owner || "",
        task.dueDate || "",
        Number(task.scheduledHours || 0),
        Number(task.actualHours || 0)
      ])
    }];
    return { displayText: lines.join("\n"), tables };
  }

  function parseDateKey(dateKey = "") {
    const match = String(dateKey || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function toDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function startOfWeekMonday(date) {
    const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = next.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    next.setDate(next.getDate() + diff);
    return next;
  }

  function addDays(date, days) {
    const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    next.setDate(next.getDate() + days);
    return next;
  }

  /** Map 本周/上周/本月 etc. to concrete date keys for scoped queries. */
  function resolveRelativePeriod(question = "", todayKey = "") {
    const q = String(question || "");
    const today = parseDateKey(todayKey) || new Date();
    if (/本周|这周|这一周|这星期|本星期/.test(q)) {
      const start = startOfWeekMonday(today);
      const end = addDays(start, 6);
      return { start: toDateKey(start), end: toDateKey(end), label: "本周" };
    }
    if (/上周|上一周|上星期/.test(q)) {
      const thisMonday = startOfWeekMonday(today);
      const start = addDays(thisMonday, -7);
      const end = addDays(start, 6);
      return { start: toDateKey(start), end: toDateKey(end), label: "上周" };
    }
    if (/本月|这个月|当月/.test(q)) {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { start: toDateKey(start), end: toDateKey(end), label: "本月" };
    }
    if (/上月|上个月/.test(q)) {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: toDateKey(start), end: toDateKey(end), label: "上月" };
    }
    return null;
  }

  function createdDateKey(value = "") {
    const text = String(value || "").trim();
    if (!text) return "";
    const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
    const date = new Date(text);
    return Number.isNaN(date.getTime()) ? "" : toDateKey(date);
  }

  function slimContextForLlm(context = {}, metrics = null, conversation = []) {
    const m = metrics || buildAiMetrics(context);
    const tasks = Array.isArray(context.tasks) ? context.tasks : [];
    const entries = Array.isArray(context.calendarEntries) ? context.calendarEntries : [];
    const workLogs = entries
      .filter(entry => Number(entry.hours) > 0 || entry.date)
      .slice(0, 220)
      .map(entry => ({
        id: entry.id || "",
        date: entry.date || "",
        title: entry.title || "",
        hours: Number(entry.hours || 0),
        start: entry.start || "",
        end: entry.end || "",
        kind: isMeetingEntry(entry) ? "meeting" : "task_work",
        entryType: entry.entryType || "",
        category: entry.category || "",
        owner: entry.owner || "",
        note: entry.note || "",
        taskId: entry.taskId || "",
        taskTitle: entry.taskTitle || ""
      }));
    return {
      period: context.period || {},
      metrics: m,
      fieldGuide: {
        createdAtIso: "任务创建时间（ISO），统计新增任务用这个",
        createdAt: "仅界面显示的时分，不是完整创建日",
        dueDate: "目标完成日，不是工时发生日",
        workLogsDate: "工时/会议发生日期（按天）",
        workSessions: "任务在 period 内的投入时段明细",
        actualHours: "当前 period 内该任务投入合计，不是全生命周期",
        attentionOnly: "仅关注标记，不是普通可关闭待办",
        setupIncomplete: "信息未补全的草稿任务",
        parentId_parentTitle: "任务层级",
        businessBackground_deliveryNote_problemReason: "任务背景/交付/问题说明（已截断）"
      },
      conversation: slimConversation(conversation),
      tasks: tasks.slice(0, 120).map(task => ({
        id: task.id || "",
        title: task.title || "",
        status: task.status || "",
        priority: task.priority || "",
        owner: task.owner || "",
        category: task.category || "",
        description: task.description || "",
        dueDate: task.dueDate || "",
        dueTime: task.dueTime || "",
        parentId: task.parentId || "",
        parentTitle: task.parentTitle || "",
        attentionOnly: Boolean(task.attentionOnly),
        setupIncomplete: Boolean(task.setupIncomplete),
        progress: Number(task.progress || 0),
        startedAt: task.startedAt || "",
        createdAtIso: task.createdAtIso || "",
        createdDate: createdDateKey(task.createdAtIso || task.createdAt),
        updatedAt: task.updatedAt || "",
        completedAt: task.completedAt || "",
        businessBackground: task.businessBackground || "",
        problemReason: task.problemReason || "",
        deliveryNote: task.deliveryNote || "",
        recurrence: task.recurrence || null,
        recurrenceGroupId: task.recurrenceGroupId || "",
        followUpFromTaskId: task.followUpFromTaskId || "",
        successorFromTaskId: task.successorFromTaskId || "",
        scheduledHours: Number(task.scheduledHours || 0),
        actualHours: Number(task.actualHours || 0),
        scheduleCount: Number(task.scheduleCount || 0),
        workSessions: Array.isArray(task.notes)
          ? task.notes.slice(0, 40).map(note => ({
            date: note.date || "",
            start: note.start || "",
            end: note.end || "",
            hours: Number(note.hours || 0),
            note: note.note || ""
          }))
          : []
      })),
      workLogs,
      meetings: workLogs.filter(item => item.kind === "meeting").slice(0, 100),
      dayNotes: Array.isArray(context.dayNotes) ? context.dayNotes.slice(0, 40) : []
    };
  }

  return {
    roundHours,
    isMeetingEntry,
    buildAiMetrics,
    classifyAiIntent,
    buildStatsTables,
    formatLocalStatsAnswer,
    formatLocalListAnswer,
    slimConversation,
    resolveRelativePeriod,
    createdDateKey,
    slimContextForLlm
  };
});
