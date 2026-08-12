(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.ProjectViewPolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  function currentBucketKey(dateKey, scale, getMonday) {
    if (scale === "month") return String(dateKey).slice(0, 7);
    if (scale === "week") return getMonday ? getMonday(dateKey) : dateKey;
    return dateKey;
  }

  function anchorIndex(buckets = [], anchorKey) {
    const index = buckets.findIndex(bucket => bucket.key === anchorKey);
    return index < 0 ? 0 : index;
  }

  function anchorScrollLeft({ buckets = [], anchorKey, labelWidth = 180, bucketWidth = 44 } = {}) {
    // The label column is sticky; scrollLeft is measured only across date buckets.
    return Math.max(0, anchorIndex(buckets, anchorKey) * bucketWidth);
  }

  function futureBucketCount(scale) {
    if (scale === "month") return 2;
    if (scale === "week") return 5;
    return 30;
  }

  function rangeContainsBucket(buckets = [], key) {
    return buckets.some(bucket => bucket.key === key);
  }

  function timelineSpanForBuckets(dateKeys = [], buckets = [], projectBucketKey) {
    const keys = buckets.map(bucket => bucket.key);
    const valid = dateKeys.map(projectBucketKey).filter(key => keys.includes(key)).sort();
    if (!valid.length) return null;
    const first = keys.indexOf(valid[0]);
    const last = keys.indexOf(valid[valid.length - 1]);
    return { first, last, leftRatio: first / buckets.length, widthRatio: (last - first + 1) / buckets.length };
  }

  return { currentBucketKey, anchorIndex, anchorScrollLeft, futureBucketCount, rangeContainsBucket, timelineSpanForBuckets };
});
