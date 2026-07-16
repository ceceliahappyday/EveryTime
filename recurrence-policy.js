(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.RecurringPolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  function currentMonthKey(now = new Date()) {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  function shouldGenerateRecurringMonth({ targetMonth, currentMonth, startMonth, untilMonth }) {
    if (!targetMonth || !currentMonth || !startMonth) return false;
    if (targetMonth !== currentMonth) return false;
    if (targetMonth < startMonth) return false;
    if (untilMonth && targetMonth > untilMonth) return false;
    return true;
  }

  function isFutureRecurringInstance(taskMonth, currentMonth) {
    return !!taskMonth && !!currentMonth && taskMonth > currentMonth;
  }

  return {
    currentMonthKey,
    shouldGenerateRecurringMonth,
    isFutureRecurringInstance
  };
});
