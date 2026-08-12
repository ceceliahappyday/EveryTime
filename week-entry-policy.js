(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.WeekEntryPolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  function sortEntries(entries = []) {
    return [...entries].sort((a, b) => (a.start - b.start) || (a.end - b.end) || String(a.id || "").localeCompare(String(b.id || "")));
  }

  function entryTitle(entry, task) {
    return task?.title || entry?.title || "未命名投入";
  }

  function parentPath(task, tasks = [], separator = " › ") {
    if (!task) return "";
    const taskOptionPolicy = typeof globalThis !== "undefined" ? globalThis.TaskOptionPolicy : null;
    const full = String(taskOptionPolicy?.taskHierarchyPath?.({ task, tasks, separator }) || task.title || "");
    const parts = full.split(separator);
    parts.pop();
    return parts.join(separator);
  }

  function durationHours(entry) {
    const hours = Number(entry?.end) - Number(entry?.start);
    return Number.isFinite(hours) && hours > 0 ? hours : 0;
  }

  return { sortEntries, entryTitle, parentPath, durationHours };
});
