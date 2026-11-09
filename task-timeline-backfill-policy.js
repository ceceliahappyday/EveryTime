(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.TaskTimelineBackfillPolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  function parseFiniteIso(iso) {
    const ms = Date.parse(String(iso || "").trim());
    return Number.isFinite(ms) ? new Date(ms).toISOString() : "";
  }

  function defaultIsEndedStatus(status) {
    return status === "done" || status === "closed";
  }

  /** Fill empty startedAt from override / first invest / legacy startedAt (display rules). */
  function inferPersistedStartedAt(task = {}, { firstInvestIso = "" } = {}) {
    if (parseFiniteIso(task.startedAt)) return "";
    const resolve = typeof TaskActualStartPolicy?.resolveActualStartIso === "function"
      ? TaskActualStartPolicy.resolveActualStartIso
      : null;
    const candidate = resolve
      ? resolve(task, { firstInvestIso })
      : (task.startOverrideAt || firstInvestIso || task.startedAt || "");
    return parseFiniteIso(candidate);
  }

  /** Fill empty completedAt for ended tasks; never invent「now」for backlog rows. */
  function inferPersistedCompletedAt(
    task = {},
    { lastInvestEndIso = "", dueDateTimeIso = null, isEndedStatus = defaultIsEndedStatus } = {}
  ) {
    if (parseFiniteIso(task.completedAt)) return "";
    if (task.attentionOnly) return "";
    if (typeof TaskStatusPolicy?.isTrackingStatus === "function" && TaskStatusPolicy.isTrackingStatus(task)) {
      return "";
    }
    if (!isEndedStatus(task.status)) return "";
    const hints = { lastInvestEndIso, dueDateTimeIso };
    const picked = typeof ScheduleDayPolicy?.pickDefaultCompletionIso === "function"
      ? ScheduleDayPolicy.pickDefaultCompletionIso(task, hints)
      : "";
    let iso = parseFiniteIso(picked);
    if (!iso) iso = parseFiniteIso(task.updatedAt);
    const created = parseFiniteIso(task.createdAtIso);
    if (iso && created && iso < created) return "";
    return iso;
  }

  /**
   * One-shot migration backfill: only writes missing fields, never overwrites valid ISOs.
   * Returns true when the task object was mutated.
   */
  function ensureTaskTimelineBackfill(task, options = {}) {
    if (!task || typeof task !== "object") return false;
    let changed = false;

    if (typeof options.ensureCreatedAt === "function") {
      const before = task.createdAtIso;
      options.ensureCreatedAt(task);
      if (task.createdAtIso !== before) changed = true;
    }

    const startIso = inferPersistedStartedAt(task, options);
    if (startIso) {
      task.startedAt = startIso;
      changed = true;
    }

    const completeIso = inferPersistedCompletedAt(task, options);
    if (completeIso) {
      task.completedAt = completeIso;
      changed = true;
    }

    if (!parseFiniteIso(task.updatedAt)) {
      const anchor = parseFiniteIso(task.completedAt)
        || parseFiniteIso(task.startedAt)
        || parseFiniteIso(task.createdAtIso);
      if (anchor) {
        task.updatedAt = anchor;
        changed = true;
      }
    }

    return changed;
  }

  return {
    parseFiniteIso,
    inferPersistedStartedAt,
    inferPersistedCompletedAt,
    ensureTaskTimelineBackfill
  };
});
