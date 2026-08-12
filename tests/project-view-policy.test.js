const assert = require("assert");
const policy = require("../project-view-policy.js");

const buckets = [
  { key: "2026-06-01" }, { key: "2026-07-01" }, { key: "2026-08-01" },
  { key: "2026-09-01" }, { key: "2026-10-01" }
];
assert.strictEqual(policy.anchorIndex(buckets, "2026-08-01"), 2);
assert.strictEqual(policy.anchorScrollLeft({ buckets, anchorKey: "2026-08-01", labelWidth: 180, bucketWidth: 72 }), 144);
assert.strictEqual(policy.anchorScrollLeft({ buckets, anchorKey: "missing", labelWidth: 180, bucketWidth: 72 }), 0);
assert.strictEqual(policy.futureBucketCount("day"), 30);
assert.strictEqual(policy.futureBucketCount("week"), 5);
assert.strictEqual(policy.futureBucketCount("month"), 2);
assert.deepStrictEqual(policy.timelineSpanForBuckets(
  ["2026-07-03", "2026-07-10"],
  [{ key: "2026-06-29" }, { key: "2026-07-06" }, { key: "2026-07-13" }],
  key => key < "2026-07-07" ? "2026-06-29" : "2026-07-06"
), { first: 0, last: 1, leftRatio: 0, widthRatio: 0.6666666666666666 });
assert.deepStrictEqual(policy.timelineSpanForBuckets(
  ["2026-07-01", "2026-08-01"], buckets, key => key.slice(0, 7) === "2026-07" ? "2026-07-01" : "2026-08-01"
), { first: 1, last: 2, leftRatio: 0.2, widthRatio: 0.4 });
console.log("project view policy tests passed");
