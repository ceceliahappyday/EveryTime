const port = process.argv[2] || "9225";
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

async function evaluate(expression) {
  const result = await call("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

const report = await evaluate(`(async () => {
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  document.querySelector('#viewSwitcher [data-view="project"]')?.click();
  await wait(500);
  const chrome = document.getElementById("projectGanttChrome");
  const scroller = document.querySelector(".project-gantt-scroll");
  const row = document.querySelector(".project-gantt-row");
  const title = row?.querySelector(".project-gantt-title.is-title-pin");
  const chromeBefore = chrome?.getBoundingClientRect().left ?? 0;
  const titleBefore = title?.getBoundingClientRect().left ?? 0;
  scroller.scrollLeft = 800;
  await wait(120);
  const chromeAfter = chrome?.getBoundingClientRect().left ?? 0;
  const titleAfter = title?.getBoundingClientRect().left ?? 0;
  const legendStart = getComputedStyle(document.querySelector(".gantt-legend i.legend-start")).backgroundColor;
  return {
    chromeFixed: Math.round(chromeBefore) === Math.round(chromeAfter),
    titlePinned: Math.abs(titleBefore - titleAfter) < 2,
    chromeOutsideScroll: !scroller?.querySelector(".project-gantt-toolbar") && Boolean(chrome?.querySelector(".project-gantt-toolbar")),
    scaleSwitcherVisible: Boolean(chrome?.querySelector(".project-scale-switcher")),
    legendStartColor: legendStart,
    titleIsSiblingOfLane: row?.querySelector(".project-gantt-lane")?.previousElementSibling?.classList.contains("project-gantt-title"),
    hasGanttRows: document.querySelectorAll(".project-gantt-row").length
  };
})()`);

console.log(JSON.stringify(report, null, 2));
if (!report.hasGanttRows) {
  console.warn("No gantt rows in test profile; layout checks skipped.");
} else {
  if (!report.chromeFixed) throw new Error("toolbar/legend moved while scrolling gantt");
  if (!report.titlePinned) throw new Error("task title moved while scrolling gantt");
  if (!report.chromeOutsideScroll) throw new Error("toolbar still rendered inside scroll container");
}
socket.close();
