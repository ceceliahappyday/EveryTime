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

  function formatDecimalHour(value, formatTime) {
    const hour = Number(value);
    if (!Number.isFinite(hour)) return "";
    return typeof formatTime === "function" ? formatTime(hour) : String(hour);
  }

  function formatScheduleTimeRange({ start, end, dueTime = "" } = {}, formatTime) {
    const startDec = Number(start);
    const endDec = Number(end);
    if (Number.isFinite(startDec) && Number.isFinite(endDec) && endDec > startDec) {
      return `${formatDecimalHour(startDec, formatTime)}-${formatDecimalHour(endDec, formatTime)}`;
    }
    if (Number.isFinite(startDec) && startDec < 48) {
      return formatDecimalHour(startDec, formatTime);
    }
    const due = String(dueTime || "").trim();
    if (/^\d{1,2}:\d{2}/.test(due)) return due.slice(0, 5);
    return "";
  }

  return { sortEntries, entryTitle, parentPath, durationHours, formatScheduleTimeRange };
});
