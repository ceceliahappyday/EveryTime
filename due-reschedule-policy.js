(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.DueReschedulePolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  function stamp(dueDate = "", dueTime = "") {
    const date = String(dueDate || "").slice(0, 10);
    const time = String(dueTime || "").trim().slice(0, 5);
    if (!date) return "";
    return time ? `${date} ${time}` : date;
  }

  function displayStamp(dueDate = "", dueTime = "") {
    const raw = stamp(dueDate, dueTime);
    if (!raw) return "（空）";
    return raw.replace(/^(\d{4})-(\d{2})-(\d{2})/, "$1/$2/$3");
  }

  /** 两侧都有目标完成时间且内容不同，才算改期；首次填写或清空不算。 */
  function isReschedule(previous = {}, next = {}) {
    const from = stamp(previous.dueDate, previous.dueTime);
    const to = stamp(next.dueDate, next.dueTime);
    return Boolean(from && to && from !== to);
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
    now = new Date()
  } = {}) {
    const n = Math.max(1, Number(count) || 1);
    const clock = formatLogClock(now);
    const head = clock ? `[改期 ${clock}]` : "[改期]";
    return `${head} 第 ${n} 次：${displayStamp(previous.dueDate, previous.dueTime)} → ${displayStamp(next.dueDate, next.dueTime)}`;
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
    maxChars = 4000
  } = {}) {
    const previous = { dueDate: previousDueDate, dueTime: previousDueTime };
    const next = { dueDate: nextDueDate, dueTime: nextDueTime };
    const count = Math.max(0, Number(previousCount) || 0);
    if (!isReschedule(previous, next)) {
      return {
        changed: false,
        count,
        deliveryNote: String(deliveryNote || "")
      };
    }
    const nextCount = count + 1;
    const line = buildLogLine({ count: nextCount, previous, next, now });
    return {
      changed: true,
      count: nextCount,
      deliveryNote: appendDeliveryNote(deliveryNote, line, maxChars),
      line
    };
  }

  return {
    stamp,
    displayStamp,
    isReschedule,
    formatLogClock,
    buildLogLine,
    appendDeliveryNote,
    applyOnSave
  };
});
