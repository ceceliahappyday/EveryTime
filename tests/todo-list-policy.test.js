const assert = require("assert");
const policy = require("../todo-list-policy.js");
const tasks = [
  { id: "root", title: "资产管理", status: "planned" },
  { id: "child", title: "员工培训", parentId: "root", status: "in_progress" },
  { id: "leaf", title: "准备材料", parentId: "child", status: "planned" },
  { id: "solo", title: "准备材料", status: "planned" }
];
const hasChildTasks = id => id === "root" || id === "child";

assert.strictEqual(policy.isLeafTask(tasks[0], hasChildTasks), false);
assert.strictEqual(policy.hasDisplayTitle("  有标题  "), true);
assert.strictEqual(policy.hasDisplayTitle("   "), false);
assert.strictEqual(policy.hasDisplayTitle(""), false);
assert.strictEqual(policy.hasDisplayTitle(null), false);
assert.strictEqual(policy.isLeafTask(tasks[3], hasChildTasks), true);
assert.strictEqual(policy.canLinkEntryToTask(tasks[0], hasChildTasks), false);
assert.strictEqual(policy.canLinkEntryToTask(tasks[3], hasChildTasks), true);

const similar = policy.findSimilarTasks({ title: "准备材料", tasks, hasChildTasks });
assert.strictEqual(similar.length, 2);
assert.strictEqual(similar[0].task.id, "leaf");

const entriesByDate = {
  "2026-08-26": [{ taskId: "leaf", entryType: "task_work" }],
  "2026-08-27": []
};
const groups = policy.buildTodoGroups({
  tasks: [tasks[1], tasks[2], tasks[3]],
  selectedDate: "2026-08-27",
  yesterdayKey: "2026-08-26",
  entriesByDate,
  isOngoingTask: task => task.status === "in_progress",
  isUnplannedTask: () => false,
  hasChildTasks,
  includeSections: true
});
assert.strictEqual(groups.continueToday.length, 1);
assert.strictEqual(groups.continueYesterday[0].id, "leaf");
assert.ok(policy.hasWorkHistory("leaf", entriesByDate));

const parentLinked = policy.parentLinkedWorkItems({
  entriesByDate: {
    "2026-08-26": [{
      id: "entry-1",
      taskId: "root",
      entryType: "task_work",
      title: "完成科技园盈利结构表"
    }],
    "2026-08-27": [{
      id: "entry-2",
      taskId: "root",
      entryType: "task_work",
      title: "完成科技园盈利结构表"
    }]
  },
  tasks,
  selectedDate: "2026-08-27",
  yesterdayKey: "2026-08-26",
  hasChildTasks
});
assert.strictEqual(parentLinked.length, 1);
assert.strictEqual(parentLinked[0].title, "完成科技园盈利结构表");
assert.strictEqual(parentLinked[0].parentTitle, "资产管理");
assert.strictEqual(parentLinked[0].isFromYesterday, true);
assert.strictEqual(parentLinked[0].entryId, "entry-1");

assert.strictEqual(policy.DEFAULT_FILTER, "in_progress");
assert.ok(policy.VALID_FILTERS.has("in_progress"));
assert.ok(policy.VALID_FILTERS.has("memo"));
assert.ok(policy.VALID_FILTERS.has("meeting"));

assert.strictEqual(policy.isAwaitingSchedule({
  task: { id: "memo", status: "tracking" },
  selectedDate: "2026-08-27",
  entriesByDate,
  isUnplannedTask: () => false,
  isOngoingTask: () => false,
  hasChildTasks: () => false
}), false);

