(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.RecurringPolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  function currentMonthKey(now = new Date()) {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  function shouldGenerateRecurringMonth({ targetMonth, currentMonth, startMonth, untilMonth }) {
    if (!targetMonth || !currentMonth || !startMonth) return false;
    if (targetMonth !== currentMonth) return false;
    if (targetMonth < startMonth) return false;
    if (untilMonth && targetMonth > untilMonth) return false;
    return true;
  }

  function isFutureRecurringInstance(taskMonth, currentMonth) {
    return !!taskMonth && !!currentMonth && taskMonth > currentMonth;
  }

  function recurringGroupKey(task) {
    if (!task) return "";
    if (task.recurrenceGroupId) return String(task.recurrenceGroupId);
    if (task.recurrence?.frequency === "monthly") return String(task.id || "");
    return "";
  }

  function isMonthlyRecurringTask(task) {
    return task?.recurrence?.frequency === "monthly" && !!task.dueDate;
  }

  function pickCanonicalRecurringTask(instances = [], currentMonth = "") {
    if (!instances.length) return null;
    const ranked = [...instances].sort((a, b) => {
      const aMonth = a.dueDate?.slice(0, 7) || "";
      const bMonth = b.dueDate?.slice(0, 7) || "";
      const aCurrent = Number(aMonth === currentMonth);
      const bCurrent = Number(bMonth === currentMonth);
      if (aCurrent !== bCurrent) return bCurrent - aCurrent;
      const aFuture = Number(!!currentMonth && aMonth > currentMonth);
      const bFuture = Number(!!currentMonth && bMonth > currentMonth);
      if (aFuture !== bFuture) return aFuture - bFuture;
      const statusRank = task => ({ in_progress: 0, planned: 1, tracking: 2, done: 3, closed: 4 }[task.status] ?? 5);
      const byStatus = statusRank(a) - statusRank(b);
      if (byStatus) return byStatus;
      return String(b.dueDate || "").localeCompare(String(a.dueDate || "")) || String(a.id).localeCompare(String(b.id));
    });
    return ranked[0];
  }

  function canonicalRecurringKeepIds(tasks = [], currentMonth = "") {
    const groups = new Map();
    tasks.forEach(task => {
      if (!isMonthlyRecurringTask(task)) return;
      const key = recurringGroupKey(task);
      if (!key) return;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(task);
    });
    const keepIds = new Set();
    const aliases = new Map();
    groups.forEach(instances => {
      const keep = pickCanonicalRecurringTask(instances, currentMonth);
      if (!keep) return;
      keepIds.add(keep.id);
      instances.forEach(task => {
        if (task.id !== keep.id) aliases.set(task.id, keep.id);
      });
    });
    return { keepIds, aliases };
  }

  function filterCanonicalRecurringTasks(tasks = [], currentMonth = "") {
    const { keepIds, aliases } = canonicalRecurringKeepIds(tasks, currentMonth);
    return tasks
      .filter(task => !isMonthlyRecurringTask(task) || keepIds.has(task.id))
      .map(task => (aliases.has(task.parentId) ? { ...task, parentId: aliases.get(task.parentId) } : task));
  }

  function isNonCanonicalRecurringInstance(task, keepIds) {
    if (!isMonthlyRecurringTask(task) || !recurringGroupKey(task)) return false;
    if (!keepIds) return false;
    return !keepIds.has(task.id);
  }

  function dedupeRecurringTasksForDisplay(tasks = []) {
    const seen = new Map();
    const aliases = new Map();
    const kept = tasks.filter(task => {
      if (!isMonthlyRecurringTask(task)) return true;
      const key = `${recurringGroupKey(task) || String(task.title || "").trim().toLocaleLowerCase()}|${task.dueDate.slice(0, 7)}`;
      if (seen.has(key)) {
        aliases.set(task.id, seen.get(key));
        return false;
      }
      seen.set(key, task.id);
      return true;
    });
    return kept.map(task => {
      const parentId = aliases.get(task.parentId);
      if (!parentId) return task;
      return { ...task, parentId };
    });
  }

  function dedupeRecurringTasksForProject(tasks = [], currentMonth = "") {
    return filterCanonicalRecurringTasks(tasks, currentMonth);
  }

  return {
    currentMonthKey,
    dedupeRecurringTasksForDisplay,
    dedupeRecurringTasksForProject,
    filterCanonicalRecurringTasks,
    canonicalRecurringKeepIds,
    isNonCanonicalRecurringInstance,
    isMonthlyRecurringTask,
    recurringGroupKey,
    pickCanonicalRecurringTask,
    shouldGenerateRecurringMonth,
    isFutureRecurringInstance
  };
});
