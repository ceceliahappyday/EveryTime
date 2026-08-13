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

  function parentIdOf(task) {
    return task?.parentId || task?.parentTaskId || task?.parentTask || task?.parent || "";
  }

  function hierarchyMeta({ task, tasks = [], separator = " › " }) {
    if (!task) return { depth: 0, parentPath: "", path: "", hasChildren: false, kind: "任务" };
    const byId = new Map(tasks.map(item => [item.id, item]));
    const chain = [];
    const seen = new Set();
    let current = task;
    while (current && !seen.has(current.id)) {
      chain.unshift(current);
      seen.add(current.id);
      current = byId.get(parentIdOf(current));
    }
    const titles = chain.map(item => item.title || "未命名任务");
    const hasChildren = tasks.some(item => parentIdOf(item) === task.id);
    return {
      depth: Math.max(1, chain.length),
      parentPath: titles.slice(0, -1).join(separator),
      path: titles.join(separator),
      hasChildren,
      kind: hasChildren ? "计划" : "任务"
    };
  }

  function normalizeSearchText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[›»>\\/|、，,。:：·]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function searchTaskCandidates({ tasks = [], query = "", selectedId = "", isHiddenFutureRecurringInstance = () => false, statusText = task => task.status || "", dateText = task => task.dueDate || "" } = {}) {
    const normalizedQuery = normalizeSearchText(query);
    const keywords = normalizedQuery ? normalizedQuery.split(" ").filter(Boolean) : [];
    return tasks
      .filter(task => shouldIncludeEntryTaskOption({
        task,
        isHiddenFutureRecurringInstance: isHiddenFutureRecurringInstance(task),
        isCurrentLinkedTask: task.id === selectedId
      }))
      .map(task => {
        const meta = hierarchyMeta({ task, tasks });
        const searchable = normalizeSearchText([task.title, meta.path, statusText(task), dateText(task)].join(" "));
        const title = normalizeSearchText(task.title);
        const matched = keywords.every(keyword => searchable.includes(keyword));
        let rank = 3;
        if (normalizedQuery && title === normalizedQuery) rank = 0;
        else if (normalizedQuery && title.startsWith(normalizedQuery)) rank = 1;
        else if (normalizedQuery && title.includes(normalizedQuery)) rank = 2;
        return { task, meta, searchable, matched, rank };
      })
      .filter(item => item.matched)
      .sort((a, b) => a.rank - b.rank || Number(a.meta.hasChildren) - Number(b.meta.hasChildren) || a.meta.path.localeCompare(b.meta.path) || String(a.task.id).localeCompare(String(b.task.id)));
  }

  return {
    shouldIncludeEntryTaskOption,
    entryTaskOptionLabel,
    descendantTaskIds,
    parentTaskOptionCandidates,
    taskHierarchyPath,
    parentIdOf,
    hierarchyMeta,
    normalizeSearchText,
    searchTaskCandidates
  };
});
