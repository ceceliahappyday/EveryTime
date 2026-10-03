const assert = require("node:assert/strict");
const policy = require("../ui-scale-policy.js");

assert.strictEqual(policy.uiScaleForWindow({ width: 1180, height: 760 }), 1);
assert.strictEqual(policy.uiScaleForWindow({ width: 1600, height: 1000 }), 1.24);
assert.strictEqual(policy.uiScaleForWindow({ width: 900, height: 600 }), 0.9);
assert.ok(
  policy.uiScaleForWindow({ width: 1180, height: 760, compact: true }) < 1,
  "compact mode should slightly reduce ui scale"
);

console.log("ui scale policy tests passed");