const reviewPool = [
  { id: "root", title: "资产管理", status: "in_progress" },
  { id: "child", title: "员工培训", parentId: "root", status: "in_progress" },
  { id: "leaf", title: "准备材料", parentId: "child", status: "in_progress" },
  { id: "solo", title: "独立待办", status: "in_progress" },
  { id: "idle-leaf", title: "尚未投入", parentId: "child", status: "in_progress" }
];
const reviewHasChildren = id => id === "root" || id === "child";
const reviewCandidates = policy.progressReviewCandidates({
  tasks: reviewPool,
  hasChildTasks: reviewHasChildren,
  isActive: task => task.status === "in_progress",
  hasInvestedWork: task => task.id === "leaf" || task.id === "solo"
});
assert.deepStrictEqual(reviewCandidates.map(task => task.id), ["leaf", "solo"]);
assert.strictEqual(
  policy.isProgressReviewCandidate({
    task: reviewPool[0],
    hasChildTasks: reviewHasChildren,
    isActive: () => true,
    hasInvestedWork: () => true
  }),
  false,
  "top-level plan nodes should not appear in progress review"
);

const byCreatedDesc = policy.sortByCreatedAtDesc([
  { id: "old", title: "旧", createdAtIso: "2026-09-01T08:00:00.000Z" },
  { id: "new", title: "新", createdAtIso: "2026-09-17T10:00:00.000Z" },
  { id: "mid", title: "中", createdAtIso: "2026-09-10T12:00:00.000Z" }
]);
assert.deepStrictEqual(byCreatedDesc.map(task => task.id), ["new", "mid", "old"], "created-desc helper keeps newest first");

const byCreatedAsc = policy.sortByCreatedAtAsc([
  { id: "old", title: "旧", createdAtIso: "2026-09-01T08:00:00.000Z" },
  { id: "new", title: "新", createdAtIso: "2026-09-17T10:00:00.000Z" },
  { id: "mid", title: "中", createdAtIso: "2026-09-10T12:00:00.000Z" }
]);
assert.deepStrictEqual(byCreatedAsc.map(task => task.id), ["old", "mid", "new"], "unplanned/closed should list earliest created tasks first");

const byDue = policy.sortByDueDateAsc([
  { id: "late", title: "晚", dueDate: "2026-11-20", dueTime: "18:00", createdAtIso: "2026-01-01T00:00:00.000Z" },
  { id: "early", title: "早", dueDate: "2026-11-10", dueTime: "09:00", createdAtIso: "2026-01-02T00:00:00.000Z" },
  { id: "none", title: "无", dueDate: "", createdAtIso: "2026-01-03T00:00:00.000Z" },
  { id: "mid", title: "中", dueDate: "2026-11-15", dueTime: "12:00", createdAtIso: "2026-01-04T00:00:00.000Z" }
]);
assert.deepStrictEqual(byDue.map(task => task.id), ["early", "mid", "late", "none"], "planned tasks should order by due date ascending");

const statusSections = policy.buildStatusSections({
  tasks: [
    { id: "done-1", title: "关", status: "done", createdAtIso: "2026-10-01T08:00:00.000Z" },
    { id: "track-1", title: "跟", status: "in_progress", attentionOnly: true, dueDate: "2026-11-12" },
    { id: "doing-1", title: "做", status: "in_progress" },
    { id: "plan-1", title: "计", status: "planned", dueDate: "2026-11-18" },
    { id: "inbox-1", title: "收", status: "planned", createdAtIso: "2026-10-05T08:00:00.000Z" }
  ],
  entriesByDate: {
    "2026-11-01": [{ taskId: "doing-1", entryType: "task_work", start: 10, end: 11 }]
  },
  isOngoingTask: task => task.status === "in_progress",
  isUnplannedTask: task => task.status === "planned" && !task.dueDate,
  isAttentionOnly: task => Boolean(task.attentionOnly),
  isEndedStatus: status => status === "done" || status === "closed"
});
assert.deepStrictEqual(
  statusSections.map(section => section.key),
  ["in_progress", "planned", "unplanned", "tracking", "ended"],
  "all-tasks section order must be 进行中 → 计划中 → 未计划 → 待跟踪 → 已关闭"
);
assert.deepStrictEqual(statusSections.map(section => section.label), ["进行中", "计划中", "未计划", "待跟踪", "已关闭"]);
assert.ok(!statusSections.find(section => section.key === "in_progress").tasks.some(task => task.id === "track-1"), "attention tasks belong only in 待跟踪 within 全部任务");

