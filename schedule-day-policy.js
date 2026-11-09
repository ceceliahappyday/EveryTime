(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.ScheduleDayPolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  /**
   * Calendar / day scope: show tasks with invest on the day, due on the day,
   * started on the day, completed on the day, or inbox rows stored without due date.
   */
  function taskVisibleInDateScope({
    task,
    dateKey,
    storageKey = "",
    hasInvestOnDate = false,
    startedOnDate = false,
    completedOnDate = false,
    dueOnDate = false,
    isEndedStatus = () => false,
    isHiddenFuture = () => false
  } = {}) {
    if (!task || !dateKey) return false;
    if (isHiddenFuture(task)) return false;
    if (hasInvestOnDate) return true;
    if (dueOnDate) return true;
    if (startedOnDate) return true;
    if (completedOnDate) return true;
  // Legacy inbox: task object kept under a day bucket with no due date while still open.
    return storageKey === dateKey && !String(task.dueDate || "").trim() && !isEndedStatus(task.status);
  }

  /** Week/month chip list: only open planned items count as「计划」for that due date. */
  function taskDuePlannedOnDate(task, dateKey, { isEndedStatus = () => false, isHiddenFuture = () => false } = {}) {
    if (!task || String(task.dueDate || "") !== dateKey) return false;
    if (isHiddenFuture(task)) return false;
    return !isEndedStatus(task.status);
  }

  function completedDateKey(task, toDateKey) {
    if (!task?.completedAt || typeof toDateKey !== "function") return "";
    return toDateKey(new Date(task.completedAt));
  }

  /** Prefer historical anchors; never assume「today」when closing backlog tasks. */
  function pickDefaultCompletionIso(task = {}, hints = {}) {
    if (task.completedAt) return task.completedAt;
    if (hints.lastInvestEndIso) return hints.lastInvestEndIso;
    if (task.dueDate && typeof hints.dueDateTimeIso === "function") {
      const dueIso = hints.dueDateTimeIso(task);
      if (dueIso) return dueIso;
    }
    if (task.startOverrideAt) return task.startOverrideAt;
    if (task.startedAt) return task.startedAt;
    return "";
  }

  return {
    taskVisibleInDateScope,
    taskDuePlannedOnDate,
    completedDateKey,
    pickDefaultCompletionIso
  };
});
