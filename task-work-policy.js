(function (root) {
  function validRange(start, end) {
    const from = Number(start);
    const to = Number(end);
    return Number.isFinite(from) && Number.isFinite(to) && to > from;
  }

  function copyPlacement(entry, start, maxEnd = 22) {
    if (!entry || !validRange(entry.start, entry.end)) return null;
    const nextStart = Number(start);
    const duration = Number(entry.end) - Number(entry.start);
    if (!Number.isFinite(nextStart) || !Number.isFinite(duration) || nextStart < 0 || nextStart >= maxEnd) return null;
    const nextEnd = Math.min(nextStart + duration, maxEnd);
    if (!validRange(nextStart, nextEnd)) return null;
    return { start: nextStart, end: nextEnd };
  }

  function startAt(dateKey, hour) {
    const parts = String(dateKey || "").split("-").map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    date.setHours(Math.floor(Number(hour)), Math.round((Number(hour) % 1) * 60), 0, 0);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function statusForStart(dateKey, hour, now = new Date()) {
    const start = startAt(dateKey, hour);
    return start && start <= now ? "in_progress" : "planned";
  }

  function statusForEntries(entries = [], now = new Date()) {
    return entries.some(item => statusForStart(item.dateKey, item.start, now) === "in_progress")
      ? "in_progress"
      : "planned";
  }

  root.TaskWorkPolicy = { validRange, copyPlacement, statusForStart, statusForEntries };
})(typeof window === "undefined" ? globalThis : window);
