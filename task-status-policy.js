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
    return status === "planned" || status === "in_progress" || status === TRACKING_STATUS;
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

  function scheduleOverviewKind({ taskStatus = "", investedHours = 0 } = {}) {
    if (investedHours > 0) return "actual";
    if (taskStatus === TRACKING_STATUS) return "tracking";
    return "planned";
  }

  function scheduleOverviewBadge(item = {}) {
    if (item.type === "meeting") return "会议";
    if (item.kind === "tracking") return "跟踪";
    if (item.kind === "actual") return "进行";
    return "计划";
  }

  function statusLabel(status) {
    return {
      unplanned: "未计划",
      planned: "计划中",
      in_progress: "进行中",
      tracking: "待跟踪",
      done: "已关闭",
      closed: "已关闭"
    }[status] || "计划中";
  }

  function listSideBadge(task = {}) {
    if (isEndedStatus(task.status)) {
      return { className: "status-mark closed", text: "关闭", title: "已关闭" };
    }
    if (isTrackingStatus(task)) {
      return { className: "status-mark tracking", text: "跟踪", title: "待跟踪" };
    }
    return null;
  }

  return {
    ENDED_STATUSES,
    TRACKING_STATUS,
    isEndedStatus,
    isTrackingStatus,
    isSchedulableStatus,
    followUpTaskTitle,
    buildFollowUpBusinessBackground,
    buildFollowUpTask,
    scheduleOverviewKind,
    scheduleOverviewBadge,
    statusLabel,
    listSideBadge
  };
});
