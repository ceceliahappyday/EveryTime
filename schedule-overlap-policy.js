(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.ScheduleOverlapPolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function overlaps(a, b) {
    return Number(a.start) < Number(b.end) && Number(b.start) < Number(a.end);
  }

  /**
   * Pack concurrent day-timeline entries into side-by-side columns
   * (Google Calendar style) so parallel work stays readable.
   */
  function layoutEntries(entries = [], { compare = null } = {}) {
    const sorted = [...entries].sort((a, b) =>
      Number(a.start) - Number(b.start)
      || Number(a.end) - Number(b.end)
      || (typeof compare === "function" ? compare(a, b) : 0)
      || String(a.title || "").localeCompare(String(b.title || ""))
      || String(a.id || "").localeCompare(String(b.id || ""))
    );

    const clusters = [];
    let current = [];
    let clusterEnd = -Infinity;
    sorted.forEach(entry => {
      const start = Number(entry.start);
      const end = Number(entry.end);
      if (!current.length || start < clusterEnd) {
        current.push(entry);
        clusterEnd = Math.max(clusterEnd, end);
      } else {
        clusters.push(current);
        current = [entry];
        clusterEnd = end;
      }
    });
    if (current.length) clusters.push(current);

    return clusters.flatMap(assignClusterColumns);
  }

  function assignClusterColumns(cluster) {
    if (cluster.length <= 1) {
      return cluster.map(entry => ({
        entry,
        column: 0,
        columns: 1,
        stackIndex: 0,
        overlapCount: 1
      }));
    }

    const columnEnds = [];
    const placed = cluster.map(entry => {
      let column = columnEnds.findIndex(end => Number(entry.start) >= end);
      if (column < 0) {
        column = columnEnds.length;
        columnEnds.push(Number(entry.end));
      } else {
        columnEnds[column] = Number(entry.end);
      }
      return { entry, column };
    });

    const columns = Math.max(1, columnEnds.length);
    return placed.map(item => ({
      entry: item.entry,
      column: item.column,
      columns,
      stackIndex: item.column,
      overlapCount: columns
    }));
  }

  return { overlaps, layoutEntries, assignClusterColumns };
});
