(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.NavigationPolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  const WEEKDAY_NAMES = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

  function shouldShowDateNav(view = "day") {
    return view !== "project";
  }

  function navLabels(view = "day") {
    if (view === "month") {
      return { prev: "上一月", next: "下一月" };
    }
    if (view === "week") {
      return { prev: "上一周", next: "下一周" };
    }
    return { prev: "上一天", next: "下一天" };
  }

  function moveDateKey({
    dateKey = "",
    view = "day",
    direction = 1,
    addDays = () => new Date(),
    fromDateKey = () => new Date(),
    toDateKey = () => "",
    getMonday = date => date
  } = {}) {
    const date = fromDateKey(dateKey);
    if (!date || view === "project") return dateKey;
    const step = Number(direction) || 0;
    if (!step) return dateKey;

    if (view === "month") {
      const copy = new Date(date.getFullYear(), date.getMonth() + step, 1);
      const day = date.getDate();
      const lastDay = new Date(copy.getFullYear(), copy.getMonth() + 1, 0).getDate();
      copy.setDate(Math.min(day, lastDay));
      return toDateKey(copy);
    }

    if (view === "week") {
      const monday = getMonday(date);
      return toDateKey(addDays(monday, step * 7));
    }

    return toDateKey(addDays(date, step));
  }

  function formatNavTitle({
    view = "day",
    dateKey = "",
    fromDateKey = () => new Date(),
    toDateKey = () => "",
    getMonday = date => date,
    addDays = () => new Date()
  } = {}) {
    const date = fromDateKey(dateKey);
    if (!date) return "";
    if (view === "project") return "项目甘特";
    if (view === "month") {
      return `${date.getFullYear()}年 ${date.getMonth() + 1}月`;
    }
    if (view === "week") {
      const monday = getMonday(date);
      const sunday = addDays(monday, 6);
      const sameMonth = monday.getMonth() === sunday.getMonth();
      const range = sameMonth
        ? `${monday.getMonth() + 1}月${monday.getDate()}日-${sunday.getDate()}日`
        : `${monday.getMonth() + 1}月${monday.getDate()}日-${sunday.getMonth() + 1}月${sunday.getDate()}日`;
      return `${monday.getFullYear()}年 ${range}`;
    }
    return `${date.getFullYear()}年 ${date.getMonth() + 1}月${date.getDate()}日 · ${WEEKDAY_NAMES[date.getDay()]}`;
  }

  return {
    WEEKDAY_NAMES,
    shouldShowDateNav,
    navLabels,
    moveDateKey,
    formatNavTitle
  };
});
