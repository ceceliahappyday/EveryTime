const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const preload = fs.readFileSync(path.join(__dirname, "..", "preload.js"), "utf8");

assert.match(html, /id="taskAiDropzone"/, "new-task dialog needs screenshot dropzone");
assert.match(html, /id="aiBatchDraftDialog"/, "multi-todo review dialog must exist");
assert.match(html, /id="aiChatLog"/, "AI dialog needs chat log");
assert.match(html, /id="aiAttachment"/, "AI dialog needs attachment preview");
assert.match(html, /ai-task-draft-policy\.js/, "renderer must load draft policy");
assert.match(preload, /aiExtractTask/, "preload must expose aiExtractTask");
assert.match(app, /createTaskFromAiDraft/, "renderer must create tasks from AI drafts");
assert.match(app, /createTasksFromAiDrafts/, "batch create helper must exist");
assert.match(app, /openAiBatchDraftDialog/, "multi drafts open review dialog");
assert.match(app, /extractAndCreateTaskFromImage/, "screenshot create pipeline must exist");
assert.match(app, /aiDialogScroll/, "AI dialog scroll region must remain available");

console.log("ai screenshot ui tests passed");
