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
  ownerFilter: ["王芳", ""],
  categoryFilter: ["work"],
  priorityFilter: ["kpi", "follow_up"],
  investedOnly: true,
  labelColumns: { status: true, priority: true, owner: false, category: true }
}, memory);
assert.strictEqual(saved.holidayMode, "weekend");
assert.equal(saved.excludeHolidaysFromDays, true);
assert.deepStrictEqual(saved.ownerFilter, ["王芳"]);
assert.deepStrictEqual(saved.categoryFilter, ["work"]);
assert.deepStrictEqual(saved.priorityFilter, ["kpi", "general_daily"]);
assert.equal(saved.investedOnly, true);
assert.deepStrictEqual(saved.statusFilter, ["planned", "in_progress"]);
assert.deepStrictEqual(saved.labelColumns, { status: true, priority: true, owner: false, category: true });

const loaded = policy.loadConfig(memory);
assert.deepStrictEqual(loaded.ownerFilter, ["王芳"]);
assert.deepStrictEqual(loaded.statusFilter, ["planned", "in_progress"]);
assert.deepStrictEqual(loaded.priorityFilter, ["kpi", "general_daily"]);
assert.equal(policy.activeLabelColumnCount(loaded), 3);
assert.deepStrictEqual(policy.effectiveMemberFilters({
  ...loaded,
  labelColumns: { status: false, priority: true, owner: false, category: false }
}).priorityFilter, ["kpi", "general_daily"]);
assert.deepStrictEqual(policy.effectiveMemberFilters({
  ...loaded,
  labelColumns: { status: false, priority: false, owner: false, category: false }
}).statusFilter, []);

// Explicit empty status filter means show all
const allStatuses = policy.normalizeConfig({ statusFilter: [] });
assert.deepStrictEqual(allStatuses.statusFilter, []);

const owners = policy.collectOwners([
  { owner: "王芳,李明" },
  { owner: "王芳" },
  { owner: "未指定" }
], owner => String(owner || "").split(/[,，]/).map(part => part.trim()).filter(Boolean));
assert.deepStrictEqual(owners, ["李明", "王芳"]);

assert.equal(policy.taskMatchesOwnerFilter({ owner: "王芳,李明" }, ["李明"]), true);
assert.equal(policy.taskMatchesOwnerFilter({ owner: "王芳" }, ["李明"]), false);
assert.equal(policy.taskMatchesOwnerFilter({ owner: "王芳" }, []), true);

assert.equal(policy.taskMatchesStatusFilter({ status: "done" }, ["planned", "in_progress"]), false);
assert.equal(policy.taskMatchesStatusFilter({ status: "closed" }, ["done"]), true);
assert.equal(policy.taskMatchesStatusFilter({ status: "tracking" }, []), true);

assert.equal(policy.taskMatchesPriorityFilter({ priority: "kpi" }, []), true);
assert.equal(policy.taskMatchesPriorityFilter({ priority: "kpi" }, ["kpi"]), true);
assert.equal(policy.taskMatchesPriorityFilter({ priority: "general_daily" }, ["kpi"]), false);
assert.equal(policy.taskMatchesPriorityFilter({ priority: "follow_up" }, ["general_daily"]), true);
assert.equal(policy.taskMatchesFilters({
  status: "planned",
  owner: "王芳",
  category: "work",
  priority: "kpi"
}, {
  statusFilter: ["planned"],
  ownerFilter: [],
  categoryFilter: [],
  priorityFilter: ["general_daily"]
}), false);
assert.equal(policy.taskMatchesFilters({
  status: "planned",
  owner: "王芳",
  category: "work",
  priority: "kpi"
}, {
  statusFilter: ["planned"],
  priorityFilter: ["kpi"]
}), true);

assert.deepStrictEqual(
  policy.enabledLabelColumns({ labelColumns: { status: true, priority: true, owner: false, category: true } }).map(item => item.id),
  ["status", "priority", "category"]
);
assert.deepStrictEqual(policy.normalizeLabelColumns(undefined), {
  status: false,
  priority: false,
  owner: false,
  category: false
});
assert.ok(policy.LABEL_COLUMN_OPTIONS.some(item => item.id === "status"));

assert.equal(policy.taskHasInvestedInWindow({
  investedDateKeys: ["2026-10-12"],
  startKey: "2026-10-01",
  endKey: "2026-10-31",
  scale: "month"
}), true);
assert.equal(policy.taskHasInvestedInWindow({
  investedDateKeys: ["2026-09-30"],
  startKey: "2026-10-01",
  endKey: "2026-10-31",
  scale: "month"
}), false);
assert.equal(policy.taskHasInvestedInWindow({
  investedDateKeys: ["2026-03-15"],
  startKey: "2026-01",
  endKey: "2026-12",
  scale: "year"
}), true);
assert.equal(policy.taskHasInvestedInWindow({
  investedDateKeys: ["2026-10-10", "2026-10-20"],
  startKey: "2026-10-12",
  endKey: "2026-10-18",
  scale: "week"
}), false, "week invested-only must ignore investment outside the visible week");
assert.equal(policy.taskHasInvestedInWindow({
  investedDateKeys: ["2026-10-10", "2026-10-15"],
  startKey: "2026-10-12",
  endKey: "2026-10-18",
  scale: "week"
}), true);
assert.equal(policy.taskHasInvestedInWindow({
  investedDateKeys: ["2026-10-15"],
  startKey: "2026-10-15",
  endKey: "2026-10-15",
  scale: "day"
}), true);
assert.equal(policy.taskHasInvestedInWindow({
  investedDateKeys: ["2026-10-14"],
  startKey: "2026-10-15",
  endKey: "2026-10-15",
  scale: "day"
}), false);

const tree = policy.filterProjectTree({
  parent: { id: "root", parentId: "", status: "planned", owner: "A" },
  children: [
    { id: "mid", parentId: "root", status: "planned", owner: "A" },
    { id: "leaf", parentId: "mid", status: "in_progress", owner: "B" },
    { id: "other", parentId: "root", status: "done", owner: "A" }
  ],
  matchesTask: task => task.id === "leaf"
});
assert.equal(tree.keep, true);
assert.deepStrictEqual(tree.children.map(item => item.id).sort(), ["leaf", "mid"]);
assert.equal(tree.contextIds.has("root"), true);
assert.equal(tree.contextIds.has("mid"), true);
assert.equal(tree.matchIds.has("leaf"), true);

assert.ok(policy.activeFilterCount(policy.defaultConfig()) === 0);
assert.ok(policy.activeFilterCount({ ...policy.defaultConfig(), investedOnly: true }) >= 1);
assert.ok(policy.activeFilterCount({
  ...policy.defaultConfig(),
  labelColumns: { ...policy.defaultConfig().labelColumns, priority: true },
  priorityFilter: ["kpi"]
}) >= 1);
assert.equal(policy.activeFilterCount({
  ...policy.defaultConfig(),
  priorityFilter: ["kpi"]
}), 0, "hidden columns must not contribute to filter count");

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
