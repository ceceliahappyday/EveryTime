(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.TaskOptionPolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  function shouldIncludeEntryTaskOption({ task, isHiddenFutureRecurringInstance = false, isCurrentLinkedTask = false }) {
    if (!task) return false;
    if (isCurrentLinkedTask) return true;
    if (["done", "closed"].includes(task.status)) return false;
    if (isHiddenFutureRecurringInstance) return false;
    return true;
  }

  function entryTaskOptionLabel({ task, selectedDate, hasChildren = false }) {
    const kind = hasChildren ? "主计划" : "待办";
    const date = task?.dueDate ? (task.dueDate === selectedDate ? "今天" : task.dueDate.slice(5)) : "未计划";
    return `${kind} · ${date} · ${task?.title || "未命名任务"}`;
  }

  return {
    shouldIncludeEntryTaskOption,
    entryTaskOptionLabel
  };
});
