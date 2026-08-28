const targets = await fetch("http://127.0.0.1:9223/json").then(response => response.json());
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
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
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

const initial = await evaluate(`(() => ({
  headings: [...document.querySelectorAll("#taskList .task-group-heading")].map(node => ({
    text: node.textContent.trim(),
    position: getComputedStyle(node).position
  })),
  cards: [...document.querySelectorAll("#taskList .task-card strong")].map(node => node.textContent.trim())
}))()`);

const collapse = await evaluate(`(async () => {
  document.querySelector('#taskTabs [data-filter="all"]').click();
  await new Promise(resolve => setTimeout(resolve, 100));
  const heading = document.querySelector("#taskList button.task-group-heading");
  const before = document.querySelectorAll("#taskList .task-card").length;
  heading?.click();
  await new Promise(resolve => setTimeout(resolve, 100));
  const collapsedHeading = document.querySelector("#taskList button.task-group-heading");
  const after = document.querySelectorAll("#taskList .task-card").length;
  const collapsed = collapsedHeading?.getAttribute("aria-expanded") === "false";
  collapsedHeading?.click();
  await new Promise(resolve => setTimeout(resolve, 100));
  return { available: Boolean(heading), before, after, collapsed };
})()`);

const search = await evaluate(`(async () => {
  const input = document.querySelector("#taskListSearch");
  input.focus();
  input.value = "科技园";
  input.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: "科技园" }));
  await new Promise(resolve => setTimeout(resolve, 350));
  return {
    value: input.value,
    focused: document.activeElement === input,
    color: getComputedStyle(input).color,
    backgroundColor: getComputedStyle(input).backgroundColor,
    cards: [...document.querySelectorAll("#taskList .task-card strong")].map(node => node.textContent.trim()),
    empty: document.querySelector("#taskList .empty-state")?.textContent.trim() || ""
  };
})()`);

const yesterday = await evaluate(`(async () => {
  const input = document.querySelector("#taskListSearch");
  input.value = "";
  input.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "deleteContentBackward" }));
  await new Promise(resolve => setTimeout(resolve, 250));
  document.querySelector("#continueYesterdayButton").click();
  await new Promise(resolve => setTimeout(resolve, 150));
  return {
    headings: [...document.querySelectorAll("#taskList .task-group-heading")].map(node => node.textContent.trim()),
    cards: [...document.querySelectorAll("#taskList .task-card strong")].map(node => node.textContent.trim()),
    linkedCards: [...document.querySelectorAll("#taskList .linked-work-card")].map(node => ({
      title: node.querySelector("strong")?.textContent.trim(),
      draggable: node.draggable,
      entryId: node.dataset.entryId
    })),
    empty: document.querySelector("#taskList .empty-state")?.textContent.trim() || ""
  };
})()`);

const dragCopy = await evaluate(`(async () => {
  const card = document.querySelector("#taskList .linked-work-card");
  const slot = document.querySelector('.time-slot[data-hour="15"]');
  if (!card || !slot) return { available: false };
  const transfer = new DataTransfer();
  card.dispatchEvent(new DragEvent("dragstart", { bubbles: true, cancelable: true, dataTransfer: transfer }));
  const transferredEntryId = transfer.getData("text/entry-id");
  slot.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: transfer }));
  slot.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
  await new Promise(resolve => setTimeout(resolve, 200));
  return {
    available: true,
    transferredEntryId,
    copiedCardVisible: [...document.querySelectorAll(".schedule-entry")].some(node =>
      node.textContent.includes("完成科技园公司项目盈利结构表")
    ),
    dragHighlightsRemaining: document.querySelectorAll(".drag-over").length
  };
})()`);

const linkedWorkActions = await evaluate(`(async () => {
  const card = document.querySelector("#taskList .linked-work-card");
  if (!card) return { available: false };
  card.querySelector(".task-menu").click();
  await new Promise(resolve => setTimeout(resolve, 150));
  const taskDialog = document.querySelector("#taskDialog");
  const result = {
    available: true,
    dialogOpened: taskDialog.open,
    taskTitle: document.querySelector("#taskTitleInput").value,
    closeButtonVisible: !document.querySelector("#closeTaskButton").classList.contains("hidden")
  };
  document.querySelector("#closeTaskButton").click();
  await new Promise(resolve => setTimeout(resolve, 150));
  result.dialogClosed = !taskDialog.open;
  result.linkedCardRemoved = ![...document.querySelectorAll("#taskList .linked-work-card strong")]
    .some(node => node.textContent.includes("完成科技园公司项目盈利结构表"));
  return result;
})()`);

console.log(JSON.stringify({ initial, collapse, search, yesterday, dragCopy, linkedWorkActions }, null, 2));
socket.close();
