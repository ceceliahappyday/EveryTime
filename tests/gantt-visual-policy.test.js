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

console.log("gantt visual policy tests passed");
