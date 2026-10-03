const targets = await fetch("http://127.0.0.1:9224/json").then(response => response.json());
const page = targets.find(target => target.type === "page" && target.url.includes("index.html"));
if (!page) throw new Error("EveryTime renderer target not found");
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});
let id = 0;
const pending = new Map();
socket.addEventListener("message", event => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const handler = pending.get(message.id);
  pending.delete(message.id);
  handler.resolve(message.result);
});
function call(method, params) {
  const requestId = ++id;
  socket.send(JSON.stringify({ id: requestId, method, params }));
  return new Promise(resolve => pending.set(requestId, { resolve }));
}
const result = await call("Runtime.evaluate", {
  expression: `(async () => {
    document.querySelector('#viewSwitcher [data-view="day"]').click();
    document.querySelector('#taskTabs [data-filter="all"]').click();
    const search = document.querySelector("#taskListSearch");
    search.value = "BPM流程审核";
    search.dispatchEvent(new InputEvent("input", { bubbles: true, data: search.value }));
    await new Promise(resolve => setTimeout(resolve, 350));
    const card = [...document.querySelectorAll("#taskList .task-card")]
      .find(node => node.querySelector("strong")?.textContent.trim() === "BPM流程审核");
    if (!card) return { error: "target card not found" };
    card.querySelector(".task-check").click();
    await new Promise(resolve => setTimeout(resolve, 200));
    const endedCard = [...document.querySelectorAll("#taskList .task-card")]
      .find(node => node.querySelector("strong")?.textContent.trim() === "BPM流程审核");
    endedCard.querySelector(".task-menu").click();
    await new Promise(resolve => setTimeout(resolve, 100));
    return {
      endedClass: endedCard.className,
      completedAt: document.querySelector("#taskActualEnd").value,
      startedAt: document.querySelector("#taskActualStart").value
    };
  })()`,
  awaitPromise: true,
  returnByValue: true
});
if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
console.log(JSON.stringify(result.result.value, null, 2));
socket.close();
