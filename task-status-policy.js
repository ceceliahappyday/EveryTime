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

  function isFollowUpPriority(task = {}) {
    return (task?.priority || "") === "follow_up";
  }

  /** 待跟踪页签：备忘提醒（status=tracking）+ 优先级「跟踪关注」且未结束 */
  function belongsInMemoList(task = {}) {
    if (!task || isEndedStatus(task.status)) return false;
    return isMemoReminder(task) || isFollowUpPriority(task);
  }

  function countsTowardWorkHours(taskOrStatus) {
    return !isMemoReminder(taskOrStatus) && !isEndedStatus(
      typeof taskOrStatus === "string" ? taskOrStatus : taskOrStatus?.status
    );
  }

  function stripTrackingTitleSuffix(title = "") {
    return String(title || "").trim().replace(/\s*·\s*跟踪\s*$/u, "").trim();
  }

  function followUpTaskTitle(sourceTitle = "") {
    const title = stripTrackingTitleSuffix(sourceTitle);
    return title || "后续事项";
  }

  /** List/card title: drop redundant 「· 跟踪」 when the side badge already says 跟踪. */
  function listDisplayTitle(taskOrTitle = "") {
    const raw = typeof taskOrTitle === "string" ? taskOrTitle : (taskOrTitle?.title || "");
    const cleaned = stripTrackingTitleSuffix(raw);
    return cleaned || String(raw || "").trim();
  }

  function buildFollowUpBusinessBackground(source = {}) {
    const title = stripTrackingTitleSuffix(source.title);
    const background = String(source.businessBackground || "").trim();
    if (title && background) return `${title}\n${background}`.slice(0, 500);
    return (title || background || "").slice(0, 500);
  }

  function resolveSourceParentId(source = {}) {
    return source.parentId || source.parentTaskId || source.parentTask || source.parent || "";
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
      parentId: resolveSourceParentId(source),
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

  function successorTaskTitle(sourceTitle = "") {
    const title = stripTrackingTitleSuffix(sourceTitle).replace(/\s*·\s*后续\s*$/u, "");
    return title ? `${title} · 后续` : "后续任务";
  }

  /** 关闭后新建后续：默认继承原任务优先级与上级；仅关注需用户勾选（只提醒、不排投入） */
  function buildSuccessorTask(source = {}, options = {}) {
    const opts = typeof options === "string" ? { dateKey: options } : (options || {});
    const now = new Date().toISOString();
    const closedAt = opts.closedAt || source.completedAt || now;
    const attentionOnly = opts.attentionOnly === true;
    const sourcePriority = source.priority || "general_daily";
    const workPriority = ["follow_up", "monthly_fixed"].includes(sourcePriority)
      ? "general_daily"
      : sourcePriority;
    const priority = attentionOnly ? "follow_up" : workPriority;
    const baseTitle = stripTrackingTitleSuffix(source.title).replace(/\s*·\s*后续\s*$/u, "");
    return {
      title: baseTitle || successorTaskTitle(source.title),
      dueDate: source.dueDate || "",
      dueTime: source.dueTime || "",
      owner: source.owner || "我",
      parentId: resolveSourceParentId(source),
      description: String(source.description || "").trim().slice(0, 240),
      priority,
      progress: 0,
      status: attentionOnly ? TRACKING_STATUS : "planned",
      startedAt: closedAt,
      startOverrideAt: closedAt,
      completedAt: "",
      businessBackground: buildFollowUpBusinessBackground(source),
      problemReason: String(source.problemReason || "").trim().slice(0, 500),
      deliveryNote: "",
      recurrence: null,
      recurrenceGroupId: "",
      successorFromTaskId: source.id || "",
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
      return { className: "status-mark tracking", text: "跟踪", title: "待跟踪（关注提醒，不计入投入）" };
    }
    return null;
  }

  return {
    ENDED_STATUSES,
    TRACKING_STATUS,
    isEndedStatus,
    isTrackingStatus,
    isMemoReminder,
    isFollowUpPriority,
    belongsInMemoList,
    countsTowardWorkHours,
    isSchedulableStatus,
    stripTrackingTitleSuffix,
    followUpTaskTitle,
    listDisplayTitle,
    successorTaskTitle,
    buildFollowUpBusinessBackground,
    buildFollowUpTask,
    buildSuccessorTask,
    buildWorkTodoFromMemo,
    scheduleOverviewKind,
    scheduleOverviewBadge,
    statusLabel,
    listSideBadge
  };
});
