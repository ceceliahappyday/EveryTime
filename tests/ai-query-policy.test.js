const assert = require("node:assert/strict");
const policy = require("../ai-query-policy.js");

const context = {
  period: { start: "2026-11-01", end: "2026-11-30" },
  tasks: [
    {
      id: "t1",
      title: "写报告",
      status: "in_progress",
      priority: "P1",
      owner: "A",
      category: "work",
      parentId: "",
      parentTitle: "",
      dueDate: "2026-11-20",
      createdAtIso: "2026-11-04T10:00:00.000Z",
      createdAt: "10:00",
      attentionOnly: false,
      setupIncomplete: false,
      progress: 40,
      businessBackground: "月度分析",
      scheduledHours: 2,
      actualHours: 1.5,
      notes: [{ date: "2026-11-04", start: "09:00", end: "10:30", hours: 1.5, note: "" }]
    },
    {
      id: "t2",
      title: "已完成项",
      status: "done",
      priority: "P2",
      owner: "A",
      category: "work",
      dueDate: "2026-11-10",
      createdAtIso: "2026-10-20T08:00:00.000Z",
      createdAt: "08:00",
      scheduledHours: 1,
      actualHours: 1,
      notes: [{ date: "2026-11-02", start: "14:00", end: "15:00", hours: 1, note: "" }]
    }
  ],
  calendarEntries: [
    { date: "2026-11-03", title: "部门例会", entryType: "calendar", hours: 1.5, isMeeting: true, start: "09:00", end: "10:30", note: "", owner: "A" },
    { date: "2026-11-04", title: "写报告", entryType: "task_work", hours: 1.5, isMeeting: false, start: "09:00", end: "10:30", note: "", taskId: "t1", taskTitle: "写报告" },
    { date: "2026-11-05", title: "面试", entryType: "calendar", category: "meeting", hours: 0.5, start: "14:00", end: "14:30", note: "" }
  ]
};

const metrics = policy.buildAiMetrics(context);
assert.equal(metrics.meetingHours, 2);
assert.equal(metrics.taskWorkHours, 1.5);
assert.equal(metrics.totalInvestedHours, 3.5);
assert.equal(metrics.meetingSharePercent, 57.14);
assert.equal(metrics.taskWorkSharePercent, 42.86);
assert.equal(metrics.openTaskCount, 1);
assert.equal(metrics.meetingEntryCount, 2);
assert.equal(metrics.createdInPeriodCount, 1);

assert.equal(policy.classifyAiIntent("请帮我统计本月工作时长总投入多少小时，其中会议投入多少小时"), "stats");
assert.equal(policy.classifyAiIntent("我是说会议投入占比多少"), "stats");
assert.equal(policy.classifyAiIntent("哪些任务未完成"), "list");
assert.equal(policy.classifyAiIntent("请总结本周的工作完成情况"), "summary");

const week = policy.resolveRelativePeriod("这周投入了哪些任务", "2026-11-24");
assert.equal(week.label, "本周");
assert.equal(week.start, "2026-11-23");
assert.equal(week.end, "2026-11-29");

const stats = policy.formatLocalStatsAnswer(metrics, context, "我是说会议投入占比多少");
assert.match(stats.displayText, /会议投入占比：57\.14%/);
assert.ok(stats.tables.length >= 1);

const slim = policy.slimContextForLlm(context, metrics, [
  { role: "user", text: "本月总投入多少" },
  { role: "assistant", text: "共 3.5 小时" }
]);
assert.equal(slim.conversation.length, 2);
assert.equal(slim.metrics.meetingSharePercent, 57.14);
assert.equal(slim.tasks[0].createdDate, "2026-11-04");
assert.equal(slim.tasks[0].createdAtIso, "2026-11-04T10:00:00.000Z");
assert.equal(slim.tasks[0].category, "work");
assert.equal(slim.tasks[0].businessBackground, "月度分析");
assert.ok(slim.tasks[0].workSessions.length >= 1);
assert.equal(slim.workLogs.length, 3);
assert.ok(slim.workLogs.some(item => item.kind === "task_work" && item.date === "2026-11-04" && item.start === "09:00"));
assert.match(slim.fieldGuide.createdAtIso, /创建时间/);
assert.equal(metrics.createdInPeriodCount, 1);

const list = policy.formatLocalListAnswer(context, "哪些任务未完成");
assert.match(list.displayText, /未完成任务共 1 项/);
assert.equal(list.tables[0].rows.length, 1);

assert.equal(slim.metrics.totalInvestedHours, 3.5);
assert.equal(slim.meetings.length, 2);
assert.ok(!("calendarEntries" in slim));

console.log("ai query policy tests passed");
