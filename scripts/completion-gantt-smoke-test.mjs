const targets = await fetch("http://127.0.0.1:9224/json").then(response => response.json());
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
  const result = await call("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

const completion = await evaluate(`(async () => {
  document.querySelector('#taskTabs [data-filter="all"]').click();
  await new Promise(resolve => setTimeout(resolve, 100));
  const search = document.querySelector("#taskListSearch");
  search.value = "完成产业公司ROIC指标测算";
  search.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: search.value }));
  await new Promise(resolve => setTimeout(resolve, 400));
  const card = [...document.querySelectorAll("#taskList .task-card")]
    .find(node => node.querySelector("strong")?.textContent.trim() === "完成产业公司ROIC指标测算");
  if (!card) return {
    error: "target card not found",
    candidates: [...document.querySelectorAll("#taskList .task-card strong")].map(node => node.textContent.trim())
  };
  card.querySelector(".task-menu").click();
  await new Promise(resolve => setTimeout(resolve, 100));
  const end = document.querySelector("#taskActualEnd");
  end.value = "2026-08-20T10:00";
  end.dispatchEvent(new Event("change", { bubbles: true }));
  document.querySelector("#taskEditForm").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  await new Promise(resolve => setTimeout(resolve, 250));
  document.querySelector('#taskTabs [data-filter="ended"]').click();
  await new Promise(resolve => setTimeout(resolve, 100));
  const endedCard = [...document.querySelectorAll("#taskList .task-card")]
    .find(node => node.querySelector("strong")?.textContent.trim() === "完成产业公司ROIC指标测算");
  endedCard.querySelector(".task-menu").click();
  await new Promise(resolve => setTimeout(resolve, 100));
  const result = {
    endedCardVisible: Boolean(endedCard),
    endedCardClass: endedCard.className,
    savedCompletedAt: document.querySelector("#taskActualEnd").value,
    savedStartedAt: document.querySelector("#taskActualStart").value,
    detailText: document.querySelector("#taskDetailSummary").textContent.replace(/\\s+/g, " ").trim()
  };
  document.querySelector('[data-close-dialog="taskDialog"]').click();
  return result;
})()`);

const gantt = await evaluate(`(async () => {
  document.querySelector('#taskTabs [data-filter="all"]').click();
  document.querySelector('#viewSwitcher [data-view="project"]').click();
  await new Promise(resolve => setTimeout(resolve, 250));
  const inspect = scale => {
    const row = [...document.querySelectorAll(".project-gantt-row")]
      .find(node => node.querySelector(".project-gantt-title")?.textContent.includes("梳理光伏公司的业务模式"));
    const bar = row?.querySelector(".gantt-actual-bar");
    return {
      scale,
      rowVisible: Boolean(row),
      actualBarVisible: Boolean(bar),
      left: bar?.style.left || "",
      width: bar?.style.width || "",
      header: [...document.querySelectorAll(".project-gantt-days span")].map(node => node.textContent.trim())
    };
  };
  const results = [inspect("day")];
  for (const scale of ["week", "month"]) {
    document.querySelector('.project-scale-switcher [data-scale="' + scale + '"]').click();
    await new Promise(resolve => setTimeout(resolve, 200));
    results.push(inspect(scale));
  }
  return results;
})()`);

console.log(JSON.stringify({ completion, gantt }, null, 2));
socket.close();
