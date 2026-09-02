const fs = require("fs");
const app = fs.readFileSync("app.js", "utf8");
const styles = fs.readFileSync("styles.css", "utf8");

const requiredApp = [
  "taskActualTimelineParts",
  "calendarMeetingTimelineParts",
  "createCalendarGanttRow",
  "getCalendarMeetingSummaries",
  "scheduleOverviewItemsForDate",
  "renderDayOverviewList",
  "ProjectViewPolicy.investmentSegments",
  "ganttSegmentPolicyArgs",
  "gantt-meeting-bar",
  "legend-meeting",
  "project-gantt-root",
  "project-gantt-hscroll",
  "project-gantt-chart-track",
  "syncProjectGanttChartOffset",
  "projectGanttChrome",
  "is-title-pin",
  "GANTT_LABEL_WIDTH"
];
requiredApp.forEach(token => {
  if (!app.includes(token)) throw new Error(`missing gantt visual token in app.js: ${token}`);
});

if (app.includes("projectHorizontalScrollbar")) {
  throw new Error("gantt should not keep a duplicate top horizontal scrollbar");
}
if (!app.includes("el.projectGanttChrome")) {
  throw new Error("gantt toolbar and legend must render outside the scrolling timeline");
}
if (!app.includes("overviewItemBadge(item)")) {
  throw new Error("week and month overview lists should use 进行 instead of 做");
}
if (app.includes("当天投入")) {
  throw new Error("week overview should list task names without invested-hour subtitles");
}

const requiredStyles = [
  ".project-gantt-root",
  ".project-gantt-hscroll",
  ".project-gantt-label-pane",
  ".project-gantt-chart-track",
  ".project-gantt-lane i.gantt-meeting-bar",
  ".gantt-legend i.legend-meeting",
  "#3db56a"
];
requiredStyles.forEach(token => {
  if (!styles.includes(token)) throw new Error(`missing gantt visual style: ${token}`);
});

if (!/height:\s*42px/.test(styles.match(/\.project-gantt-group-heading\s*\{[^}]+\}/s)?.[0] || "")) {
  throw new Error("gantt group headings must use fixed height to stay aligned with chart spacers");
}
if (!/height:\s*36px/.test(styles.match(/\.project-gantt-row-label,\s*\.project-gantt-row-chart\s*\{[^}]+\}/s)?.[0] || "")) {
  throw new Error("gantt label/chart rows must use matching fixed heights");
}

if (app.includes('|| "未命名会议"') || app.includes("|| '未命名会议'")) {
  throw new Error("empty-title meetings must be filtered out, not renamed");
}
if (app.includes('|| "未命名任务"') && app.includes("createProjectGanttRow")) {
  throw new Error("empty-title gantt tasks must be filtered out, not renamed");
}
if (!app.includes("TodoListPolicy.hasDisplayTitle")) {
  throw new Error("gantt/overview rendering must require a display title");
}
if (!app.includes("if (!pair?.labelRow || !pair?.chartRow) return")) {
  throw new Error("appendGanttRowPair must skip rows without title content");
}

console.log("gantt visual policy tests passed");