const investEntries = {
  "2026-10-17": [
    { taskId: "older", entryType: "task_work", start: 9, end: 10 },
    { taskId: "newer", entryType: "task_work", start: 14, end: 15 }
  ],
  "2026-10-18": [
    { taskId: "newest", entryType: "task_work", start: 10, end: 11.5 }
  ]
};
assert.ok(
  policy.taskLatestInvestMs("newest", investEntries) > policy.taskLatestInvestMs("newer", investEntries),
  "later invest day must win"
);
assert.ok(
  policy.taskLatestInvestMs("newer", investEntries) > policy.taskLatestInvestMs("older", investEntries),
  "later invest hour on same day must win"
);
const byInvest = policy.sortByLatestInvestDesc(
  [
    { id: "older", title: "早", createdAtIso: "2026-10-18T12:00:00.000Z" },
    { id: "newest", title: "新", createdAtIso: "2026-10-01T08:00:00.000Z" },
    { id: "newer", title: "中", createdAtIso: "2026-10-02T08:00:00.000Z" },
    { id: "idle", title: "无投入", createdAtIso: "2026-10-19T08:00:00.000Z" }
  ],
  investEntries
);
assert.deepStrictEqual(
  byInvest.map(task => task.id),
  ["newest", "newer", "older", "idle"],
  "in-progress list should order by latest schedule invest, newest first"
);

const mergedFields = policy.mergeTaskFieldUpdates(
  {
    id: "keep",
    title: "主",
    category: "work",
    owner: "甲",
    priority: "kpi",
    parentId: "p1",
    dueDate: "2026-11-10",
    dueTime: "12:00",
    startedAt: "2026-11-08T10:00:00.000Z",
    completedAt: "",
    description: "主说明",
    progress: 20
  },
  [
    {
      id: "a",
      dueDate: "2026-11-20",
      dueTime: "18:00",
      startedAt: "2026-11-01T08:00:00.000Z",
      completedAt: "2026-11-15T18:00:00.000Z",
      description: "支说明",
      progress: 40
    }
  ]
);
assert.equal(mergedFields.category, "work", "survivor category wins");
assert.equal(mergedFields.owner, "甲", "survivor owner wins");
assert.equal(mergedFields.startedAt, "2026-11-01T08:00:00.000Z", "start uses earlier timestamp");
assert.equal(mergedFields.completedAt, "2026-11-15T18:00:00.000Z", "end uses later timestamp");
assert.equal(mergedFields.dueDate, "2026-11-20", "due date uses later plan");
assert.equal(mergedFields.dueTime, "18:00");
assert.match(mergedFields.description, /主说明/);
assert.match(mergedFields.description, /支说明/);
assert.equal(mergedFields.progress, 40);

const meetingSamples = [
  { title: "远", dateKey: "2026-11-24", start: 14, phase: "planned" },
  { title: "近", dateKey: "2026-11-05", start: 9, phase: "planned" },
  { title: "同天晚", dateKey: "2026-11-05", start: 17, phase: "planned" }
];
assert.deepStrictEqual(
  policy.sortMeetingsByScheduleAsc(meetingSamples).map(item => item.title),
  ["近", "同天晚", "远"],
  "meeting tabs must list earliest schedule first"
);
const meetingSections = policy.buildMeetingAllSections([
  { title: "旧", dateKey: "2026-10-01", start: 9, phase: "ended" },
  { title: "将来", dateKey: "2026-12-01", start: 10, phase: "planned" },
  { title: "现在", dateKey: "2026-11-05", start: 11, phase: "in_progress" }
]);
assert.deepStrictEqual(
  meetingSections.map(section => section.key),
  ["meeting-planned", "meeting-in_progress", "meeting-ended"],
  "all-meetings sections must be 计划中 → 进行中 → 已结束"
);

console.log("todo list policy tests passed");
