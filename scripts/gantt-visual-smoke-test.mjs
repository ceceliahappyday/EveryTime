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

async function evaluate(expression) {
  const result = await call("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

const report = await evaluate(`(async () => {
  document.querySelector('#taskTabs [data-filter="all"]').click();
  document.querySelector('#viewSwitcher [data-view="project"]').click();
  await new Promise(resolve => setTimeout(resolve, 400));
  const inspect = scale => {
    const rows = [...document.querySelectorAll(".project-gantt-row")].slice(0, 8).map(row => ({
      title: row.querySelector(".project-gantt-title strong")?.textContent.replace(/\\s+/g, " ").trim().slice(0, 24),
      progress: row.querySelector(".gantt-progress-pct")?.textContent.trim() || "",
      fill: row.querySelector(".gantt-progress-fill")?.style.width || "",
      segments: [...row.querySelectorAll(".gantt-actual-bar")].map(bar => ({
        left: bar.style.left,
        width: bar.style.width,
        title: bar.title
      })),
      start: row.querySelector(".gantt-start-marker")?.title || "",
      end: row.querySelector(".gantt-end-marker")?.title || "",
      cutoff: row.querySelector(".gantt-cutoff-flag")?.title || ""
    }));
    return { scale, buckets: document.querySelectorAll(".project-gantt-days span").length, rows };
  };
  const results = [inspect("day")];
  for (const scale of ["week", "month"]) {
    document.querySelector('.project-scale-switcher [data-scale="' + scale + '"]').click();
    await new Promise(resolve => setTimeout(resolve, 250));
    results.push(inspect(scale));
  }
  document.querySelector('.project-scale-switcher [data-scale="day"]').click();
  await new Promise(resolve => setTimeout(resolve, 250));
  return {
    legend: [...document.querySelectorAll(".gantt-legend span")].map(node => node.textContent.trim()),
    results
  };
})()`);

console.log(JSON.stringify(report, null, 2));
socket.close();
