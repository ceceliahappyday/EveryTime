const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const preload = fs.readFileSync(path.join(__dirname, "..", "preload.js"), "utf8");

assert.match(html, /id="taskAiDropzone"/, "new-task dialog needs screenshot dropzone");
assert.match(html, /id="aiBatchDraftDialog"/, "multi-todo review dialog must exist");
assert.match(html, /id="aiPrompt"/, "AI dialog needs single message box");
assert.doesNotMatch(html, /id="aiChatLog"/, "AI dialog should not keep a separate chat log pane");
assert.match(html, /id="aiAttachment"/, "AI dialog needs attachment preview");
assert.match(app, /Shift\+Enter|shiftKey/, "AI message box must support keyboard send shortcuts");
assert.match(html, /ai-task-draft-policy\.js/, "renderer must load draft policy");
assert.match(preload, /aiExtractTask/, "preload must expose aiExtractTask");
assert.match(app, /createTaskFromAiDraft/, "renderer must create tasks from AI drafts");
assert.match(app, /createTasksFromAiDrafts/, "batch create helper must exist");
assert.match(app, /openAiBatchDraftDialog/, "multi drafts open review dialog");
assert.match(app, /extractAndCreateTaskFromImage/, "screenshot create pipeline must exist");
assert.match(html, /id="aiDialogScroll"/, "AI dialog scroll region must remain available");
assert.match(app, /showAiMessageInBox/, "AI replies should reuse the single message box");
assert.match(app, /beginParentReviewQueue/, "batch create must queue parent review dialogs");
assert.match(app, /suggestAiBatchParent/, "batch create must suggest parents from history");
assert.match(app, /aiBatchApplyParentButton/, "batch create must support applying one parent to selected drafts");
assert.match(html, /id="aiBatchSharedParent"/, "batch dialog needs shared parent selector");
assert.match(app, /exportAiTables/, "AI assistant must support table file export");
assert.match(app, /copyTextToClipboard/, "AI copy must use a reliable clipboard helper");
assert.match(app, /writeClipboardText/, "AI copy should prefer desktop clipboard bridge");
assert.match(html, /id="aiExportTablesButton"/, "AI dialog needs Excel download button");
assert.match(html, /id="taskCloseCompletedAt"/, "close confirm needs completion time");
assert.match(html, /id="taskCloseCompletionNote"/, "close confirm needs completion note");
assert.match(html, /id="taskCloseSuccessorButton"/, "close confirm needs successor action");

console.log("ai screenshot ui tests passed");
