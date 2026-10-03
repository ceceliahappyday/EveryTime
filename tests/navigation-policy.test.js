const assert = require("node:assert/strict");
const policy = require("../navigation-policy.js");

const fromDateKey = key => {
  const [y, m, d] = String(key).split("-").map(Number);
  return new Date(y, m - 1, d);
};
const toDateKey = date =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const addDays = (date, days) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};
const getMonday = date => {
  const copy = new Date(date);
  const offset = copy.getDay() === 0 ? 6 : copy.getDay() - 1;
  copy.setDate(copy.getDate() - offset);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

assert.strictEqual(policy.shouldShowDateNav("project"), false);
assert.strictEqual(policy.shouldShowDateNav("day"), true);

assert.strictEqual(
  policy.moveDateKey({
    dateKey: "2026-09-01",
    view: "day",
    direction: 1,
    addDays,
    fromDateKey,
    toDateKey,
    getMonday
  }),
  "2026-09-02"
);

assert.strictEqual(
  policy.moveDateKey({
    dateKey: "2026-09-07",
    view: "week",
    direction: 1,
    addDays,
    fromDateKey,
    toDateKey,
    getMonday
  }),
  "2026-09-14"
);

assert.strictEqual(
  policy.moveDateKey({
    dateKey: "2026-09-01",
    view: "month",
    direction: 1,
    addDays,
    fromDateKey,
    toDateKey,
    getMonday
  }),
  "2026-10-01"
);

assert.match(
  policy.formatNavTitle({
    view: "day",
    dateKey: "2026-09-01",
    fromDateKey,
    toDateKey,
    getMonday,
    addDays
  }),
  /2026年 9月1日/
);

console.log("navigation policy tests passed");
