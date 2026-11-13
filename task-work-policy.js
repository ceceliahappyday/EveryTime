(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.TaskWorkPolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
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

  function pickEarliestIso(values = []) {
    return [...values]
      .map(value => String(value || "").trim())
      .filter(Boolean)
      .sort()[0] || "";
  }

  function pickEarliestDateKey(keys = []) {
    return [...keys]
      .map(key => String(key || "").trim())
      .filter(Boolean)
      .sort()[0] || "";
  }

  function rollupActualStartDateKey({ ownStartDateKey = "", investedDateKeys = [] } = {}) {
    return pickEarliestDateKey([ownStartDateKey, ...investedDateKeys]);
  }

  function pad2(value) {
    return String(Math.max(0, Number(value) || 0)).padStart(2, "0");
  }

  function formatHourLabel(hour) {
    const raw = Number(hour);
    if (!Number.isFinite(raw)) return "";
    const h = Math.floor(raw);
    const m = Math.round((raw - h) * 60);
    return `${pad2(h)}:${pad2(m >= 60 ? 0 : m)}`;
  }

  function formatDateLabel(dateKey = "") {
    const key = String(dateKey || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return key;
    return key.replace(/-/g, "/");
  }

  /** 与事项相同的完成内容视为未填，避免日程块重复显示、进度重复抄写。 */
  function normalizeEntryNote({ note = "", title = "" } = {}) {
    const text = String(note || "").trim();
    const head = String(title || "").trim();
    if (!text) return "";
    if (head && text === head) return "";
    return text;
  }

  /** 进度文案：完成内容优先，否则用事项标题，再否则「已投入」。 */
  function resolveInvestmentNoteText({ note = "", title = "" } = {}) {
    const cleaned = normalizeEntryNote({ note, title });
    return cleaned || String(title || "").trim() || "已投入";
  }

  /** 日程块是否单独展示完成内容（与事项不同才显示）。 */
  function shouldShowEntryNoteOnSchedule({ note = "", title = "" } = {}) {
    return Boolean(normalizeEntryNote({ note, title }));
  }

  function buildInvestmentNoteLine({ dateKey = "", start = 0, end = 0, note = "", title = "" } = {}) {
    const text = resolveInvestmentNoteText({ note, title });
    const day = formatDateLabel(dateKey);
    const from = formatHourLabel(start);
    const to = formatHourLabel(end);
    const range = from && to ? `${from}–${to}` : "";
    const head = range ? `[投入 ${day} ${range}]` : `[投入 ${day}]`;
    return `${head} ${text}`;
  }

  function appendInvestmentNote({
    deliveryNote = "",
    dateKey = "",
    start = 0,
    end = 0,
    note = "",
    title = "",
    maxChars = 4000
  } = {}) {
    const line = buildInvestmentNoteLine({ dateKey, start, end, note, title });
    const existing = String(deliveryNote || "");
    if (!line) return { changed: false, deliveryNote: existing };
    if (existing.includes(line)) return { changed: false, deliveryNote: existing };
    const base = existing.replace(/\s+$/g, "");
    const joined = base ? `${base}\n${line}` : line;
    return {
      changed: true,
      deliveryNote: joined.slice(0, Math.max(0, Number(maxChars) || 4000)),
      line
    };
  }

  function formatProgressClock(now = new Date()) {
    const d = now instanceof Date ? now : new Date(now);
    if (!Number.isFinite(d.getTime())) return "";
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${m}/${day} ${hh}:${mm}`;
  }

  /** 单次进度更新：只追加一行带时间戳的说明，不改写历史正文。 */
  function buildProgressUpdateLine({ note = "", now = new Date() } = {}) {
    const text = String(note || "").trim();
    if (!text) return "";
    const clock = formatProgressClock(now);
    const head = clock ? `[进度 ${clock}]` : "[进度]";
    return `${head} ${text}`;
  }

  function appendProgressUpdateNote({
    deliveryNote = "",
    note = "",
    now = new Date(),
    maxChars = 4000
  } = {}) {
    const line = buildProgressUpdateLine({ note, now });
    const existing = String(deliveryNote || "");
    if (!line) return { changed: false, deliveryNote: existing, line: "" };
    const base = existing.replace(/\s+$/g, "");
    const joined = base ? `${base}\n${line}` : line;
    return {
      changed: true,
      deliveryNote: joined.slice(0, Math.max(0, Number(maxChars) || 4000)),
      line
    };
  }

  function recentProgressPreview(deliveryNote = "", limit = 3) {
    const lines = String(deliveryNote || "")
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);
    if (!lines.length) return [];
    return lines.slice(Math.max(0, lines.length - Math.max(1, Number(limit) || 3)));
  }

  return {
    validRange,
    copyPlacement,
    statusForStart,
    statusForEntries,
    pickEarliestIso,
    pickEarliestDateKey,
    rollupActualStartDateKey,
    formatHourLabel,
    formatDateLabel,
    formatProgressClock,
    normalizeEntryNote,
    resolveInvestmentNoteText,
    shouldShowEntryNoteOnSchedule,
    buildInvestmentNoteLine,
    appendInvestmentNote,
    buildProgressUpdateLine,
    appendProgressUpdateNote,
    recentProgressPreview
  };
});
