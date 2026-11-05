(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.ProjectCollapsePolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  function taskParentId(task) {
    return String(task?.parentId || task?.parentTaskId || task?.parentTask || task?.parent || "").trim();
  }

  function visibleTreeItems({ tasks = [], collapsedIds = new Set(), resolveParent = null } = {}) {
    const collapsed = collapsedIds instanceof Set ? collapsedIds : new Set(collapsedIds || []);
    const byId = new Map(tasks.map(task => [task.id, task]));
    return tasks.filter(task => !hasCollapsedAncestor(task, byId, collapsed, resolveParent));
  }

  function filterProjectsForStatus(projects = [], status = "all") {
    if (!status || status === "all") return projects;
    return projects.filter(project => project.status === status);
  }

  function shouldRenderSingleRow(project) {
    return project?.parent?.id && project.children?.length === 1 && project.children[0]?.id === project.parent.id;
  }

  function hasCollapsedAncestor(task, byId, collapsedIds, resolveParent = null) {
    const visited = new Set();
    let parentId = taskParentId(task);
    while (parentId && !visited.has(parentId)) {
      if (collapsedIds.has(parentId)) return true;
      visited.add(parentId);
      const parent = byId.get(parentId)
        || (typeof resolveParent === "function" ? resolveParent(parentId) : null);
      parentId = taskParentId(parent);
    }
    return false;
  }

  return {
    filterProjectsForStatus,
    shouldRenderSingleRow,
    visibleTreeItems
  };
});
