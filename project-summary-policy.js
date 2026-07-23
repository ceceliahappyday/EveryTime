(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.ProjectSummaryPolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  function summarizeProject({ parent, children = [], getTaskDuration = () => 0, getTaskScheduledHours = () => 0 }) {
    const taskCount = children.length;
    const doneCount = children.filter(task => ["done", "closed"].includes(task.status)).length;
    const statusCounts = children.reduce((counts, task) => {
      const status = normalizeStatus(task.status);
      counts[status] += 1;
      return counts;
    }, { unplanned: 0, planned: 0, in_progress: 0, ended: 0 });
    const totalHours = children.reduce((sum, task) => sum + Number(getTaskDuration(task.id) || 0), 0);
    const scheduledHours = children.reduce((sum, task) => sum + Number(getTaskScheduledHours(task.id) || 0), 0);
    const taskProgresses = children.map(task => taskProgressPercent({
      status: task.status,
      investedHours: getTaskDuration(task.id),
      scheduledHours: getTaskScheduledHours(task.id)
    }));
    const starts = children
      .map(task => task.startOverrideAt || task.startedAt)
      .filter(Boolean)
      .sort();
    const completions = children
      .map(task => task.completedAt)
      .filter(Boolean)
      .sort();
    return {
      parent,
      children,
      status: classifyProjectStatus(children.length ? children : [parent]),
      statusCounts,
      taskCount,
      doneCount,
      totalHours,
      scheduledHours,
      taskProgresses,
      firstStartIso: starts[0] || "",
      lastCompletedIso: completions.at(-1) || ""
    };
  }

  function projectProgressPercent(summary) {
    if (!summary?.taskCount) return 0;
    return Math.round((summary.taskProgresses || []).reduce((sum, progress) => sum + progress, 0) / summary.taskCount);
  }

  function taskProgressPercent({ status, investedHours = 0, scheduledHours = 0 }) {
    if (status === "done" || status === "closed") return 100;
    if (!investedHours || !scheduledHours) return 0;
    return Math.round(Math.min(95, (investedHours / scheduledHours) * 100));
  }

  function normalizeStatus(status) {
    if (status === "in_progress") return "in_progress";
    if (status === "done" || status === "closed") return "ended";
    if (status === "unplanned") return "unplanned";
    return "planned";
  }

  function classifyProjectStatus(tasks = []) {
    const statuses = tasks.map(task => normalizeStatus(task.status));
    if (statuses.includes("in_progress")) return "in_progress";
    if (statuses.length && statuses.every(status => status === "ended")) return "ended";
    if (statuses.includes("planned")) return "planned";
    return "unplanned";
  }

  return {
    summarizeProject,
    projectProgressPercent,
    taskProgressPercent,
    classifyProjectStatus
  };
});
