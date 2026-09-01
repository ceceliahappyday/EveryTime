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
    const title = String(sourceTitle || "").trim();
    if (!title) return "后续跟踪";
    if (/跟踪/.test(title)) return title;
    return `${title} · 跟踪`;
  }

  function buildFollowUpTask(source = {}, dateKey = "") {
    const now = new Date().toISOString();
    const dueDate = dateKey || source.dueDate || "";
    return {
      title: followUpTaskTitle(source.title),
      dueDate,
      dueTime: source.dueTime || "18:00",
      owner: source.owner || "我",
      parentId: source.parentId || "",
      description: source.description || "",
      priority: source.priority === "paused" ? "follow_up" : (source.priority || "follow_up"),
      progress: 0,
      status: TRACKING_STATUS,
      startedAt: "",
      startOverrideAt: "",
      completedAt: "",
      businessBackground: source.businessBackground || "",
      problemReason: source.problemReason || "",
      deliveryNote: source.deliveryNote || "",
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
      tracking: "跟踪中",
      done: "已完成",
      closed: "已关闭"
    }[status] || "计划中";
  }

  return {
    ENDED_STATUSES,
    TRACKING_STATUS,
    isEndedStatus,
    isTrackingStatus,
    isSchedulableStatus,
    followUpTaskTitle,
    buildFollowUpTask,
    scheduleOverviewKind,
    scheduleOverviewBadge,
    statusLabel
  };
});
