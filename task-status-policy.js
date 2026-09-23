(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.TaskStatusPolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  const ENDED_STATUSES = new Set(["done", "closed"]);
  const TRACKING_STATUS = "tracking";

  function isEndedStatus(status) {
    return ENDED_STATUSES.has(status);
  }

  function isTrackingStatus(taskOrStatus) {
    const status = typeof taskOrStatus === "string" ? taskOrStatus : taskOrStatus?.status;
    return status === TRACKING_STATUS;
  }

  function isSchedulableStatus(status) {
    // Memo reminders (tracking) are not work todos and cannot take task_work investment.
    return status === "planned" || status === "in_progress";
  }

  function isMemoReminder(taskOrStatus) {
    return isTrackingStatus(taskOrStatus);
  }

  function countsTowardWorkHours(taskOrStatus) {
    return !isMemoReminder(taskOrStatus) && !isEndedStatus(
      typeof taskOrStatus === "string" ? taskOrStatus : taskOrStatus?.status
    );
  }

  function followUpTaskTitle(sourceTitle = "") {
    const title = String(sourceTitle || "").trim().replace(/\s*·\s*跟踪\s*$/u, "");
    return title || "后续事项";
  }

  function buildFollowUpBusinessBackground(source = {}) {
    const title = String(source.title || "").trim().replace(/\s*·\s*跟踪\s*$/u, "");
    const background = String(source.businessBackground || "").trim();
    if (title && background) return `${title}\n${background}`.slice(0, 500);
    return (title || background || "").slice(0, 500);
  }

  function buildFollowUpTask(source = {}, options = {}) {
    const opts = typeof options === "string" ? { dateKey: options } : (options || {});
    const now = new Date().toISOString();
    const closedAt = opts.closedAt || source.completedAt || now;
    return {
      title: followUpTaskTitle(source.title),
      dueDate: "",
      dueTime: "",
      owner: source.owner || "我",
      parentId: source.parentId || "",
      description: String(source.description || "").trim().slice(0, 240),
      priority: "follow_up",
      progress: 0,
      status: TRACKING_STATUS,
      startedAt: closedAt,
      startOverrideAt: closedAt,
      completedAt: "",
      businessBackground: buildFollowUpBusinessBackground(source),
      problemReason: String(source.problemReason || "").trim().slice(0, 500),
      deliveryNote: "",
      recurrence: null,
      recurrenceGroupId: "",
      followUpFromTaskId: source.id || "",
      createdAtIso: now,
      updatedAt: now
    };
  }

  function buildWorkTodoFromMemo(memo = {}, options = {}) {
    const opts = options || {};
    const now = new Date().toISOString();
    const title = String(memo.title || "").trim() || "后续事项";
    return {
      title,
      dueDate: opts.dueDate || "",
      dueTime: opts.dueTime || "",
      owner: memo.owner || "我",
      parentId: memo.parentId || "",
      description: String(memo.description || "").trim().slice(0, 240),
      // Memo is reminder-only; spawned work returns to normal todo priority.
      priority: memo.priority === "follow_up" ? "general_daily" : (memo.priority || "general_daily"),
      progress: 0,
      status: "planned",
      startedAt: "",
      startOverrideAt: "",
      completedAt: "",
      businessBackground: String(memo.businessBackground || "").trim().slice(0, 800),
      problemReason: "",
      deliveryNote: "",
      recurrence: null,
      recurrenceGroupId: "",
      memoFromTaskId: memo.id || "",
      createdAtIso: now,
      updatedAt: now
    };
  }

  function scheduleOverviewKind({ taskStatus = "", investedHours = 0 } = {}) {
    // Memo reminders never count as actual work investment on themselves.
    if (taskStatus === TRACKING_STATUS) return "tracking";
    if (investedHours > 0) return "actual";
    return "planned";
  }

  function scheduleOverviewBadge(item = {}) {
    if (item.type === "meeting") return "会议";
    if (item.kind === "tracking") return "备忘";
    if (item.kind === "actual") return "进行";
    return "计划";
  }

  function statusLabel(status) {
    return {
      unplanned: "未计划",
      planned: "计划中",
      in_progress: "进行中",
      tracking: "备忘提醒",
      done: "已关闭",
      closed: "已关闭"
    }[status] || "计划中";
  }

  function listSideBadge(task = {}) {
    if (isEndedStatus(task.status)) {
      return { className: "status-mark closed", text: "关闭", title: "已关闭" };
    }
    if (isTrackingStatus(task)) {
      return { className: "status-mark tracking", text: "备忘", title: "备忘提醒（不计入投入）" };
    }
    return null;
  }

  return {
    ENDED_STATUSES,
    TRACKING_STATUS,
    isEndedStatus,
    isTrackingStatus,
    isMemoReminder,
    countsTowardWorkHours,
    isSchedulableStatus,
    followUpTaskTitle,
    buildFollowUpBusinessBackground,
    buildFollowUpTask,
    buildWorkTodoFromMemo,
    scheduleOverviewKind,
    scheduleOverviewBadge,
    statusLabel,
    listSideBadge
  };
});
