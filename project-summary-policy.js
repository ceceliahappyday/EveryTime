(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.ProjectSummaryPolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  function summarizeProject({ parent, children = [], getTaskDuration = () => 0 }) {
    const taskCount = children.length;
    const doneCount = children.filter(task => ["done", "closed"].includes(task.status)).length;
    const statusCounts = children.reduce((counts, task) => {
      const status = normalizeStatus(task.status);
      counts[status] += 1;
      return counts;
    }, { unplanned: 0, planned: 0, in_progress: 0, ended: 0 });
    const totalHours = children.reduce((sum, task) => sum + Number(getTaskDuration(task.id) || 0), 0);
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
      firstStartIso: starts[0] || "",
      lastCompletedIso: completions.at(-1) || ""
    };
  }

  function projectProgressPercent(summary) {
    if (!summary?.taskCount) return 0;
    return Math.round((summary.doneCount / summary.taskCount) * 100);
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
    classifyProjectStatus
  };
});
