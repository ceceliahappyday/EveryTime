(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.TaskReminderPolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  const DEFAULT_LEAD_DAYS = [1, 0];
  const TIER_ORDER = ["overdue", "due_today", "upcoming"];

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

  function reminderEligibility(
    task = {},
    todayKey = "",
    settings = {},
    {
      isEndedStatus = () => false,
      isAttentionOnlyFn = () => false
    } = {}
  ) {
    const cfg = normalizeSettings(settings);
    if (!cfg.dueRemindersEnabled || !todayKey) return null;
    if (!task || isEnded(task, isEndedStatus)) return null;
    const due = dueDateKey(task);
    if (!due) return null;
    const attention = isAttentionOnly(task, isAttentionOnlyFn);
    if (attention && !cfg.dueReminderIncludeAttention) return null;
    const daysUntil = dayDiff(todayKey, due);
    if (!Number.isFinite(daysUntil)) return null;
    return { cfg, due, daysUntil };
  }

  /**
   * 统一「目标完成」提醒：仅关注与普通待办共用一套规则，同任务只提醒一次。
   * daysUntil：0=当天到期，正数=还有多少天到期，负数=已逾期天数。
   */
  function isDueReminderDue(task = {}, todayKey = "", settings = {}, deps = {}) {
    const info = reminderEligibility(task, todayKey, settings, deps);
    if (!info) return false;
    const { cfg, daysUntil } = info;
    if (daysUntil === 0) return true;
    if (daysUntil > 0 && cfg.dueReminderLeadDays.includes(daysUntil)) return true;
    if (daysUntil < 0 && cfg.dueReminderOverdueDaily) return true;
    return false;
  }

  /** overdue | due_today | upcoming | null（不符合当前提醒规则） */
  function classifyDueReminder(task = {}, todayKey = "", settings = {}, deps = {}) {
    const info = reminderEligibility(task, todayKey, settings, deps);
    if (!info) return null;
    const { cfg, daysUntil } = info;
    if (daysUntil < 0) return cfg.dueReminderOverdueDaily ? "overdue" : null;
    if (daysUntil === 0) return "due_today";
    if (daysUntil > 0 && cfg.dueReminderLeadDays.includes(daysUntil)) return "upcoming";
    return null;
  }

  function tierLabel(tier = "", daysUntil = NaN) {
    if (tier === "overdue") {
      const days = Number.isFinite(daysUntil) ? Math.abs(Math.trunc(daysUntil)) : 0;
      return days > 0 ? `已逾期 ${days} 天` : "已逾期";
    }
    if (tier === "due_today") return "今天到期";
    if (tier === "upcoming") {
      const days = Number.isFinite(daysUntil) ? Math.trunc(daysUntil) : 0;
      return days > 0 ? `还有 ${days} 天` : "即将到期";
    }
    return "";
  }

  function sectionLabel(tier = "", count = 0) {
    const titles = {
      overdue: "已逾期",
      due_today: "今天到期",
      upcoming: "即将到期"
    };
    const title = titles[tier] || "提醒";
    return `${title}（${count}）`;
  }

  /** 清单感叹号：仅「仅关注/待跟踪」类任务在需要提醒时显示。 */
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

  /**
   * 提醒 overlay：按当前规则重算档位；不再命中逾期/今天/即将的不展示。
   * 「本轮已调整」只做卡片绿标，由调用方对比打开时的 dueDate 基线判断。
   */
  function groupAttentionAlarmOverlay(
    tasks = [],
    todayKey = "",
    settings = {},
    deps = {}
  ) {
    const buckets = {
      overdue: [],
      due_today: [],
      upcoming: []
    };
    (tasks || []).forEach(task => {
      const tier = classifyDueReminder(task, todayKey, settings, deps);
      if (tier && buckets[tier]) buckets[tier].push(task);
    });
    return TIER_ORDER
      .filter(key => buckets[key].length)
      .map(key => ({
        key: `attention-alarm-${key}`,
        tier: key,
        label: sectionLabel(key, buckets[key].length),
        tasks: buckets[key]
      }));
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
    TIER_ORDER,
    normalizeSettings,
    normalizeLeadDays,
    dueDateKey,
    dayDiff,
    isDueReminderDue,
    classifyDueReminder,
    tierLabel,
    sectionLabel,
    isAttentionBadgeDue,
    filterDueReminderTasks,
    groupAttentionAlarmOverlay,
    settingsFromForm
  };
});
