(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.ProjectCollapsePolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  function visibleTreeItems({ tasks = [], collapsedIds = new Set() }) {
    const collapsed = collapsedIds instanceof Set ? collapsedIds : new Set(collapsedIds || []);
    const byId = new Map(tasks.map(task => [task.id, task]));
    return tasks.filter(task => !hasCollapsedAncestor(task, byId, collapsed));
  }

  function filterProjectsForStatus(projects = [], status = "all") {
    if (!status || status === "all") return projects;
    return projects.filter(project => project.status === status);
  }

  function hasCollapsedAncestor(task, byId, collapsedIds) {
    const visited = new Set();
    let current = task;
    while (current?.parentId && byId.has(current.parentId) && !visited.has(current.parentId)) {
      if (collapsedIds.has(current.parentId)) return true;
      visited.add(current.parentId);
      current = byId.get(current.parentId);
    }
    return false;
  }

  return {
    filterProjectsForStatus,
    visibleTreeItems
  };
});
