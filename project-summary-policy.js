(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.ProjectSummaryPolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  function summarizeProject({ parent, children = [], getTaskDuration = () => 0 }) {
    const taskCount = children.length;
    const doneCount = children.filter(task => ["done", "closed"].includes(task.status)).length;
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

  return {
    summarizeProject,
    projectProgressPercent
  };
});
