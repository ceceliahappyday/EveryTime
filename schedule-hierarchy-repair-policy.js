(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.ScheduleHierarchyRepairPolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  function normalizeTitle(title) {
    return String(title || "").trim().replace(/\s+/g, " ");
  }

  function parentIdOf(task) {
    return task?.parentId || task?.parentTaskId || task?.parentTask || task?.parent || "";
  }

  function isTaskWorkEntry(entry) {
    if (!entry) return false;
    if (entry.entryType === "calendar") return false;
    return entry.entryType === "task_work" || !!entry.taskId;
  }

  function collectTasks(data = {}) {
    const rows = [];
    Object.entries(data || {}).forEach(([dateKey, day]) => {
      (day?.tasks || []).forEach(task => rows.push({ task, dateKey, day }));
    });
    return rows;
  }

  function collectEntries(data = {}) {
    const rows = [];
    Object.entries(data || {}).forEach(([dateKey, day]) => {
      (day?.entries || []).forEach(entry => rows.push({ entry, dateKey, day }));
    });
    return rows;
  }

  function childrenByParent(taskRows) {
    const map = new Map();
    taskRows.forEach(({ task }) => {
      const pid = parentIdOf(task);
      if (!pid) return;
      if (!map.has(pid)) map.set(pid, []);
      map.get(pid).push(task);
    });
    return map;
  }

  function findChildByTitle(children, title) {
    const needle = normalizeTitle(title);
    if (!needle) return null;
    return (children || []).find(child => normalizeTitle(child.title) === needle) || null;
  }

  function ensureDay(data, dateKey) {
    if (!data[dateKey]) data[dateKey] = { tasks: [], entries: [], note: "" };
    data[dateKey].tasks ||= [];
    data[dateKey].entries ||= [];
    data[dateKey].note ||= "";
    return data[dateKey];
  }

  function createLeafTask({
    createId,
    title,
    parentId,
    dateKey,
    owner = "我",
    now = new Date()
  }) {
    const createdAtIso = now.toISOString();
    return {
      id: createId(),
      title: normalizeTitle(title),
      dueDate: dateKey || "",
      dueTime: "",
      owner,
      parentId,
      description: "由历史日程投入自动拆成的下级任务，便于父任务只作为汇总节点。",
      priority: "general_daily",
      progress: 0,
      status: "planned",
      startedAt: "",
      startOverrideAt: "",
      completedAt: "",
      businessBackground: "",
      problemReason: "",
      deliveryNote: "",
      recurrence: null,
      recurrenceGroupId: "",
      createdAtIso,
      updatedAt: createdAtIso,
      createdAt: now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
    };
  }

  function statusFromLinkedEntries(entryRows, now = new Date()) {
    const started = entryRows.some(({ entry, dateKey }) => {
      const start = Number(entry.start);
      if (!Number.isFinite(start)) return false;
      const parts = String(dateKey || "").split("-").map(Number);
      if (parts.length !== 3 || parts.some(Number.isNaN)) return false;
      const when = new Date(parts[0], parts[1] - 1, parts[2]);
      when.setHours(Math.floor(start), Math.round((start % 1) * 60), 0, 0);
      return when <= now;
    });
    return started ? "in_progress" : "planned";
  }

  /**
   * Promote mismatched task_work titles into leaf children and retarget entries.
   * calendar entries are left untouched. Idempotent by parentId + title.
   */
  function repairPlannerData(data = {}, {
    createId = () => (globalThis.crypto?.randomUUID?.() || `leaf-${Date.now()}-${Math.random().toString(16).slice(2)}`),
    now = new Date()
  } = {}) {
    const next = data;
    let createdChildren = 0;
    let retargetedEntries = 0;
    const createdTitles = [];
    const retargetSamples = [];

    const refresh = () => {
      const taskRows = collectTasks(next);
      const byId = new Map(taskRows.map(row => [row.task.id, row]));
      const childrenMap = childrenByParent(taskRows);
      return { taskRows, byId, childrenMap };
    };

    let index = refresh();
    const entryRows = collectEntries(next).filter(({ entry }) => isTaskWorkEntry(entry) && entry.taskId);

    // Group mismatched work by parent task + leaf title.
    const groups = new Map();
    entryRows.forEach(row => {
      const parentRow = index.byId.get(row.entry.taskId);
      if (!parentRow) return;
      const entryTitle = normalizeTitle(row.entry.title);
      const parentTitle = normalizeTitle(parentRow.task.title);
      if (!entryTitle || entryTitle === parentTitle) {
        // Work on a non-leaf with the parent's own title still needs a leaf.
        if ((index.childrenMap.get(parentRow.task.id) || []).length) {
          const key = `${parentRow.task.id}\0${parentTitle}`;
          if (!groups.has(key)) {
            groups.set(key, {
              parentId: parentRow.task.id,
              parent: parentRow.task,
              leafTitle: parentTitle,
              entries: []
            });
          }
          groups.get(key).entries.push(row);
        }
        return;
      }
      const key = `${parentRow.task.id}\0${entryTitle}`;
      if (!groups.has(key)) {
        groups.set(key, {
          parentId: parentRow.task.id,
          parent: parentRow.task,
          leafTitle: entryTitle,
          entries: []
        });
      }
      groups.get(key).entries.push(row);
    });

    groups.forEach(group => {
      index = refresh();
      const existingChildren = index.childrenMap.get(group.parentId) || [];
      let leaf = findChildByTitle(existingChildren, group.leafTitle);
      if (!leaf) {
        const firstDate = group.entries
          .map(item => item.dateKey)
          .filter(Boolean)
          .sort()[0] || Object.keys(next).sort()[0] || new Date().toISOString().slice(0, 10);
        leaf = createLeafTask({
          createId,
          title: group.leafTitle,
          parentId: group.parentId,
          dateKey: firstDate,
          owner: group.parent.owner || "我",
          now
        });
        leaf.status = statusFromLinkedEntries(group.entries, now);
        if (leaf.status === "in_progress") {
          leaf.startedAt = group.entries[0]
            ? new Date(`${group.entries[0].dateKey}T09:00:00`).toISOString()
            : now.toISOString();
        }
        ensureDay(next, firstDate).tasks.push(leaf);
        createdChildren += 1;
        createdTitles.push(`${normalizeTitle(group.parent.title)} › ${leaf.title}`);
        index = refresh();
      }

      group.entries.forEach(({ entry, dateKey }) => {
        if (entry.taskId === leaf.id) return;
        entry.taskId = leaf.id;
        entry.entryType = "task_work";
        retargetedEntries += 1;
        if (retargetSamples.length < 30) {
          retargetSamples.push({
            dateKey,
            title: normalizeTitle(entry.title),
            fromParent: normalizeTitle(group.parent.title),
            toLeaf: leaf.title
          });
        }
      });
    });

    // Final pass: any remaining task_work still on a non-leaf gets retargeted
    // to a same-titled child or a newly ensured leaf named after the entry.
    index = refresh();
    collectEntries(next).forEach(({ entry, dateKey }) => {
      if (!isTaskWorkEntry(entry) || !entry.taskId) return;
      const parentRow = index.byId.get(entry.taskId);
      if (!parentRow) return;
      const kids = index.childrenMap.get(entry.taskId) || [];
      if (!kids.length) return;
      const entryTitle = normalizeTitle(entry.title) || normalizeTitle(parentRow.task.title);
      let leaf = findChildByTitle(kids, entryTitle);
      if (!leaf) {
        leaf = createLeafTask({
          createId,
          title: entryTitle,
          parentId: entry.taskId,
          dateKey,
          owner: parentRow.task.owner || "我",
          now
        });
        ensureDay(next, dateKey).tasks.push(leaf);
        createdChildren += 1;
        createdTitles.push(`${normalizeTitle(parentRow.task.title)} › ${leaf.title}`);
        index = refresh();
      }
      if (entry.taskId !== leaf.id) {
        entry.taskId = leaf.id;
        entry.entryType = "task_work";
        retargetedEntries += 1;
      }
    });

    return {
      data: next,
      changed: createdChildren > 0 || retargetedEntries > 0,
      report: {
        createdChildren,
        retargetedEntries,
        createdTitles,
        retargetSamples
      }
    };
  }

  return {
    normalizeTitle,
    isTaskWorkEntry,
    repairPlannerData
  };
});
