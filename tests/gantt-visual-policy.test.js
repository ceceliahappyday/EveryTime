const fs = require("fs");
const app = fs.readFileSync("app.js", "utf8");
const styles = fs.readFileSync("styles.css", "utf8");

const requiredApp = [
  "taskActualTimelineParts",
  "calendarMeetingTimelineParts",
  "createCalendarGanttRow",
  "getCalendarMeetingSummaries",
  "buildMeetingArrangeRows",
  "extraRows: meetingRows",
  "scheduleOverviewItemsForDate",
  "renderDayOverviewList",
  "ProjectViewPolicy.entryInvestmentSegments",
  "mapEntryGanttSegments",
  "ganttSegmentPolicyArgs",
  "gantt-meeting-bar",
  "legend-meeting",
  "project-gantt-root",
  "project-gantt-chart-track",
  "shiftProjectGanttWindow",
  "projectGanttChrome",
  "is-title-pin",
  "GANTT_LABEL_WIDTH",
  "bindGanttLabelResize",
  "project-gantt-resize-handle",
  "bindGanttLabelReparent",
  "reparentTaskOnto",
  "dataset.depth",
  "gantt-add-child",
  "bindGanttRowContextMenu",
  "showGanttContextMenu",
  "openNewChildTaskFromGantt",
  "lockParent: true",
  "setTaskParentFieldLocked",
  "lockedTaskParentId",
  "ganttProgressBarText",
  "resolveGanttRowProgress",
  "fitGanttProgressLabel",
  "ganttBarLabelGeometry",
  "gantt-axis-nav",
  "selectGanttTaskRow",
  "showListItemContextMenu",
  "taskContextActionsMenuHtml",
  "applyCategoryToSelection",
  "applyPriorityToSelection",
  "categoryMenuFlyoutHtml",
  "priorityMenuFlyoutHtml",
  "toggleListSelection",
  "restoreProjectGanttRowsScroll",
  "confirmDeleteTask",
  "deleteTaskById"
];
requiredApp.forEach(token => {
  if (!app.includes(token)) throw new Error(`missing gantt visual token in app.js: ${token}`);
});

if (/depth - \(rootId \? 1 : 0\)/.test(app)) {
  throw new Error("getTaskDepth must not subtract 1 for root-relative children (breaks layer indent)");
}
if (!styles.includes(".project-gantt-resize-handle")) {
  throw new Error("gantt label pane needs a visible resize handle");
}
if (!/padding-left:\s*calc\(4px \+ var\(--task-depth, 0\) \* 16px\)/.test(styles)) {
  throw new Error("gantt task rows must indent by task depth");
}

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
  ".gantt-axis-nav",
  ".is-fill-width",
  ".project-gantt-label-pane",
  ".project-gantt-chart-track",
  ".project-gantt-lane i.gantt-meeting-bar",
  ".project-gantt-lane i.gantt-actual-bar",
  ".gantt-legend i.legend-meeting",
  "#2fbf6b",
  'content: "✓"',
  'content: "!"'
];
requiredStyles.forEach(token => {
  if (!styles.includes(token)) throw new Error(`missing gantt visual style: ${token}`);
});
if (!/i\.gantt-actual-bar\s*\{[^}]*var\(--entry/s.test(styles)) {
  throw new Error("invest bars must follow category color via --entry");
}
if (!app.includes("applyCategoryColorStyle(chartRow, taskCategoryColor)")) {
  throw new Error("task gantt chart rows must receive category color");
}
if (!/settings-category-drag[^\{]*\{[^}]*height:\s*22px/s.test(styles)) {
  throw new Error("category drag handle should match swatch height");
}

if (!/height:\s*42px/.test(styles.match(/\.project-gantt-group-heading\s*\{[^}]+\}/s)?.[0] || "")) {
  throw new Error("gantt group headings must use fixed height to stay aligned with chart spacers");
}
if (!/height:\s*36px/.test(styles.match(/\.project-gantt-row-label,\s*\.project-gantt-row-chart\s*\{[^}]+\}/s)?.[0] || "")) {
  throw new Error("gantt label/chart rows must use matching fixed heights");
}

