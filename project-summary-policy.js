(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.ProjectSummaryPolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  function summarizeProject({ parent, children = [], summaryTasks = children, getTaskDuration = () => 0, getTaskScheduledHours = () => 0 }) {
    const taskCount = summaryTasks.length;
    const doneCount = summaryTasks.filter(task => ["done", "closed"].includes(task.status)).length;
    const statusCounts = summaryTasks.reduce((counts, task) => {
      const status = statusForTask(task);
      counts[status] += 1;
      return counts;
    }, { unplanned: 0, planned: 0, in_progress: 0, ended: 0 });
    const totalHours = summaryTasks.reduce((sum, task) => sum + Number(getTaskDuration(task.id) || 0), 0);
    const scheduledHours = summaryTasks.reduce((sum, task) => sum + Number(getTaskScheduledHours(task.id) || 0), 0);
    const taskProgresses = summaryTasks.map(task => taskProgressPercent({
      status: task.status,
      investedHours: getTaskDuration(task.id),
      scheduledHours: getTaskScheduledHours(task.id)
    }));
    const starts = summaryTasks
      .map(task => task.startOverrideAt || task.startedAt)
      .filter(Boolean)
      .sort();
    const completions = summaryTasks
      .map(task => task.completedAt)
      .filter(Boolean)
      .sort();
    return {
      parent,
      children,
      summaryTasks,
      status: classifyProjectStatus(summaryTasks.length ? summaryTasks : [parent]),
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

  /**
   * Leaf/parent plan hours for progress must be exclusive to the task, not
   * “create→due 工作日总时长”. Parallel tasks would otherwise each claim the
   * same 8h day. Prefer explicit estimate, else this task’s scheduled blocks.
   */
  function resolvePlanHours({ estimateHours = 0, scheduledHours = 0, planHours = 0 } = {}) {
    const estimate = Math.max(0, Number(estimateHours) || 0);
    if (estimate > 0) return estimate;
    const scheduled = Math.max(0, Number(scheduledHours) || 0);
    if (scheduled > 0) return scheduled;
    // Legacy callers may still pass planHours; keep as last resort only.
    return Math.max(0, Number(planHours) || 0);
  }

  function taskProgressPercent({ status, investedHours = 0, scheduledHours = 0, planHours = 0, estimateHours = 0 }) {
    if (["done", "closed", "ended"].includes(status)) return 100;
    const invested = Math.max(0, Number(investedHours) || 0);
    const plan = resolvePlanHours({ estimateHours, scheduledHours, planHours });
    if (!invested || !plan) return 0;
    return Math.round(Math.min(95, (invested / plan) * 100));
  }

  /** Parent plan progress: child invested hours / workday plan hours (create → due). */
  function parentPlanProgressPercent({
    status,
    childInvestedHours = 0,
    planHours = 0
  } = {}) {
    if (["done", "closed", "ended"].includes(status)) return 100;
    const invested = Number(childInvestedHours) || 0;
    const plan = Number(planHours) || 0;
    if (!invested || !plan) return 0;
    return Math.round(Math.min(95, (invested / plan) * 100));
  }

  function normalizeStatus(status) {
    if (status === "in_progress") return "in_progress";
    if (status === "done" || status === "closed") return "ended";
    if (status === "unplanned") return "unplanned";
    if (status === "tracking") return "planned";
    return "planned";
  }

  function statusForTask(task = {}) {
    if (task.completedAt || task.status === "done" || task.status === "closed") return "ended";
    return normalizeStatus(task.status);
  }

  function classifyProjectStatus(tasks = []) {
    const statuses = tasks.map(statusForTask);
    if (statuses.includes("in_progress")) return "in_progress";
    if (statuses.length && statuses.every(status => status === "ended")) return "ended";
    if (statuses.includes("planned")) return "planned";
    return "unplanned";
  }

  return {
    summarizeProject,
    projectProgressPercent,
    taskProgressPercent,
    parentPlanProgressPercent,
    resolvePlanHours,
    classifyProjectStatus
  };
});
