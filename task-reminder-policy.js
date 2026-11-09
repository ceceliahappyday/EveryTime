(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.TaskReminderPolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  const DEFAULT_LEAD_DAYS = [1, 0];

  function normalizeLeadDays(value) {
    const raw = Array.isArray(value) ? value : DEFAULT_LEAD_DAYS;
    const nums = raw.map(n => Number(n)).filter(n => Number.isFinite(n) && n >= 0 && n <= 366);
    return nums.length ? [...new Set(nums)].sort((a, b) => b - a) : [0];
  }

  function normalizeSettings(settings = {}) {
    return {
      dueRemindersEnabled: settings.dueRemindersEnabled !== false,
      dueReminderIncludeAttention: settings.dueReminderIncludeAttention !== false,
      dueReminderLeadDays: normalizeLeadDays(settings.dueReminderLeadDays),
      dueReminderOverdueDaily: settings.dueReminderOverdueDaily !== false
    };
  }

  function dueDateKey(task = {}) {
    return String(task.dueDate || "").slice(0, 10);
  }

  function dayDiff(fromKey = "", toKey = "") {
    const a = Date.parse(String(fromKey).trim());
    const b = Date.parse(String(toKey).trim());
    if (!Number.isFinite(a) || !Number.isFinite(b)) return NaN;
    return Math.round((b - a) / 86400000);
  }

  function isEnded(task = {}, isEndedStatus = () => false) {
    return isEndedStatus(task.status);
  }

  function isAttentionOnly(task = {}, isAttentionOnlyFn = () => false) {
    return isAttentionOnlyFn(task);
  }

  /**
   * 统一「目标完成」提醒：仅关注与普通待办共用一套规则，同任务只提醒一次。
   * daysUntil：0=当天到期，正数=还有多少天到期，负数=已逾期天数。
   */
  function isDueReminderDue(
    task = {},
    todayKey = "",
    settings = {},
    {
      isEndedStatus = () => false,
      isAttentionOnlyFn = () => false
    } = {}
  ) {
    const cfg = normalizeSettings(settings);
    if (!cfg.dueRemindersEnabled || !todayKey) return false;
    if (!task || isEnded(task, isEndedStatus)) return false;
    const due = dueDateKey(task);
    if (!due) return false;
    const attention = isAttentionOnly(task, isAttentionOnlyFn);
    if (attention && !cfg.dueReminderIncludeAttention) return false;

    const daysUntil = dayDiff(todayKey, due);
    if (!Number.isFinite(daysUntil)) return false;
    if (daysUntil === 0) return true;
    if (daysUntil > 0 && cfg.dueReminderLeadDays.includes(daysUntil)) return true;
    if (daysUntil < 0 && cfg.dueReminderOverdueDaily) return true;
    return false;
  }

  /** 清单红色感叹号：仅「仅关注/待跟踪」类任务在需要提醒时显示。 */
  function isAttentionBadgeDue(
    task = {},
    todayKey = "",
    settings = {},
    deps = {}
  ) {
    const isAttentionOnlyFn = deps.isAttentionOnlyFn || (() => false);
    if (!isAttentionOnly(task, isAttentionOnlyFn)) return false;
    return isDueReminderDue(task, todayKey, settings, deps);
  }

  function filterDueReminderTasks(
    tasks = [],
    todayKey = "",
    settings = {},
    deps = {}
  ) {
    return (tasks || []).filter(task =>
      isDueReminderDue(task, todayKey, settings, deps)
    );
  }

  function settingsFromForm({
    enabled = true,
    includeAttention = true,
    lead1 = true,
    lead3 = false,
    lead7 = false,
    overdueDaily = true
  } = {}) {
    const lead = [0];
    if (lead1) lead.push(1);
    if (lead3) lead.push(3);
    if (lead7) lead.push(7);
    return normalizeSettings({
      dueRemindersEnabled: enabled,
      dueReminderIncludeAttention: includeAttention,
      dueReminderLeadDays: lead,
      dueReminderOverdueDaily: overdueDaily
    });
  }

  return {
    DEFAULT_LEAD_DAYS,
    normalizeSettings,
    normalizeLeadDays,
    dueDateKey,
    dayDiff,
    isDueReminderDue,
    isAttentionBadgeDue,
    filterDueReminderTasks,
    settingsFromForm
  };
});
