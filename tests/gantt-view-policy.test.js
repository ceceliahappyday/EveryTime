const assert = require("assert");
const policy = require("../gantt-view-policy.js");

const memory = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, value) { this.store[key] = String(value); }
};

const saved = policy.saveConfig({
  holidayMode: "weekend",
  excludeHolidaysFromDays: true,
  ownerFilter: ["王芳", ""]
}, memory);
assert.strictEqual(saved.holidayMode, "weekend");
assert.equal(saved.excludeHolidaysFromDays, true);
assert.deepStrictEqual(saved.ownerFilter, ["王芳"]);

const loaded = policy.loadConfig(memory);
assert.deepStrictEqual(loaded.ownerFilter, ["王芳"]);

const owners = policy.collectOwners([
  { owner: "王芳,李明" },
  { owner: "王芳" },
  { owner: "未指定" }
], owner => String(owner || "").split(/[,，]/).map(part => part.trim()).filter(Boolean));
assert.deepStrictEqual(owners, ["李明", "王芳"]);

assert.equal(policy.taskMatchesOwnerFilter({ owner: "王芳,李明" }, ["李明"]), true);
assert.equal(policy.taskMatchesOwnerFilter({ owner: "王芳" }, ["李明"]), false);
assert.equal(policy.taskMatchesOwnerFilter({ owner: "王芳" }, []), true);

const fromDateKey = key => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};
assert.equal(policy.isHolidayColumn({
  dateKey: "2026-10-10",
  holidayMode: "weekend",
  holidays: {},
  fromDateKey
}), true, "Saturday should mark as holiday column in weekend mode");
assert.equal(policy.isHolidayColumn({
  dateKey: "2026-10-12",
  holidayMode: "weekend_holiday",
  holidays: { "2026-10-12": { name: "测试", type: "holiday" } },
  fromDateKey
}), true);
assert.equal(policy.isHolidayColumn({
  dateKey: "2026-10-12",
  holidayMode: "off",
  holidays: { "2026-10-12": { name: "测试", type: "holiday" } },
  fromDateKey
}), false);

console.log("gantt view policy tests passed");
