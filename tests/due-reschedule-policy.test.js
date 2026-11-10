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
  "first fill is not a reschedule"
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
assert.match(applied.deliveryNote, /已完成初稿/);
assert.match(applied.deliveryNote, /第 3 次/);
assert.match(applied.deliveryNote, /2026\/11\/01 18:00 → 2026\/11\/08 18:00/);

const untouched = policy.applyOnSave({
  previousDueDate: "",
  previousDueTime: "",
  nextDueDate: "2026-11-08",
  nextDueTime: "18:00",
  previousCount: 0,
  deliveryNote: "note"
});
assert.equal(untouched.changed, false);
assert.equal(untouched.count, 0);
assert.equal(untouched.deliveryNote, "note");

console.log("due reschedule policy tests passed");
