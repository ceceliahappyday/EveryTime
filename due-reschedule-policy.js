(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.DueReschedulePolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  function normalizeTime(dueTime = "", defaultTime = "") {
    const time = String(dueTime || "").trim().slice(0, 5);
    if (time) return time;
    const fallback = String(defaultTime || "").trim().slice(0, 5);
    return fallback || "";
  }

  function stamp(dueDate = "", dueTime = "", defaultTime = "") {
    const date = String(dueDate || "").slice(0, 10);
    if (!date) return "";
    const time = normalizeTime(dueTime, defaultTime);
    return time ? `${date} ${time}` : date;
  }

  function displayStamp(dueDate = "", dueTime = "", defaultTime = "") {
    const raw = stamp(dueDate, dueTime, defaultTime);
    if (!raw) return "（空）";
    return raw.replace(/^(\d{4})-(\d{2})-(\d{2})/, "$1/$2/$3");
  }

  /** 两侧都有目标完成时间且内容不同，才算改期；首次填写或清空不算改期次数。 */
  function isReschedule(previous = {}, next = {}, defaultTime = "") {
    const from = stamp(previous.dueDate, previous.dueTime, defaultTime);
    const to = stamp(next.dueDate, next.dueTime, defaultTime);
    return Boolean(from && to && from !== to);
  }

  /** 编辑已有任务时，从空首次填入目标时间（新建任务不走此策略）。 */
  function isFirstSchedule(previous = {}, next = {}, defaultTime = "") {
    const from = stamp(previous.dueDate, previous.dueTime, defaultTime);
    const to = stamp(next.dueDate, next.dueTime, defaultTime);
    return Boolean(!from && to);
  }

  function formatLogClock(now = new Date()) {
    const d = now instanceof Date ? now : new Date(now);
    if (!Number.isFinite(d.getTime())) return "";
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${m}/${day} ${hh}:${mm}`;
  }

  function buildLogLine({
    count = 1,
    previous = {},
    next = {},
    now = new Date(),
    defaultTime = "",
    kind = "reschedule"
  } = {}) {
    const clock = formatLogClock(now);
    const from = displayStamp(previous.dueDate, previous.dueTime, defaultTime);
    const to = displayStamp(next.dueDate, next.dueTime, defaultTime);
    if (kind === "first") {
      const head = clock ? `[设定目标 ${clock}]` : "[设定目标]";
      return `${head} ${from} → ${to}`;
    }
    const n = Math.max(1, Number(count) || 1);
    const head = clock ? `[改期 ${clock}]` : "[改期]";
    return `${head} 第 ${n} 次：${from} → ${to}`;
  }

  function appendDeliveryNote(existing = "", line = "", maxChars = 4000) {
    const text = String(line || "").trim();
    if (!text) return String(existing || "");
    const base = String(existing || "").replace(/\s+$/g, "");
    const joined = base ? `${base}\n${text}` : text;
    return joined.slice(0, Math.max(0, Number(maxChars) || 4000));
  }

  function applyOnSave({
    previousDueDate = "",
    previousDueTime = "",
    nextDueDate = "",
    nextDueTime = "",
    previousCount = 0,
    deliveryNote = "",
    now = new Date(),
    maxChars = 4000,
    defaultTime = ""
  } = {}) {
    const previous = { dueDate: previousDueDate, dueTime: previousDueTime };
    const next = { dueDate: nextDueDate, dueTime: nextDueTime };
    const count = Math.max(0, Number(previousCount) || 0);
    const first = isFirstSchedule(previous, next, defaultTime);
    const reschedule = isReschedule(previous, next, defaultTime);
    if (!first && !reschedule) {
      return {
        changed: false,
        count,
        deliveryNote: String(deliveryNote || "")
      };
    }
    const nextCount = reschedule ? count + 1 : count;
    const line = buildLogLine({
      count: nextCount,
      previous,
      next,
      now,
      defaultTime,
      kind: first ? "first" : "reschedule"
    });
    return {
      changed: true,
      count: nextCount,
      deliveryNote: appendDeliveryNote(deliveryNote, line, maxChars),
      line,
      kind: first ? "first" : "reschedule"
    };
  }

  return {
    stamp,
    displayStamp,
    isReschedule,
    isFirstSchedule,
    formatLogClock,
    buildLogLine,
    appendDeliveryNote,
    applyOnSave
  };
});
