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

  function dedupeRecurringTasksForDisplay(tasks = []) {
    const seen = new Map();
    const aliases = new Map();
    const kept = tasks.filter(task => {
      if (task?.recurrence?.frequency !== "monthly" || !task.dueDate) return true;
      const title = String(task.title || "").trim().toLocaleLowerCase();
      const key = `${title}|${task.dueDate.slice(0, 7)}`;
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

  return {
    currentMonthKey,
    dedupeRecurringTasksForDisplay,
    shouldGenerateRecurringMonth,
    isFutureRecurringInstance
  };
});
