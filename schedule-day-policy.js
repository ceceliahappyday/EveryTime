(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.ScheduleDayPolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  /**
   * Calendar / day scope: show tasks with invest on the day, due on the day,
   * started on the day, completed on the day, or inbox rows stored without due date.
   */
  function taskVisibleInDateScope({
    task,
    dateKey,
    storageKey = "",
    hasInvestOnDate = false,
    startedOnDate = false,
    completedOnDate = false,
    dueOnDate = false,
    isEndedStatus = () => false,
    isHiddenFuture = () => false
  } = {}) {
    if (!task || !dateKey) return false;
    if (isHiddenFuture(task)) return false;
    if (hasInvestOnDate) return true;
    if (dueOnDate) return true;
    if (startedOnDate) return true;
    if (completedOnDate) return true;
  // Legacy inbox: task object kept under a day bucket with no due date while still open.
    return storageKey === dateKey && !String(task.dueDate || "").trim() && !isEndedStatus(task.status);
  }

  /** Week/month chip list: only open planned items count as「计划」for that due date. */
  function taskDuePlannedOnDate(task, dateKey, { isEndedStatus = () => false, isHiddenFuture = () => false } = {}) {
    if (!task || String(task.dueDate || "") !== dateKey) return false;
    if (isHiddenFuture(task)) return false;
    return !isEndedStatus(task.status);
  }

  function completedDateKey(task, toDateKey) {
    if (!task?.completedAt || typeof toDateKey !== "function") return "";
    return toDateKey(new Date(task.completedAt));
  }

  function parseIso(iso) {
    if (!iso) return null;
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function daysBetween(earlier, later) {
    if (!earlier || !later) return 0;
    return (later.getTime() - earlier.getTime()) / 86400000;
  }

  /** Validate completion / actual-end times before close or save. */
  function validateCompletionTimeline({
    completedAtIso = "",
    rawInput = "",
    startedAtIso = "",
    dueAtIso = "",
    lastInvestEndIso = "",
    createdAtIso = "",
    nowIso = new Date().toISOString()
  } = {}) {
    const raw = String(rawInput || "").trim();
    if (raw && !completedAtIso) {
      return { ok: false, message: "时间格式无法识别，请用类似 2026/11/05 17:00 的格式" };
    }
    if (!completedAtIso) {
      return { ok: false, message: "请填写实际完成时间" };
    }
    const completed = parseIso(completedAtIso);
    if (!completed) return { ok: false, message: "完成时间无效，请检查日期与时间" };
    const now = parseIso(nowIso);
    if (now && completed.getTime() > now.getTime() + 60000) {
      return { ok: false, message: "完成时间不能晚于当前时间" };
    }
    const started = parseIso(startedAtIso);
    if (started && completed < started) {
      return { ok: false, message: "完成时间不能早于实际开始时间" };
    }
    const lastInvest = parseIso(lastInvestEndIso);
    if (lastInvest && completed < lastInvest) {
      return { ok: false, message: "完成时间不能早于最后一次日程投入时间" };
    }
    const created = parseIso(createdAtIso);
    if (created && completed < created) {
      const due = parseIso(dueAtIso);
      const retroRecord = (due && created > due)
        || (started && created > started)
        || (lastInvest && created > lastInvest);
      if (!retroRecord) {
        return { ok: false, message: "完成时间不能早于任务创建时间" };
      }
      const daysBeforeRecord = daysBetween(completed, created);
      if (daysBeforeRecord > 0.01) {
        return {
          ok: true,
          message: "",
          confirm: "完成时间早于本条录入时间（后补记录），确定按历史完成时间保存？"
        };
      }
    }
    const dueForLateCheck = parseIso(dueAtIso);
    if (dueForLateCheck) {
      const afterDue = daysBetween(dueForLateCheck, completed);
      const beforeDue = daysBetween(completed, dueForLateCheck);
      if (afterDue > 60) {
        const daysLate = Math.floor(afterDue);
        return {
          ok: true,
          message: "",
          confirm: `完成时间比原定截止日晚 ${daysLate} 天（超过 60 天），请核对是否填错日期。确定仍要保存？`
        };
      }
      if (beforeDue > 365) {
        return { ok: false, message: "完成时间比原定截止日早超过一年，请核对是否填错日期" };
      }
    }
    return { ok: true, message: "" };
  }

  function validateStartEndOrder({ startIso = "", endIso = "", rawStart = "", rawEnd = "" } = {}) {
    const rawS = String(rawStart || "").trim();
    const rawE = String(rawEnd || "").trim();
    if (rawS && !startIso) return { ok: false, message: "开始时间格式无法识别" };
    if (rawE && !endIso) return { ok: false, message: "结束时间格式无法识别" };
    const start = parseIso(startIso);
    const end = parseIso(endIso);
    if (start && end && end < start) {
      return { ok: false, message: "结束时间不能早于开始时间" };
    }
    return { ok: true, message: "" };
  }

  function earlierIso(a, b) {
    const left = parseIso(a);
    const right = parseIso(b);
    if (!left) return String(b || "").trim();
    if (!right) return String(a || "").trim();
    return left.getTime() <= right.getTime() ? String(a).trim() : String(b).trim();
  }

  function resolveDueIso(task = {}, hints = {}) {
    if (typeof hints.dueDateTimeIso === "function") {
      return String(hints.dueDateTimeIso(task) || "").trim();
    }
    if (hints.dueDateTimeIso) return String(hints.dueDateTimeIso || "").trim();
    if (hints.dueAtIso) return String(hints.dueAtIso || "").trim();
    return "";
  }

  /**
   * 关闭确认 / 回填用的默认完成时间：
   * 1. 已有 completedAt
   * 2. 末次实际投入结束（hints.lastInvestEndIso）
   * 3. 实际开始（hints.startedAtIso / startOverrideAt / startedAt）
   * 4. 有目标完成：取目标与 now 的较早者（无 now 时用目标，供历史回填）
   * 5. 显式传入的创建时间（关闭对话框）；回填不传，避免用录入时间冒充关闭时间
   * 6. 交互关闭可再退到 nowIso；否则空
   */
  function pickDefaultCompletionIso(task = {}, hints = {}) {
    if (task.completedAt) return task.completedAt;

    const nowIso = String(hints.nowIso || "").trim();
    const clamp = iso => (nowIso ? earlierIso(iso, nowIso) : String(iso || "").trim());

    const lastInvest = String(hints.lastInvestEndIso || "").trim();
    if (lastInvest) return clamp(lastInvest);

    const started = String(
      hints.startedAtIso || task.startOverrideAt || task.startedAt || ""
    ).trim();
    if (started) return clamp(started);

    const dueIso = resolveDueIso(task, hints);
    if (dueIso) return nowIso ? earlierIso(dueIso, nowIso) : dueIso;

    const created = String(hints.createdAtIso || "").trim();
    if (created) return clamp(created);

    return nowIso;
  }

  return {
    taskVisibleInDateScope,
    taskDuePlannedOnDate,
    completedDateKey,
    pickDefaultCompletionIso,
    validateCompletionTimeline,
    validateStartEndOrder
  };
});
