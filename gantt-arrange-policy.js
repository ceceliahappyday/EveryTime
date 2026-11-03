(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.GanttArrangePolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  // v3: Notion-style nesting — no projectStatus; tree never splits a family.
  const STORAGE_KEY = "today-planner-gantt-arrange-v3";

  const DIMENSIONS = [
    { id: "taskTree", label: "任务项" },
    { id: "taskStatus", label: "任务状态" },
    { id: "category", label: "任务分类" },
    { id: "owner", label: "责任人" },
    { id: "priority", label: "优先级" }
  ];

  const STATUS_ORDER = ["in_progress", "planned", "unplanned", "ended"];
  const STATUS_LABELS = {
    in_progress: "进行中",
    planned: "计划中",
    unplanned: "未计划",
    ended: "已结束"
  };

  function defaultConfig() {
    return {
      dimensions: DIMENSIONS.map(dim => ({
        id: dim.id,
        // 默认：任务项在前 + 任务状态（父下再分状态）
        enabled: dim.id === "taskTree" || dim.id === "taskStatus"
      })),
      treeDepth: null
    };
  }

  function normalizeConfig(raw) {
    const base = defaultConfig();
    if (!raw || typeof raw !== "object") return base;
    const byId = new Map((raw.dimensions || []).map(item => [item.id, item]));
    const ordered = [];
    const seen = new Set();
    (raw.dimensions || []).forEach(item => {
      if (!item || item.id === "meetings" || item.id === "projectStatus") return;
      if (!DIMENSIONS.some(dim => dim.id === item.id) || seen.has(item.id)) return;
      seen.add(item.id);
      ordered.push({ id: item.id, enabled: item.enabled !== false });
    });
    base.dimensions.forEach(item => {
      if (seen.has(item.id)) return;
      const previous = byId.get(item.id);
      ordered.push({ id: item.id, enabled: previous ? previous.enabled !== false : item.enabled });
    });
    const depth = raw.treeDepth;
    return {
      dimensions: ordered,
      treeDepth: depth == null || depth === "" || depth === "all" ? null : Math.max(0, Math.min(6, Number(depth) || 0))
    };
  }

  function loadConfig(storage = globalThis.localStorage) {
    try {
      return normalizeConfig(JSON.parse(storage?.getItem?.(STORAGE_KEY) || "null"));
    } catch {
      return defaultConfig();
    }
  }

  function saveConfig(config, storage = globalThis.localStorage) {
    const next = normalizeConfig(config);
    try { storage?.setItem?.(STORAGE_KEY, JSON.stringify(next)); } catch {}
    return next;
  }

  function dimensionMeta(id) {
    return DIMENSIONS.find(dim => dim.id === id) || { id, label: id };
  }

  /**
   * Notion 式：
   * - 任务项：一家不拆散
   * - 树前字段：外层 Group by「整棵父任务块」
   * - 树后字段：任务项开启时不拆分组标题（避免打断父子），状态等走列展示
   */
  function splitArrangeDimensions(config) {
    const enabled = normalizeConfig(config).dimensions.filter(dim => dim.enabled);
    const treeIndex = enabled.findIndex(dim => dim.id === "taskTree");
    const treeOn = treeIndex >= 0;
    const sectionDimensions = [];
    const withinTreeDimensions = [];
    enabled.forEach((dim, index) => {
      if (dim.id === "taskTree") return;
      if (!treeOn || index < treeIndex) sectionDimensions.push(dim);
      else withinTreeDimensions.push(dim);
    });
    return {
      treeOn,
      treeIndex,
      sectionDimensions,
      withinTreeDimensions,
      annotationDimensions: [],
      enabled
    };
  }

  function enabledGroupDimensions(config) {
    return splitArrangeDimensions(config).sectionDimensions;
  }

  function isTreeEnabled(config) {
    return splitArrangeDimensions(config).treeOn;
  }

  function isDimensionEnabled(config, id) {
    return normalizeConfig(config).dimensions.some(dim => dim.id === id && dim.enabled);
  }

  function countSectionRows(section) {
    if (!section) return 0;
    const own = Array.isArray(section.rows) ? section.rows.length : 0;
    return own + (section.children || []).reduce((sum, child) => sum + countSectionRows(child), 0);
  }

  function normalizeTaskStatusBucket(status) {
    if (status === "in_progress") return "in_progress";
    if (status === "done" || status === "closed" || status === "ended") return "ended";
    if (status === "unplanned") return "unplanned";
    return "planned";
  }

  function rollupProjectStatus(tasks, classifyProjectStatus) {
    if (typeof classifyProjectStatus === "function") {
      return classifyProjectStatus(tasks || []) || "unplanned";
    }
    const statuses = (tasks || []).map(task => normalizeTaskStatusBucket(task?.status));
    if (statuses.includes("in_progress")) return "in_progress";
    if (statuses.length && statuses.every(status => status === "ended")) return "ended";
    if (statuses.includes("planned")) return "planned";
    return "unplanned";
  }

  /**
   * 外层按任务状态归「父任务块」时：
   * - 父已结束 → 已结束
   * - 父未结束：有进行中子 → 进行中；否则父自身；不因子全结束而把未关闭父推进已结束
   */
  function parentBlockStatusBucket({ task, descendantTasks = [], classifyProjectStatus }) {
    const own = normalizeTaskStatusBucket(task?.status);
    if (own === "ended") return "ended";
    const members = (descendantTasks || []).length ? descendantTasks : [task];
    const rollup = rollupProjectStatus(members, classifyProjectStatus);
    if (rollup === "in_progress") return "in_progress";
    if (rollup === "ended") return own;
    return rollup || own;
  }

  function rowStatusBucket({ task, isParent = false, descendantTasks = [], classifyProjectStatus }) {
    if (isParent) {
      return parentBlockStatusBucket({ task, descendantTasks, classifyProjectStatus });
    }
    return normalizeTaskStatusBucket(task?.status);
  }

  function statusLabel(bucket) {
    return STATUS_LABELS[bucket] || bucket || "计划中";
  }

  function ownerBucket(task) {
    return String(task?.owner || "").trim() || "未指定";
  }

  function priorityBucket(task) {
    return task?.priority || "general_daily";
  }

  function priorityLabel(priority) {
    return ({
      general_daily: "一般日常",
      kpi: "KPI",
      follow_up: "跟踪关注",
      important_urgent: "重要紧急",
      paused: "中止暂停",
      monthly_fixed: "每月例行"
    })[priority] || priority || "一般日常";
  }

  function categoryBucket(task, helpers = {}) {
    if (typeof helpers.resolveCategory === "function") {
      return helpers.resolveCategory(task) || "work";
    }
    return String(task?.category || "").trim() || "work";
  }

  function groupKeyForDimension(dimId, row, helpers = {}) {
    if (dimId === "taskStatus") {
      return rowStatusBucket({
        task: row.task,
        isParent: row.isParent,
        descendantTasks: row.descendantTasks,
        classifyProjectStatus: helpers.classifyProjectStatus
      });
    }
    if (dimId === "category") return categoryBucket(row.task, helpers);
    if (dimId === "owner") return ownerBucket(row.task);
    if (dimId === "priority") return priorityBucket(row.task);
    return "all";
  }

  function groupLabelForDimension(dimId, key, helpers = {}) {
    if (dimId === "taskStatus") return statusLabel(key);
    if (dimId === "category") {
      if (typeof helpers.categoryLabel === "function") return helpers.categoryLabel(key);
      return `任务分类 · ${key}`;
    }
    if (dimId === "owner") return `责任人 · ${key}`;
    if (dimId === "priority") return priorityLabel(key);
    return key;
  }

  function compareGroupKeys(dimId, a, b, helpers = {}) {
    if (dimId === "taskStatus") return STATUS_ORDER.indexOf(a) - STATUS_ORDER.indexOf(b);
    if (dimId === "category" && typeof helpers.categoryOrderIndex === "function") {
      const diff = helpers.categoryOrderIndex(a) - helpers.categoryOrderIndex(b);
      if (diff !== 0) return diff;
    }
    return String(a).localeCompare(String(b), "zh-CN");
  }

  function withinTreeDepth(depth, treeDepth) {
    if (treeDepth == null) return true;
    return depth <= treeDepth;
  }

  function makeRow(task, {
    parent,
    descendants,
    project,
    isParent = false,
    depth = 0,
    getChildTasks = () => []
  }) {
    const projectStatus = rollupProjectStatus(
      (project.summaryTasks || descendants).length ? (project.summaryTasks || descendants) : [parent],
      null
    );
    return {
      task,
      rootId: parent.id,
      isParent,
      depth,
      projectStatus,
      projectStatusLabel: statusLabel(projectStatus),
      descendantTasks: isParent ? descendants : getChildTasks(task.id),
      progress: project.progress
    };
  }

  function listVisibleChildren(project, { collapsedTasks, visibleTreeItems, treeDepth }) {
    const parent = project.parent;
    const descendants = (project.children || []).filter(task => task.id !== parent.id);
    const visible = typeof visibleTreeItems === "function"
      ? visibleTreeItems({ tasks: descendants, collapsedIds: collapsedTasks })
      : descendants;
    return visible.map(task => {
      let depth = 1;
      let current = task;
      const visited = new Set();
      while (current?.parentId && current.parentId !== parent.id && !visited.has(current.id)) {
        visited.add(current.id);
        depth += 1;
        current = descendants.find(item => item.id === current.parentId) || null;
        if (!current) break;
      }
      return { task, depth: withinTreeDepth(depth, treeDepth) ? depth : null };
    }).filter(item => item.depth != null);
  }

  function nestRowsByDimensions(rows, dimensions, helpers, depth = 0, path = []) {
    if (!dimensions.length) {
      return [{
        key: path.map(part => part.key).join("/") || "leaf",
        status: path.map(part => part.key).join("/") || "leaf",
        label: path.length ? path[path.length - 1].label : "",
        silent: !path.length,
        depth: Math.max(0, path.length ? depth : 0),
        path,
        rows,
        children: []
      }];
    }
    const [dim, ...rest] = dimensions;
    const buckets = new Map();
    rows.forEach(row => {
      // 子任务分组始终看自身属性（不用父汇总）
      let key;
      if (dim.id === "taskStatus") key = normalizeTaskStatusBucket(row.task?.status);
      else key = groupKeyForDimension(dim.id, { ...row, isParent: false }, helpers);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(row);
    });
    return [...buckets.keys()]
      .sort((a, b) => compareGroupKeys(dim.id, a, b, helpers))
      .map(key => {
        const label = groupLabelForDimension(dim.id, key, helpers);
        const nextPath = path.concat([{ dimId: dim.id, key, label }]);
        const sectionKey = nextPath.map(part => part.key).join("/");
        const bucketRows = buckets.get(key);
        if (!rest.length) {
          return {
            key: sectionKey,
            status: sectionKey,
            label,
            depth,
            dimId: dim.id,
            path: nextPath,
            rows: bucketRows,
            children: []
          };
        }
        return {
          key: sectionKey,
          status: sectionKey,
          label,
          depth,
          dimId: dim.id,
          path: nextPath,
          rows: [],
          children: nestRowsByDimensions(bucketRows, rest, helpers, depth + 1, nextPath)
        };
      });
  }

  function buildProjectRows(project, {
    config,
    collapsedSections = new Set(),
    collapsedTasks = new Set(),
    visibleTreeItems,
    shouldRenderSingleRow,
    classifyProjectStatus,
    getChildTasks = () => []
  } = {}) {
    const treeOn = isTreeEnabled(config);
    const treeDepth = normalizeConfig(config).treeDepth;
    const parent = project.parent;
    const descendants = (project.children || []).filter(task => task.id !== parent.id);
    const rows = [];
    const push = (task, opts) => {
      if (!withinTreeDepth(opts.depth || 0, treeDepth)) return;
      rows.push(makeRow(task, {
        parent,
        descendants,
        project,
        getChildTasks,
        ...opts
      }));
    };

    const directChildren = getChildTasks(parent.id);
    const singleRow = shouldRenderSingleRow?.(project) && !directChildren.length;
    if (singleRow) {
      push(parent, { isParent: false, depth: 0 });
      return rows;
    }
    if (!treeOn) {
      push(parent, { isParent: directChildren.length > 0 || descendants.length > 0, depth: 0 });
      if (collapsedSections.has(parent.id)) return rows;
      listVisibleChildren(project, { collapsedTasks, visibleTreeItems, treeDepth })
        .forEach(({ task, depth }) => push(task, {
          isParent: getChildTasks(task.id).length > 0,
          depth
        }));
      return rows;
    }
    push(parent, { isParent: true, depth: 0 });
    if (collapsedSections.has(parent.id)) return rows;
    listVisibleChildren(project, { collapsedTasks, visibleTreeItems, treeDepth })
      .forEach(({ task, depth }) => push(task, {
        isParent: getChildTasks(task.id).length > 0,
        depth
      }));
    return rows;
  }

  function buildTreeUnit(project, {
    config,
    collapsedSections = new Set(),
    collapsedTasks = new Set(),
    visibleTreeItems,
    shouldRenderSingleRow,
    classifyProjectStatus,
    getChildTasks = () => [],
    depth = 0,
    helpers = {}
  } = {}) {
    const split = splitArrangeDimensions(config);
    const treeDepth = normalizeConfig(config).treeDepth;
    const parent = project.parent;
    const descendants = (project.children || []).filter(task => task.id !== parent.id);
    const rowOpts = { parent, descendants, project, getChildTasks };

    const parentRow = makeRow(parent, {
      ...rowOpts,
      isParent: !shouldRenderSingleRow?.(project),
      depth: 0
    });
    // 外层分组用：带上汇总所需的 descendantTasks
    parentRow.descendantTasks = descendants;
    parentRow.isParent = true;
    if (classifyProjectStatus) {
      parentRow.projectStatus = rollupProjectStatus(
        (project.summaryTasks || descendants).length ? (project.summaryTasks || descendants) : [parent],
        classifyProjectStatus
      );
      parentRow.projectStatusLabel = statusLabel(parentRow.projectStatus);
    }

    const directChildren = getChildTasks(parent.id);
    if ((shouldRenderSingleRow?.(project) && !directChildren.length) || collapsedSections.has(parent.id)) {
      return {
        key: `tree:${parent.id}`,
        status: `tree:${parent.id}`,
        label: "",
        silent: true,
        depth,
        parentRow,
        rows: [parentRow],
        children: []
      };
    }

    const childRows = listVisibleChildren(project, { collapsedTasks, visibleTreeItems, treeDepth })
      .map(({ task, depth: childDepth }) => makeRow(task, {
        ...rowOpts,
        isParent: getChildTasks(task.id).length > 0,
        depth: childDepth
      }));

    // Keep the whole family in tree order under the parent row. Splitting siblings by
    // status (or other within-tree dimensions) hides parent-child relationships.
    return {
      key: `tree:${parent.id}`,
      status: `tree:${parent.id}`,
      label: "",
      silent: true,
      depth,
      parentRow,
      rows: [parentRow, ...childRows],
      children: []
    };
  }

  function rebaseSectionDepth(section, depth) {
    return {
      ...section,
      depth,
      children: (section.children || []).map((child, index) => rebaseSectionDepth(child, depth + 1))
    };
  }

  function nestUnitsByDimensions(units, dimensions, helpers, depth = 0, path = []) {
    if (!dimensions.length) {
      return units.map(unit => rebaseSectionDepth(unit, depth));
    }
    const [dim, ...rest] = dimensions;
    const buckets = new Map();
    units.forEach(unit => {
      const key = groupKeyForDimension(dim.id, unit.parentRow || unit.rows[0], helpers);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(unit);
    });
    return [...buckets.keys()]
      .sort((a, b) => compareGroupKeys(dim.id, a, b, helpers))
      .map(key => {
        const label = groupLabelForDimension(dim.id, key, helpers);
        const nextPath = path.concat([{ dimId: dim.id, key, label }]);
        const sectionKey = nextPath.map(part => part.key).join("/");
        const bucketUnits = buckets.get(key);
        return {
          key: sectionKey,
          status: sectionKey,
          label,
          depth,
          dimId: dim.id,
          path: nextPath,
          rows: [],
          children: nestUnitsByDimensions(bucketUnits, rest, helpers, depth + 1, nextPath)
        };
      });
  }

  function nestFlatRows(rows, dimensions, helpers, path = []) {
    if (!dimensions.length) {
      return [{
        key: path.map(part => part.key).join("/") || "all",
        status: path.map(part => part.key).join("/") || "all",
        label: path.length ? path[path.length - 1].label : "全部",
        depth: Math.max(0, path.length - 1),
        path,
        rows,
        children: []
      }];
    }
    const [dim, ...rest] = dimensions;
    const depth = path.length;
    const buckets = new Map();
    rows.forEach(row => {
      const key = groupKeyForDimension(dim.id, row, helpers);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(row);
    });
    return [...buckets.keys()]
      .sort((a, b) => compareGroupKeys(dim.id, a, b, helpers))
      .map(key => {
        const label = groupLabelForDimension(dim.id, key, helpers);
        const nextPath = path.concat([{ dimId: dim.id, key, label }]);
        const sectionKey = nextPath.map(part => part.key).join("/");
        if (!rest.length) {
          return {
            key: sectionKey,
            status: sectionKey,
            label,
            depth,
            dimId: dim.id,
            path: nextPath,
            rows: buckets.get(key),
            children: []
          };
        }
        return {
          key: sectionKey,
          status: sectionKey,
          label,
          depth,
          dimId: dim.id,
          path: nextPath,
          rows: [],
          children: nestFlatRows(buckets.get(key), rest, helpers, nextPath)
        };
      });
  }

  function buildSections({
    projects = [],
    config,
    collapsedSections,
    collapsedTasks,
    visibleTreeItems,
    shouldRenderSingleRow,
    classifyProjectStatus,
    getChildTasks,
    resolveCategory,
    categoryLabel,
    categoryOrderIndex,
    extraRows = []
  } = {}) {
    const normalized = normalizeConfig(config);
    const split = splitArrangeDimensions(normalized);
    const helpers = { classifyProjectStatus, resolveCategory, categoryLabel, categoryOrderIndex };
    const meetingRows = Array.isArray(extraRows) ? extraRows : [];

    if (split.treeOn) {
      const units = projects.map(project => buildTreeUnit(project, {
        config: normalized,
        collapsedSections,
        collapsedTasks,
        visibleTreeItems,
        shouldRenderSingleRow,
        classifyProjectStatus,
        getChildTasks,
        depth: 0,
        helpers
      }));

      if (!split.sectionDimensions.length) {
        return [{
          key: "all",
          status: "all",
          label: "任务",
          depth: 0,
          rows: meetingRows,
          children: units
        }];
      }

      const nested = nestUnitsByDimensions(units, split.sectionDimensions, helpers, 0);
      if (!meetingRows.length) return nested;

      // 会议只进树前外层：按同样维度挂到对应桶，否则单独「会议」
      const meetingSections = nestFlatRows(meetingRows, split.sectionDimensions, helpers);
      return mergeMeetingSections(nested, meetingSections);
    }

    const allRows = [
      ...projects.flatMap(project => buildProjectRows(project, {
        config: normalized,
        collapsedSections,
        collapsedTasks,
        visibleTreeItems,
        shouldRenderSingleRow,
        classifyProjectStatus,
        getChildTasks
      })),
      ...meetingRows
    ];
    if (!split.sectionDimensions.length) {
      return [{
        key: "all",
        label: "全部事项",
        status: "all",
        depth: 0,
        rows: allRows,
        children: []
      }];
    }
    return nestFlatRows(allRows, split.sectionDimensions, helpers);
  }

  function mergeMeetingSections(unitSections, meetingSections) {
    const byKey = new Map(unitSections.map(section => [section.key, section]));
    meetingSections.forEach(meet => {
      if (byKey.has(meet.key)) {
        const target = byKey.get(meet.key);
        if (meet.children?.length) {
          target.children = [...(target.children || []), ...meet.children];
        } else {
          target.rows = [...(target.rows || []), ...(meet.rows || [])];
        }
        return;
      }
      unitSections.push(meet);
      byKey.set(meet.key, meet);
    });
    return unitSections;
  }

  function meetingParentTaskId(row) {
    return String(row?.parentTaskId || row?.meeting?.linkedTaskId || "").trim();
  }

  /** Insert linked meeting rows under their task; returns leftover unlinked meetings. */
  function attachMeetingRowsUnderTasks(sections = [], meetingRows = []) {
    const byParent = new Map();
    const leftovers = [];
    (meetingRows || []).forEach(row => {
      const parentId = meetingParentTaskId(row);
      if (!parentId) {
        leftovers.push(row);
        return;
      }
      if (!byParent.has(parentId)) byParent.set(parentId, []);
      byParent.get(parentId).push(row);
    });

    const weaveRows = rows => {
      const result = [];
      const stack = [];
      const flush = untilDepth => {
        while (stack.length && stack[stack.length - 1].depth >= untilDepth) {
          const frame = stack.pop();
          const meets = byParent.get(frame.taskId);
          if (!meets?.length) continue;
          byParent.delete(frame.taskId);
          if (frame.collapsed) continue;
          meets.forEach(meet => {
            result.push({
              ...meet,
              depth: frame.depth + 1,
              rootId: frame.rootId || frame.taskId,
              parentTaskId: frame.taskId
            });
          });
        }
      };
      (rows || []).forEach(row => {
        if (row?.kind === "meeting") {
          result.push(row);
          return;
        }
        const depth = Math.max(0, Number(row?.depth) || 0);
        flush(depth);
        result.push(row);
        if (row?.task?.id) {
          stack.push({
            taskId: row.task.id,
            depth,
            rootId: row.rootId || row.task.id,
            collapsed: Boolean(row.collapsed)
          });
        }
      });
      flush(-1);
      return result;
    };

    const walk = section => {
      if (!section) return;
      section.rows = weaveRows(section.rows || []);
      (section.children || []).forEach(walk);
      const parentId = section.parentRow?.task?.id;
      if (parentId && byParent.has(parentId)) {
        const meets = byParent.get(parentId);
        byParent.delete(parentId);
        if (!section.parentRow.collapsed) {
          const depth = Math.max(0, Number(section.parentRow.depth) || 0);
          section.rows = [
            ...(section.rows || []),
            ...meets.map(meet => ({
              ...meet,
              depth: depth + 1,
              rootId: section.parentRow.rootId || parentId,
              parentTaskId: parentId
            }))
          ];
        }
      }
    };
    (sections || []).forEach(walk);
    byParent.forEach(rows => leftovers.push(...rows));
    return leftovers;
  }

  return {
    STORAGE_KEY,
    DIMENSIONS,
    STATUS_LABELS,
    defaultConfig,
    normalizeConfig,
    loadConfig,
    saveConfig,
    dimensionMeta,
    enabledGroupDimensions,
    splitArrangeDimensions,
    isDimensionEnabled,
    isTreeEnabled,
    countSectionRows,
    normalizeTaskStatusBucket,
    rollupProjectStatus,
    rowStatusBucket,
    parentBlockStatusBucket,
    statusLabel,
    priorityLabel,
    buildProjectRows,
    buildTreeUnit,
    buildSections,
    attachMeetingRowsUnderTasks,
    meetingParentTaskId
  };
});
