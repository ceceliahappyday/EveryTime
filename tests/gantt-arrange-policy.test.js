const assert = require("node:assert/strict");
const policy = require("../gantt-arrange-policy.js");

const classify = policy.rollupProjectStatus;
const parent = { id: "p", title: "父", status: "planned", owner: "我", priority: "kpi", category: "work" };
const childActive = { id: "c1", title: "进行中子", status: "in_progress", parentId: "p", owner: "我", priority: "kpi", category: "study" };
const childDone = { id: "c2", title: "已结束子", status: "done", parentId: "p", owner: "张三", priority: "general_daily", category: "life" };
const project = {
  parent,
  children: [parent, childActive, childDone],
  summaryTasks: [childActive, childDone]
};

assert.equal(policy.DIMENSIONS.some(dim => dim.id === "projectStatus"), false, "project status removed");
assert.equal(policy.dimensionMeta("taskTree").label, "任务项");
assert.equal(policy.dimensionMeta("category").label, "分类");
assert.ok(policy.DIMENSIONS.some(dim => dim.id === "category"), "category arrange dimension available");

const defaults = policy.defaultConfig();
assert.ok(defaults.dimensions.find(dim => dim.id === "taskTree")?.enabled);
assert.ok(defaults.dimensions.find(dim => dim.id === "taskStatus")?.enabled);
assert.equal(defaults.dimensions.find(dim => dim.id === "owner")?.enabled, false);

assert.equal(
  policy.parentBlockStatusBucket({
    task: parent,
    descendantTasks: [childActive, childDone],
    classifyProjectStatus: classify
  }),
  "in_progress"
);
assert.equal(
  policy.parentBlockStatusBucket({
    task: parent,
    descendantTasks: [childDone],
    classifyProjectStatus: classify
  }),
  "planned",
  "open parent not forced into ended when only children closed"
);

const buildArgs = {
  projects: [project],
  collapsedSections: new Set(),
  collapsedTasks: new Set(),
  visibleTreeItems: ({ tasks }) => tasks.filter(task => task.id !== parent.id),
  shouldRenderSingleRow: () => false,
  classifyProjectStatus: classify,
  getChildTasks: id => [childActive, childDone].filter(task => task.parentId === id)
};

// A: 树 → 状态 → 责任人
const treeFirst = policy.normalizeConfig({
  dimensions: [
    { id: "taskTree", enabled: true },
    { id: "taskStatus", enabled: true },
    { id: "owner", enabled: true },
    { id: "priority", enabled: false }
  ]
});
const treeSplit = policy.splitArrangeDimensions(treeFirst);
assert.deepEqual(treeSplit.sectionDimensions.map(d => d.id), []);
assert.deepEqual(treeSplit.withinTreeDimensions.map(d => d.id), ["taskStatus", "owner"]);

const treeSections = policy.buildSections({ ...buildArgs, config: treeFirst });
assert.equal(treeSections[0].label, "任务");
const unit = treeSections[0].children[0];
assert.equal(unit.rows[0].task.id, "p", "parent first");
const statusGroups = unit.children;
assert.ok(statusGroups.some(g => g.label === "进行中"));
assert.ok(statusGroups.some(g => g.label === "已结束"));
const endedGroup = statusGroups.find(g => g.label === "已结束");
assert.ok(
  endedGroup.children?.length || endedGroup.rows.some(r => r.task.id === "c2"),
  "closed child stays under parent in within-tree 已结束"
);
assert.ok(
  !treeSections.some(s => s.label === "已结束" && s.rows?.some(r => r.task.id === "c2")),
  "closed child must not teleport to outer 已结束"
);

// owner nested under status within tree
const inProgress = statusGroups.find(g => g.label === "进行中");
assert.ok(inProgress);
if (inProgress.children?.length) {
  assert.ok(inProgress.children.some(g => String(g.label).includes("责任人")));
} else {
  assert.ok(inProgress.rows.some(r => r.task.id === "c1"));
}

// B: 状态 → 树 —— 外层按父块，一家不拆
const statusFirst = policy.normalizeConfig({
  dimensions: [
    { id: "taskStatus", enabled: true },
    { id: "taskTree", enabled: true }
  ]
});
const statusSplit = policy.splitArrangeDimensions(statusFirst);
assert.deepEqual(statusSplit.sectionDimensions.map(d => d.id), ["taskStatus"]);
assert.deepEqual(statusSplit.withinTreeDimensions.map(d => d.id), []);

const statusSections = policy.buildSections({ ...buildArgs, config: statusFirst });
const progress = statusSections.find(s => s.key === "in_progress" || s.label === "进行中");
const ended = statusSections.find(s => s.key === "ended" || s.label === "已结束");
assert.ok(progress, "outer 进行中");
assert.ok(!ended || policy.countSectionRows(ended) === 0, "no outer 已结束 family split when parent open");

const progressUnit = (progress.children || []).find(child => child.silent || child.rows?.[0]?.task?.id === "p");
assert.ok(progressUnit, "whole parent block under 进行中");
assert.equal(progressUnit.rows[0].task.id, "p");
const childIds = [];
const walk = node => {
  (node.rows || []).forEach(r => childIds.push(r.task.id));
  (node.children || []).forEach(walk);
};
walk(progressUnit);
assert.ok(childIds.includes("c1"), "active child stays with parent block");
assert.ok(childIds.includes("c2"), "closed child stays with open parent block (Notion-style)");

// legacy projectStatus dropped
const legacy = policy.normalizeConfig({
  dimensions: [
    { id: "projectStatus", enabled: true },
    { id: "taskTree", enabled: true },
    { id: "meetings", enabled: true }
  ]
});
assert.equal(legacy.dimensions.some(d => d.id === "projectStatus"), false);
assert.equal(legacy.dimensions.some(d => d.id === "meetings"), false);

// flat mode without tree
const flat = policy.normalizeConfig({
  dimensions: [
    { id: "taskStatus", enabled: true },
    { id: "taskTree", enabled: false },
    { id: "owner", enabled: true }
  ]
});
const flatSections = policy.buildSections({ ...buildArgs, config: flat });
assert.ok(flatSections.some(s => s.label === "进行中" || s.key === "in_progress"));

// category / 标签 as arrange dimension
const byTag = policy.normalizeConfig({
  dimensions: [
    { id: "category", enabled: true },
    { id: "taskTree", enabled: false }
  ]
});
const tagSections = policy.buildSections({
  ...buildArgs,
  config: byTag,
  resolveCategory: task => task.category || "work",
  categoryLabel: id => ({ work: "工作", study: "学习", life: "生活" })[id] || id
});
assert.ok(tagSections.some(s => s.label === "学习"), "tag arrange groups by category label");
assert.ok(tagSections.some(s => s.label === "生活"));

console.log("gantt arrange policy tests passed");
