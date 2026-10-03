const port = process.argv[2] || "9223";
const targets = await fetch(`http://127.0.0.1:${port}/json`).then(response => response.json());
const page = targets.find(target => target.type === "page" && target.url.includes("index.html"));
if (!page) throw new Error("EveryTime renderer target not found");

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let requestId = 0;
const pending = new Map();
socket.addEventListener("message", event => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const handler = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) handler.reject(new Error(message.error.message));
  else handler.resolve(message.result);
});

function call(method, params = {}) {
  const id = ++requestId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

const result = await call("Runtime.evaluate", {
  expression: `(async () => {
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    document.querySelector('#taskTabs [data-filter="all"]').click();
    document.querySelector('#viewSwitcher [data-view="project"]').click();
    await wait(350);
    document.querySelector('.project-scale-switcher [data-scale="day"]').click();
    await wait(350);
    const header = document.querySelector(".project-gantt-days");
    const row = document.querySelector(".project-gantt-row");
    const lane = row?.querySelector(".project-gantt-lane");
    const wrap = document.querySelector("#timelineWrap");
    wrap.scrollLeft = 5000;
    await wait(100);
    const stickyTaskLabel = row?.querySelector(".project-gantt-title");
    const stickyProjectLabel = document.querySelector(".project-gantt-row.is-parent .project-gantt-title");
    const gantt = {
      lastDate: [...header.querySelectorAll("span")].at(-1)?.textContent.trim(),
      bucketCount: header.querySelectorAll("span").length - 1,
      headerWidth: Math.round(header.getBoundingClientRect().width),
      rowWidth: Math.round(row?.getBoundingClientRect().width || 0),
      laneWidth: Math.round(lane?.getBoundingClientRect().width || 0),
      entryDots: document.querySelectorAll(".project-gantt-lane em").length,
      scrollLeft: Math.round(wrap.scrollLeft),
      taskLabelLeft: Math.round(stickyTaskLabel?.getBoundingClientRect().left || 0),
      projectLabelLeft: Math.round(stickyProjectLabel?.getBoundingClientRect().left || 0),
      viewportLeft: Math.round(wrap.getBoundingClientRect().left),
      taskLabelZ: stickyTaskLabel ? getComputedStyle(stickyTaskLabel).zIndex : "",
      laneZ: lane ? getComputedStyle(lane).zIndex : "",
      marker: (() => {
        const node = document.querySelector(".gantt-start-marker");
        const style = node ? getComputedStyle(node) : null;
        return style ? { width: style.width, height: style.height, top: style.top } : null;
      })(),
      projectSummary: document.querySelector(".gantt-progress-pct")?.textContent.trim() || "",
      progressOnBar: Boolean(document.querySelector(".gantt-progress-fill"))
    };

    document.querySelector("#todayButton").click();
    await wait(250);
    const today = {
      dayViewActive: document.querySelector('#viewSwitcher [data-view="day"]').classList.contains("active"),
      title: document.querySelector("#scheduleTitle").textContent.trim()
    };
    const taskWork = document.querySelector(".schedule-entry:has(.schedule-entry-type)");
    const day = {
      taskWorkHasTimeLine: Boolean(taskWork?.querySelector(":scope > span")),
      anyEntryHasTimeLine: [...document.querySelectorAll(".schedule-entry")].some(node => Boolean(node.querySelector(":scope > span")))
    };

    const card = document.querySelector("#taskList .task-card:not(.linked-work-card)");
    card?.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    await wait(100);
    const taskDoubleClickOpened = document.querySelector("#taskDialog").open;
    document.querySelector("#taskDialog")?.close();

    document.querySelector('#viewSwitcher [data-view="week"]').click();
    await wait(250);
    const week = {
      dayCount: document.querySelectorAll(".week-schedule-day").length,
      weekendCount: document.querySelectorAll(".week-schedule-day.weekend").length,
      titles: [...document.querySelectorAll(".week-task-line strong")].slice(0, 8).map(node => node.textContent.trim()),
      labels: [...document.querySelectorAll(".week-task-line small")].slice(0, 8).map(node => node.textContent.trim()),
      weekdayWidth: Math.round(document.querySelector(".week-schedule-day:not(.weekend)")?.getBoundingClientRect().width || 0),
      weekendWidth: Math.round(document.querySelector(".week-schedule-day.weekend")?.getBoundingClientRect().width || 0)
    };

    document.querySelector('#viewSwitcher [data-view="month"]').click();
    await wait(250);
    const month = {
      lines: [...document.querySelectorAll(".month-task-line")].slice(0, 8).map(node => node.textContent.replace(/\\s+/g, " ").trim()),
      oldTraceLists: document.querySelectorAll(".schedule-month-cell .task-trace-list").length,
      calendarEntries: document.querySelectorAll(".schedule-month-cell .calendar-entry-list").length,
      cellBorderRadius: getComputedStyle(document.querySelector(".schedule-month-cell")).borderRadius,
      clippedCells: [...document.querySelectorAll(".schedule-month-cell")].filter(node => node.scrollHeight > node.clientHeight + 1).length
    };
    return { gantt, today, day, taskDoubleClickOpened, week, month };
  })()`,
  awaitPromise: true,
  returnByValue: true
});

if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
console.log(JSON.stringify(result.result.value, null, 2));
socket.close();
