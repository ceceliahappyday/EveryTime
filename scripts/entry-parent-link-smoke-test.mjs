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

const response = await call("Runtime.evaluate", {
  expression: `(async () => {
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const leafTitle = "父级关联验证-具体事项";
    const parentTitle = "父级关联验证-系列项目";
    state.taskView = "day";
    render();
    document.querySelector(".time-slot[data-hour='11']").click();
    document.querySelector("#entryTitle").value = leafTitle;
    document.querySelector("#entryType").value = "task_work";
    document.querySelector("#entryType").dispatchEvent(new Event("change", { bubbles: true }));
    document.querySelector("#entryTaskTrigger").click();
    await wait(50);
    const search = document.querySelector("#entryTaskSearch");
    search.value = parentTitle;
    search.dispatchEvent(new Event("input", { bubbles: true }));
    await wait(50);
    const parentOption = document.querySelector('[data-value="__create_parent__"]');
    const optionText = parentOption?.textContent.trim() || "";
    parentOption.click();
    document.querySelector("#entryForm").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await wait(80);
    const parentInput = document.querySelector("#entryParentTaskTitle");
    const suggestedParent = parentInput?.value || "";
    parentInput.value = parentTitle;
    document.querySelector("#entryLinkConfirmCreate").click();
    await wait(180);
    const leaf = getAllTasks().map(item => item.task).find(task => task.title === leafTitle);
    const parent = leaf ? findTask(leaf.parentId)?.task : null;
    const entry = Object.values(state.data).flatMap(day => day.entries || []).find(item => item.title === leafTitle);
    const result = {
      optionText,
      suggestedParent,
      leafCreated: Boolean(leaf),
      parentCreated: Boolean(parent),
      parentTitle: parent?.title || "",
      leafParentId: leaf?.parentId || "",
      entryLinksLeaf: Boolean(entry && leaf && entry.taskId === leaf.id),
      parentIsNotEntryLink: Boolean(entry && parent && entry.taskId !== parent.id),
      leafHasNoChildren: Boolean(leaf && !hasChildTasks(leaf.id))
    };
    Object.values(state.data).forEach(day => {
      day.entries = (day.entries || []).filter(item => item.id !== entry?.id);
      day.tasks = (day.tasks || []).filter(task => task.id !== leaf?.id && task.id !== parent?.id);
    });
    saveData();
    render();
    return result;
  })()`,
  awaitPromise: true,
  returnByValue: true
});
if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
console.log(JSON.stringify(response.result.value, null, 2));
socket.close();
