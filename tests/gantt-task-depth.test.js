const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const start = appSource.indexOf("function getTaskDepth");
const end = appSource.indexOf("\nfunction ", start + 1);
assert.ok(start >= 0 && end > start, "getTaskDepth function should exist");

const findTaskImpl = `
  const catalog = new Map(Object.entries({
    root: { id: "root", parentId: "" },
    child: { id: "child", parentId: "root" },
    grand: { id: "grand", parentId: "child" },
    orphan: { id: "orphan", parentId: "missing" }
  }));
  function findTask(id) {
    const task = catalog.get(id);
    return task ? { task, dateKey: "2026-01-01" } : null;
  }
`;

const sandbox = { console };
vm.createContext(sandbox);
vm.runInContext(`${findTaskImpl}\n${appSource.slice(start, end)}\nthis.getTaskDepth = getTaskDepth;`, sandbox);

assert.equal(sandbox.getTaskDepth({ id: "root", parentId: "" }, "root"), 0);
assert.equal(sandbox.getTaskDepth({ id: "child", parentId: "root" }, "root"), 1);
assert.equal(sandbox.getTaskDepth({ id: "grand", parentId: "child" }, "root"), 2);
assert.equal(sandbox.getTaskDepth({ id: "orphan", parentId: "missing" }, "root"), 1);

console.log("gantt task depth tests passed");
