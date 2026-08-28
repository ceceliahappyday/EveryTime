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

console.log("todo list policy tests passed");