if (app.includes('|| "未命名会议"') || app.includes("|| '未命名会议'")) {
  throw new Error("empty-title meetings must be filtered out, not renamed");
}
const createGanttRowFn = (() => {
  const start = app.indexOf("function createProjectGanttRow");
  if (start < 0) return "";
  const end = app.indexOf("\nfunction ", start + 1);
  return end > start ? app.slice(start, end) : app.slice(start);
})();
if (/\|\| ["']未命名任务["']/.test(createGanttRowFn)) {
  throw new Error("empty-title gantt tasks must be filtered out, not renamed");
}
if (!app.includes("TodoListPolicy.hasDisplayTitle")) {
  throw new Error("gantt/overview rendering must require a display title");
}
if (!app.includes("if (!pair?.labelRow || !pair?.chartRow) return")) {
  throw new Error("appendGanttRowPair must skip rows without title content");
}
if (!styles.includes(".gantt-add-child") || !styles.includes("opacity: 0")) {
  throw new Error("gantt add-child control must be hover-revealed");
}
if (!styles.includes(".gantt-context-menu")) {
  throw new Error("gantt right-click menu styles are required");
}
if (!styles.includes(".gantt-context-submenu") || !styles.includes(".task-card.is-selected")) {
  throw new Error("Outlook-style categorize submenu and list multi-select styles are required");
}
if (!app.includes("additive: event.ctrlKey || event.metaKey") || !app.includes("data-category-id")) {
  throw new Error("Ctrl multi-select and categorize submenu actions are required");
}
if (!app.includes("bindListSelectableCard") || !app.includes("range: event.shiftKey")) {
  throw new Error("list/gantt multi-select must support Ctrl toggle and Shift range");
}
if (!app.includes("applyListMultiSelectEvent") || !app.includes("isListMultiSelectEvent")) {
  throw new Error("multi-select must run on pointerdown so draggable cards do not swallow it");
}
if (!app.includes("data-priority-id") || !app.includes("任务级别仅适用于待办任务")) {
  throw new Error("bulk priority submenu must apply only to tasks");
}
if (!app.includes("positionContextSubmenu") || !styles.includes("is-flip-up")) {
  throw new Error("context submenus must flip when near viewport edges");
}
if (!app.includes('data-scale="quarter"') || !app.includes('data-scale="year"')) {
  throw new Error("gantt scale switcher must include quarter and year");
}
if (!app.includes("bindGanttFilterPanel") || !app.includes("bindGanttSettingsPanel")) {
  throw new Error("gantt filter and settings panels are required");
}
if (!app.includes("gantt-today-line is-chart") || !styles.includes("gantt-holiday-lane")) {
  throw new Error("full-height today line and holiday lane styles are required");
}
if (!app.includes("has-dot") || !styles.includes("has-dot::before")) {
  throw new Error("today line must show a header dot aligned with the chart line");
}
if (!app.includes("buildWeekTimelineBuckets") || !app.includes("bindGanttSyncedHorizontalScroll")) {
  throw new Error("quarter week buckets and synced horizontal scroll are required");
}
if (!require("fs").readFileSync(require("path").join(__dirname, "..", "project-view-policy.js"), "utf8").includes("function axisLayout")) {
  throw new Error("project-view-policy must expose axisLayout for fixed/fill column modes");
}
if (!styles.includes("flex-wrap: nowrap") || !styles.includes(".project-scale-switcher")) {
  throw new Error("gantt scale switcher must stay on one row");
}
if (!styles.includes(".project-gantt-days-viewport.has-gantt-nav .gantt-axis-nav") || !styles.includes("is-prev")) {
  throw new Error("gantt axis nav must overlay so today-line aligns with chart");
}
if (!app.includes("rowsWrap.prepend(headerSplit)") || !styles.includes("position: sticky")) {
  throw new Error("gantt axis must live in the same scrollport as chart rows");
}
if (!styles.includes("outline: 1px solid") || !styles.includes(".gantt-holiday-lane > i")) {
  throw new Error("day axis and holiday lane must share borderless column geometry");
}
if (!app.includes("mergeSelectedTasksIntoNew") || !app.includes('data-gantt-action="merge-selection"')) {
  throw new Error("multi-select merge into one new task is required");
}
if (!fs.readFileSync("index.html", "utf8").includes("gantt-view-policy.js")) {
  throw new Error("index.html must load gantt-view-policy.js");
}
if (!app.includes("showGanttBlankContextMenu") || !app.includes('data-gantt-action="add-root"')) {
  throw new Error("gantt blank area must support right-click new parent task");
}
if (!app.includes("bindGanttBlankContextMenu") || !app.includes("isGanttTaskRowContextTarget")) {
  throw new Error("gantt blank context menu must bind on the gantt root");
}
if (app.includes('placeholder = meeting ? "例如：我')) {
  throw new Error("owner placeholders must not use 我 as the example person");
}
if (!app.includes("window.confirm(message)")) {
  throw new Error("gantt/task delete must ask for secondary confirmation");
}
if (!app.includes('openTaskDialog(null, { parentId: parentTask.id, lockParent: true })')) {
  throw new Error("gantt new-child must open dialog with locked parent");
}
if (!styles.includes(".task-parent-field.is-locked .entry-task-trigger")) {
  throw new Error("locked parent field should only change interaction, not form chrome");
}
if (!styles.includes("body.in-desktop.glass-mode #taskDialog .entry-task-trigger")) {
  throw new Error("task dialog parent trigger must match modal input background in glass mode");
}
if (!styles.includes("text-align: center") || !styles.includes(".gantt-progress-pct")) {
  throw new Error("gantt progress labels must stay centered in the bar");
}
if (!app.includes("parentPlanProgressPercent") || !app.includes("workdayPlanHoursBetween")) {
  throw new Error("parent gantt progress must use workday plan hours");
}
if (!app.includes("getTaskProgressNotes")) {
  throw new Error("leaf gantt bars should surface schedule progress notes");
}
if (!app.includes("mapEntryGanttSegments") || !app.includes("entryInvestmentSegments")) {
  throw new Error("gantt actual bars must split per schedule entry");
}
const projectView = require("fs").readFileSync(require("path").join(__dirname, "..", "project-view-policy.js"), "utf8");
if (!projectView.includes("function axisMetrics") || !projectView.includes("bucketDayCount")) {
  throw new Error("gantt axis must weight columns by calendar days");
}
if (!app.includes("applyGanttAxisTrackWidths") || !app.includes("gridTemplateColumns")) {
  throw new Error("gantt header/chart must share layout-driven grid columns");
}
if (!app.includes("axisLayout") || !app.includes("is-fixed-unit")) {
  throw new Error("gantt must support fill vs fixed-unit column modes");
}
if (!app.includes("gantt-entry-label")) {
  throw new Error("each invest bar should carry its own hours/note label");
}
if (app.includes('title="有投入：${escapeHtml(segment.label)}"')) {
  throw new Error("merged day-label tooltips like 有投入：10/10 must not be used for entry bars");
}
if (!styles.includes(".project-gantt-row-label.is-selected")) {
  throw new Error("selected gantt rows need highlight styles");
}
if (!app.includes("restoreProjectGanttRowsScroll(savedRowsTop)")) {
  throw new Error("shifting gantt window must restore vertical scroll position");
}
if (!styles.includes(".gantt-axis-nav") || !styles.includes(".is-fill-width")) {
  throw new Error("gantt axis arrows and fill-width timeline styles are required");
}
if (!app.includes("is-fill-width")) {
  throw new Error("gantt chart tracks must fill viewport width");
}

console.log("gantt visual policy tests passed");
