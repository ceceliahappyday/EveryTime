const assert = require("assert");
require("../task-work-policy.js");
const policy = global.TaskWorkPolicy;
const now = new Date(2026, 7, 10, 15, 0, 0);

assert.deepStrictEqual(policy.copyPlacement({ start: 12, end: 13 }, 14), { start: 14, end: 15 });
assert.deepStrictEqual(policy.copyPlacement({ start: 12, end: 14 }, 21), { start: 21, end: 22 });
assert.strictEqual(policy.copyPlacement({ start: 12, end: 12 }, 14), null);
assert.strictEqual(policy.copyPlacement({ start: 12, end: 13 }, 22), null);
assert.strictEqual(policy.statusForEntries([{ dateKey: "2026-08-10", start: 14 }], now), "in_progress");
assert.strictEqual(policy.statusForEntries([{ dateKey: "2026-08-10", start: 16 }], now), "planned");
assert.strictEqual(policy.statusForEntries([
  { dateKey: "2026-08-10", start: 16 },
  { dateKey: "2026-08-10", start: 9 }
], now), "in_progress");
assert.strictEqual(
  policy.rollupActualStartDateKey({ ownStartDateKey: "2026-09-01", investedDateKeys: ["2026-08-20", "2026-09-05"] }),
  "2026-08-20"
);
assert.strictEqual(
  policy.pickEarliestIso(["2026-09-01T10:00:00.000Z", "2026-08-01T09:00:00.000Z"]),
  "2026-08-01T09:00:00.000Z"
);

assert.strictEqual(
  policy.buildInvestmentNoteLine({
    dateKey: "2026-11-10",
    start: 9,
    end: 10.5,
    note: " 完成方案初稿 "
  }),
  "[投入 2026/11/10 09:00–10:30] 完成方案初稿"
);
const appended = policy.appendInvestmentNote({
  deliveryNote: "已有说明",
  dateKey: "2026-11-10",
  start: 9,
  end: 10,
  note: "完成方案初稿"
});
assert.strictEqual(appended.changed, true);
assert.match(appended.deliveryNote, /已有说明/);
assert.match(appended.deliveryNote, /\[投入 2026\/11\/10 09:00–10:00\] 完成方案初稿/);
const deduped = policy.appendInvestmentNote({
  deliveryNote: appended.deliveryNote,
  dateKey: "2026-11-10",
  start: 9,
  end: 10,
  note: "完成方案初稿"
});
assert.strictEqual(deduped.changed, false);

assert.strictEqual(
  policy.normalizeEntryNote({
    note: "对当前已下载的会计准则资料进行本地应用开发",
    title: "对当前已下载的会计准则资料进行本地应用开发"
  }),
  ""
);
assert.strictEqual(
  policy.shouldShowEntryNoteOnSchedule({
    note: "对当前已下载的会计准则资料进行本地应用开发",
    title: "对当前已下载的会计准则资料进行本地应用开发"
  }),
  false
);
assert.strictEqual(
  policy.shouldShowEntryNoteOnSchedule({
    note: "已完成字典检索接口",
    title: "对资料做本地开发"
  }),
  true
);
assert.strictEqual(
  policy.resolveScheduleEntryPrimaryText({
    note: "已完成字典检索接口",
    title: "对资料做本地开发"
  }),
  "已完成字典检索接口"
);
assert.strictEqual(
  policy.resolveScheduleEntrySecondaryText({
    note: "已完成字典检索接口",
    title: "对资料做本地开发"
  }),
  "对资料做本地开发"
);
assert.strictEqual(
  policy.resolveScheduleEntryPrimaryText({
    note: "",
    title: "新建时段标题"
  }),
  "新建时段标题"
);
assert.strictEqual(
  policy.resolveScheduleEntrySecondaryText({
    note: "",
    title: "新建时段标题"
  }),
  ""
);
assert.strictEqual(
  policy.resolveInvestmentNoteText({ note: "", title: "对资料做本地开发" }),
  "对资料做本地开发"
);
assert.strictEqual(
  policy.resolveInvestmentNoteText({
    note: "对资料做本地开发",
    title: "对资料做本地开发"
  }),
  "对资料做本地开发"
);
assert.strictEqual(
  policy.buildInvestmentNoteLine({
    dateKey: "2026-11-11",
    start: 15,
    end: 15.5,
    note: "",
    title: "对资料做本地开发"
  }),
  "[投入 2026/11/11 15:00–15:30] 对资料做本地开发"
);
assert.strictEqual(
  policy.buildInvestmentNoteLine({
    dateKey: "2026-11-11",
    start: 15,
    end: 15.5,
    note: ""
  }),
  "[投入 2026/11/11 15:00–15:30] 已投入"
);
const titleFallbackAppended = policy.appendInvestmentNote({
  deliveryNote: "",
  dateKey: "2026-11-11",
  start: 15,
  end: 15.5,
  note: "   ",
  title: "对资料做本地开发"
});
assert.strictEqual(titleFallbackAppended.changed, true);
assert.strictEqual(
  titleFallbackAppended.deliveryNote,
  "[投入 2026/11/11 15:00–15:30] 对资料做本地开发"
);
assert.strictEqual(
  policy.appendInvestmentNote({
    deliveryNote: titleFallbackAppended.deliveryNote,
    dateKey: "2026-11-11",
    start: 15,
    end: 15.5,
    note: "",
    title: "对资料做本地开发"
  }).changed,
  false
);

const progressAppended = policy.appendProgressUpdateNote({
  deliveryNote: "旧说明",
  note: "  完成初稿  ",
  now: new Date(2026, 10, 13, 9, 5)
});
assert.strictEqual(progressAppended.changed, true);
assert.strictEqual(
  progressAppended.deliveryNote,
  "旧说明\n[进度 11/13 09:05] 完成初稿"
);
assert.strictEqual(
  policy.appendProgressUpdateNote({ deliveryNote: "旧说明", note: "   " }).changed,
  false
);
assert.deepStrictEqual(
  policy.recentProgressPreview("a\nb\nc\nd", 2),
  ["c", "d"]
);

console.log("task work behavior tests passed");
