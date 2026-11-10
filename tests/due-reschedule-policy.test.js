const assert = require("node:assert/strict");
const policy = require("../due-reschedule-policy.js");

assert.equal(
  policy.isReschedule(
    { dueDate: "2026-11-01", dueTime: "18:00" },
    { dueDate: "2026-11-08", dueTime: "18:00" }
  ),
  true
);
assert.equal(
  policy.isReschedule({ dueDate: "", dueTime: "" }, { dueDate: "2026-11-08", dueTime: "18:00" }),
  false,
  "first fill is not a reschedule count"
);
assert.equal(
  policy.isFirstSchedule({ dueDate: "", dueTime: "" }, { dueDate: "2026-11-08", dueTime: "18:00" }),
  true,
  "empty to filled is a first schedule log"
);
assert.equal(
  policy.isReschedule({ dueDate: "2026-11-08", dueTime: "18:00" }, { dueDate: "", dueTime: "" }),
  false,
  "clearing due is not a reschedule"
);
assert.equal(
  policy.isReschedule(
    { dueDate: "2026-11-08", dueTime: "18:00" },
    { dueDate: "2026-11-08", dueTime: "18:00" }
  ),
  false
);
assert.equal(
  policy.isReschedule(
    { dueDate: "2026-07-16", dueTime: "" },
    { dueDate: "2026-07-16", dueTime: "18:00" },
    "18:00"
  ),
  false,
  "filling only the displayed default time is not a reschedule"
);

const applied = policy.applyOnSave({
  previousDueDate: "2026-11-01",
  previousDueTime: "18:00",
  nextDueDate: "2026-11-08",
  nextDueTime: "18:00",
  previousCount: 2,
  deliveryNote: "已完成初稿",
  now: new Date("2026-11-10T02:05:00")
});
assert.equal(applied.changed, true);
assert.equal(applied.count, 3);
assert.equal(applied.kind, "reschedule");
assert.match(applied.deliveryNote, /已完成初稿/);
assert.match(applied.deliveryNote, /第 3 次/);
assert.match(applied.deliveryNote, /2026\/11\/01 18:00 → 2026\/11\/08 18:00/);

const firstFill = policy.applyOnSave({
  previousDueDate: "",
  previousDueTime: "",
  nextDueDate: "2026-11-17",
  nextDueTime: "18:00",
  previousCount: 0,
  deliveryNote: "",
  now: new Date("2026-11-10T07:50:00"),
  defaultTime: "18:00"
});
assert.equal(firstFill.changed, true);
assert.equal(firstFill.count, 0, "first schedule does not increment reschedule count");
assert.equal(firstFill.kind, "first");
assert.match(firstFill.deliveryNote, /\[设定目标/);
assert.match(firstFill.deliveryNote, /（空） → 2026\/11\/17 18:00/);

const timeOnly = policy.applyOnSave({
  previousDueDate: "2026-07-16",
  previousDueTime: "",
  nextDueDate: "2026-07-16",
  nextDueTime: "18:00",
  previousCount: 0,
  deliveryNote: "keep",
  defaultTime: "18:00"
});
assert.equal(timeOnly.changed, false);
assert.equal(timeOnly.count, 0);
assert.equal(timeOnly.deliveryNote, "keep");

const cleared = policy.applyOnSave({
  previousDueDate: "2026-11-08",
  previousDueTime: "18:00",
  nextDueDate: "",
  nextDueTime: "",
  previousCount: 1,
  deliveryNote: "note"
});
assert.equal(cleared.changed, false);
assert.equal(cleared.count, 1);
assert.equal(cleared.deliveryNote, "note");

console.log("due reschedule policy tests passed");
