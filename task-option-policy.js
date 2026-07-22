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

  function entryTaskOptionLabel({ task, selectedDate, hasChildren = false, hierarchyPath = "" }) {
    const kind = hasChildren ? "计划" : "待办";
    const date = task?.dueDate ? (task.dueDate === selectedDate ? "今天" : task.dueDate.slice(5)) : "未计划";
    const title = hierarchyPath || task?.title || "未命名任务";
    return `${kind} · ${date} · ${title}`;
  }

  function descendantTaskIds({ tasks = [], parentId, visited = new Set() }) {
    if (!parentId || visited.has(parentId)) return [];
    visited.add(parentId);
    return tasks
      .filter(task => task.parentId === parentId)
      .flatMap(task => [task.id, ...descendantTaskIds({ tasks, parentId: task.id, visited })]);
  }

  function parentTaskOptionCandidates({ tasks = [], editingTaskId = "", isHiddenFutureRecurringInstance = () => false }) {
    const blockedIds = new Set([
      editingTaskId,
      ...descendantTaskIds({ tasks, parentId: editingTaskId })
    ].filter(Boolean));
    return tasks
      .filter(task => task?.id && !blockedIds.has(task.id))
      .filter(task => !["done", "closed"].includes(task.status))
      .filter(task => !isHiddenFutureRecurringInstance(task))
      .sort((a, b) => taskHierarchyPath({ task: a, tasks }).localeCompare(taskHierarchyPath({ task: b, tasks })));
  }

  function taskHierarchyPath({ task, tasks = [], separator = " / " }) {
    if (!task) return "";
    const byId = new Map(tasks.map(item => [item.id, item]));
    const chain = [];
    const visited = new Set();
    let current = task;
    while (current && !visited.has(current.id)) {
      chain.unshift(current.title || "未命名任务");
      visited.add(current.id);
      current = current.parentId ? byId.get(current.parentId) : null;
    }
    return chain.join(separator);
  }

  return {
    shouldIncludeEntryTaskOption,
    entryTaskOptionLabel,
    descendantTaskIds,
    parentTaskOptionCandidates,
    taskHierarchyPath
  };
});
