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

  function isValidParentTarget({ sourceId = "", parentId = "", tasks = [] } = {}) {
    if (!sourceId || !parentId || sourceId === parentId) return false;
    const blocked = new Set([
      sourceId,
      ...descendantTaskIds({ tasks, parentId: sourceId })
    ].filter(Boolean));
    return !blocked.has(parentId);
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

  function searchTaskCandidates({ tasks = [], query = "", selectedId = "", includeEnded = false, leafOnly = false, hasChildTasks = () => false, isHiddenFutureRecurringInstance = () => false, statusText = task => task.status || "", dateText = task => task.dueDate || "" } = {}) {
    const normalizedQuery = normalizeSearchText(query);
    const keywords = normalizedQuery ? normalizedQuery.split(" ").filter(Boolean) : [];
    return tasks
      .filter(task => includeEnded
        ? Boolean(task) && !isHiddenFutureRecurringInstance(task)
        : shouldIncludeEntryTaskOption({
            task,
            isHiddenFutureRecurringInstance: isHiddenFutureRecurringInstance(task),
            isCurrentLinkedTask: task.id === selectedId
          }))
      .filter(task => !leafOnly || !hasChildTasks(task.id))
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

  function parentPickerBrowseCandidates({ tasks = [], editingTaskId = "", selectedId = "", isHiddenFutureRecurringInstance = () => false, limit = 24 } = {}) {
    const allowed = parentTaskOptionCandidates({ tasks, editingTaskId, isHiddenFutureRecurringInstance });
    const hasChildren = id => allowed.some(task => parentIdOf(task) === id);
    const preferred = allowed.filter(task => {
      if (task.id === selectedId) return true;
      if (!parentIdOf(task)) return true;
      return hasChildren(task.id);
    });
    const ranked = preferred
      .map(task => {
        const meta = hierarchyMeta({ task, tasks });
        return { task, meta, preferred: true };
      })
      .sort((a, b) => {
        const selectedRank = Number(b.task.id === selectedId) - Number(a.task.id === selectedId);
        if (selectedRank) return selectedRank;
        const rootRank = Number(!parentIdOf(a.task)) - Number(!parentIdOf(b.task));
        if (rootRank) return rootRank;
        const planRank = Number(b.meta.hasChildren) - Number(a.meta.hasChildren);
        if (planRank) return planRank;
        return a.meta.path.localeCompare(b.meta.path);
      });
    return ranked.slice(0, limit);
  }

  function parentPickerSearchCandidates({
    tasks = [],
    editingTaskId = "",
    selectedId = "",
    query = "",
    isHiddenFutureRecurringInstance = () => false,
    statusText = task => task.status || "",
    dateText = task => task.dueDate || "",
    limit = 40
  } = {}) {
    const allowed = parentTaskOptionCandidates({ tasks, editingTaskId, isHiddenFutureRecurringInstance });
    if (!String(query || "").trim()) {
      return parentPickerBrowseCandidates({
        tasks,
        editingTaskId,
        selectedId,
        isHiddenFutureRecurringInstance,
        limit: Math.min(limit, 24)
      });
    }
    return searchTaskCandidates({
      tasks: allowed,
      query,
      selectedId,
      statusText,
      dateText,
      isHiddenFutureRecurringInstance: () => false
    }).slice(0, limit);
  }

  function matchingParentContainers({
    tasks = [],
    query = "",
    hasChildTasks = () => false,
    isHiddenFutureRecurringInstance = () => false,
    limit = 6
  } = {}) {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) return [];
    const keywords = normalizedQuery.split(" ").filter(Boolean);
    return tasks
      .filter(task => task?.id && hasChildTasks(task.id))
      .filter(task => !["done", "closed"].includes(task.status))
      .filter(task => !isHiddenFutureRecurringInstance(task))
      .map(task => {
        const meta = hierarchyMeta({ task, tasks });
        const searchable = normalizeSearchText([task.title, meta.path].join(" "));
        const title = normalizeSearchText(task.title);
        const matched = keywords.every(keyword => searchable.includes(keyword));
        let rank = 3;
        if (title === normalizedQuery) rank = 0;
        else if (title.startsWith(normalizedQuery)) rank = 1;
        else if (title.includes(normalizedQuery)) rank = 2;
        return { task, meta, matched, rank };
      })
      .filter(item => item.matched)
      .sort((a, b) => a.rank - b.rank || a.meta.path.localeCompare(b.meta.path) || String(a.task.id).localeCompare(String(b.task.id)))
      .slice(0, limit);
  }

  function tokenizeTitle(title = "") {
    return normalizeSearchText(title)
      .replace(/[（）()【】\[\]<>《》""'']/g, " ")
      .split(/[\s\-_./·]+/)
      .filter(token => token.length >= 2);
  }

  function charNgrams(text = "", size = 2) {
    const value = String(text || "");
    const grams = new Set();
    if (!value) return grams;
    if (value.length < size) {
      grams.add(value);
      return grams;
    }
    for (let i = 0; i <= value.length - size; i += 1) {
      grams.add(value.slice(i, i + size));
    }
    return grams;
  }

  function setOverlapRatio(leftSet, rightSet) {
    if (!leftSet.size || !rightSet.size) return 0;
    let overlap = 0;
    leftSet.forEach(item => {
      if (rightSet.has(item)) overlap += 1;
    });
    return overlap / Math.max(leftSet.size, rightSet.size);
  }

  function titleSimilarity(a = "", b = "") {
    const left = normalizeSearchText(a).replace(/\s+/g, "");
    const right = normalizeSearchText(b).replace(/\s+/g, "");
    if (!left || !right) return 0;
    if (left === right) return 1;
    if (left.includes(right) || right.includes(left)) return 0.9;
    const tokenScore = setOverlapRatio(new Set(tokenizeTitle(a)), new Set(tokenizeTitle(b)));
    const gramScore = setOverlapRatio(charNgrams(left, 2), charNgrams(right, 2));
    return Math.max(tokenScore, gramScore);
  }

  /** 根据历史同类任务（标题相近）推荐上级；仅返回仍有效的上级任务 */
  function suggestParentForTitle({
    title = "",
    priority = "",
    tasks = [],
    isHiddenFutureRecurringInstance = () => false,
    minSimilarity = 0.34
  } = {}) {
    const draftTitle = String(title || "").trim();
    if (!draftTitle) return null;
    const byId = new Map(tasks.map(task => [task.id, task]));
    const scores = new Map();
    tasks.forEach(task => {
      const parentId = parentIdOf(task);
      if (!parentId) return;
      const parent = byId.get(parentId);
      if (!parent || ["done", "closed"].includes(parent.status)) return;
      if (isHiddenFutureRecurringInstance(parent)) return;
      const similarity = titleSimilarity(draftTitle, task.title || "");
      if (similarity < minSimilarity) return;
      let score = similarity;
      if (priority && task.priority === priority) score += 0.08;
      const stamp = Date.parse(task.updatedAt || task.createdAtIso || task.completedAt || "") || 0;
      if (stamp) {
        const ageDays = (Date.now() - stamp) / 86400000;
        score += ageDays <= 90 ? 0.12 : ageDays <= 365 ? 0.05 : 0;
      }
      const current = scores.get(parentId) || {
        parentId,
        parent,
        score: 0,
        count: 0,
        bestSimilarity: 0,
        sampleTitle: task.title || ""
      };
      current.score += score;
      current.count += 1;
      if (similarity >= current.bestSimilarity) {
        current.bestSimilarity = similarity;
        current.sampleTitle = task.title || "";
      }
      scores.set(parentId, current);
    });
    const ranked = [...scores.values()].sort((a, b) =>
      b.score - a.score || b.count - a.count || b.bestSimilarity - a.bestSimilarity
    );
    return ranked[0] || null;
  }

  return {
    shouldIncludeEntryTaskOption,
    entryTaskOptionLabel,
    descendantTaskIds,
    parentTaskOptionCandidates,
    isValidParentTarget,
    parentPickerBrowseCandidates,
    parentPickerSearchCandidates,
    matchingParentContainers,
    tokenizeTitle,
    titleSimilarity,
    suggestParentForTitle,
    taskHierarchyPath,
    parentIdOf,
    hierarchyMeta,
    normalizeSearchText,
    searchTaskCandidates
  };
});
