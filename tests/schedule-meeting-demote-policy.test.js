const assert = require("assert");
const {
  isMeetingEventTitle,
  demoteMeetingEventTasks
} = require("../schedule-meeting-demote-policy.js");

assert.equal(isMeetingEventTitle("2026年07月集团财务月度会议"), true);
assert.equal(isMeetingEventTitle("月度小组工作例会"), true);
assert.equal(isMeetingEventTitle("2026年度7月部门例会"), true);
assert.equal(isMeetingEventTitle("7月财务例会会议纪要修改"), false);
assert.equal(isMeetingEventTitle("完成月度财务例会通报材料的更新"), false);
assert.equal(isMeetingEventTitle("BPC需求沟通会议纪要修改"), false);

const data = {
  "2026-07-22": {
    note: "",
    tasks: [
      { id: "review", title: "月度工作复盘", parentId: "", status: "planned", dueDate: "2026-07-25" },
      { id: "meeting", title: "2026年07月集团财务月度会议", parentId: "review", status: "done", dueDate: "2026-07-22" },
      { id: "meeting-leaf", title: "2026年07月集团财务月度会议", parentId: "meeting", status: "in_progress", dueDate: "2026-07-22" },
      { id: "minutes", title: "7月财务例会会议纪要修改", parentId: "meeting", status: "in_progress", dueDate: "2026-07-29" },
      { id: "standup", title: "月度小组工作例会", parentId: "review", status: "done", dueDate: "2026-07-09" }
    ],
    entries: [
      { id: "e1", title: "2026年07月集团财务月度会议", entryType: "task_work", taskId: "meeting-leaf", start: 9, end: 11 },
      { id: "e2", title: "7月财务例会会议纪要修改", entryType: "task_work", taskId: "minutes", start: 14, end: 15 },
      { id: "e3", title: "月度小组工作例会", entryType: "task_work", taskId: "standup", start: 10, end: 11 }
    ]
  }
};

const result = demoteMeetingEventTasks(data);
assert.equal(result.changed, true);
assert.equal(data["2026-07-22"].entries[0].entryType, "calendar");
assert.equal(data["2026-07-22"].entries[0].taskId, "");
assert.equal(data["2026-07-22"].entries[2].entryType, "calendar");

const tasks = data["2026-07-22"].tasks;
assert.ok(!tasks.some(task => task.id === "meeting"), "meeting container task removed");
assert.ok(!tasks.some(task => task.id === "meeting-leaf"), "duplicate meeting leaf removed");
assert.ok(!tasks.some(task => task.id === "standup"), "standalone meeting leaf removed");
const minutes = tasks.find(task => task.id === "minutes");
assert.ok(minutes, "follow-up work kept");
assert.equal(minutes.parentId, "review", "follow-up reparented to grandparent");
assert.equal(data["2026-07-22"].entries[1].taskId, "minutes");
assert.equal(data["2026-07-22"].entries[1].entryType, "task_work");

const again = demoteMeetingEventTasks(data);
assert.equal(again.changed, false, "demote must be idempotent");

console.log("schedule meeting demote policy tests passed");
