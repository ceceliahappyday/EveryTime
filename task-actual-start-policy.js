(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.TaskActualStartPolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  /**
   * 实际开始时间优先级（自动建议，目标完成时间始终人工填报）：
   * 1. 用户在「实际开始」里保存过的 startOverrideAt
   * 2. 首次日程投入时间 firstInvestIso
   * 3. 已存的 startedAt
   */
  function resolveActualStartIso(task = {}, { firstInvestIso = "" } = {}) {
    const override = String(task.startOverrideAt || "").trim();
    if (override) return override;
    const invest = String(firstInvestIso || "").trim();
    if (invest) return invest;
    return String(task.startedAt || "").trim();
  }

  return { resolveActualStartIso };
});
