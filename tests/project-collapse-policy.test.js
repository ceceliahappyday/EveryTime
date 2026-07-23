const assert = require("node:assert/strict");
const { filterProjectsForStatus, visibleTreeItems, shouldRenderSingleRow } = require("../project-collapse-policy");

const tasks = [
  { id: "phase-1", title: "阶段一", parentId: "project" },
  { id: "task-1", title: "任务一", parentId: "phase-1" },
  { id: "step-1", title: "步骤一", parentId: "task-1" },
  { id: "phase-2", title: "阶段二", parentId: "project" }
];

assert.deepEqual(
  visibleTreeItems({ tasks, collapsedIds: new Set(["phase-1"]) }).map(task => task.id),
  ["phase-1", "phase-2"],
  "collapsed task should remain visible while descendants are hidden"
);

assert.equal(
  shouldRenderSingleRow({ parent: { id: "solo" }, children: [{ id: "solo" }] }),
  true,
  "a task without parent or children should render as one gantt row"
);
assert.equal(
  shouldRenderSingleRow({ parent: { id: "project" }, children: [{ id: "child" }] }),
  false,
  "hierarchical projects should keep a project header and child tree"
);

assert.deepEqual(
  visibleTreeItems({ tasks, collapsedIds: new Set(["task-1"]) }).map(task => task.id),
  ["phase-1", "task-1", "phase-2"],
  "collapsed nested task should hide only its own descendants"
);

console.log("project collapse policy tests passed");

const projects = [
  { id: "p1", status: "planned" },
  { id: "p2", status: "in_progress" },
  { id: "p3", status: "ended" },
  { id: "p4", status: "unplanned" }
];

assert.deepEqual(
  filterProjectsForStatus(projects, "in_progress").map(project => project.id),
  ["p2"],
  "project gantt should use the selected status filter"
);

assert.deepEqual(
  filterProjectsForStatus(projects, "all").map(project => project.id),
  ["p1", "p2", "p3", "p4"],
  "project gantt should keep every project when no status filter is selected"
);
