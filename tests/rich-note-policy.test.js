const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const RichNotePolicy = require("../rich-note-policy.js");

assert.equal(RichNotePolicy.plainTextFromNote("只是文字"), "只是文字");
assert.equal(
  RichNotePolicy.plainTextFromNote("完成了<br>下一步<img src=\"data:image/png;base64,AAAA\">"),
  "完成了\n下一步"
);
assert.equal(RichNotePolicy.hasInlineImages("<img src=\"data:image/jpeg;base64,AAAA\">"), true);
assert.equal(RichNotePolicy.hasInlineImages("纯文字"), false);
assert.equal(RichNotePolicy.isEffectivelyEmpty("<div><br></div>"), true);
assert.equal(RichNotePolicy.isEffectivelyEmpty("<img src=\"data:image/png;base64,AAAA\">"), false);

assert.equal(
  RichNotePolicy.normalizeNoteForStorage("hello"),
  "hello"
);
assert.equal(
  RichNotePolicy.normalizeNoteForStorage("<script>alert(1)</script>ok"),
  "ok"
);

const tinyPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
assert.equal(RichNotePolicy.isAllowedDataImageSrc(tinyPng), true);
assert.equal(RichNotePolicy.isAllowedDataImageSrc("https://example.com/a.png"), false);

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
assert.match(html, /id="taskCloseCompletionNote"/);
assert.match(html, /contenteditable="true"/);
assert.match(html, /rich-note-policy\.js/);
assert.match(app, /bindRichNoteEditor\(el\.taskCloseCompletionNote\)/);
assert.match(app, /bindRichNoteEditor\(el\.taskBusinessBackground\)/);
assert.match(app, /insertCompressedImageIntoRichNote/);
assert.match(app, /getRichNoteEditorValue/);
assert.doesNotMatch(html, /<textarea id="taskCloseCompletionNote"/);
assert.doesNotMatch(html, /<textarea id="taskBusinessBackground"/);
assert.match(html, /id="taskBusinessBackground"[\s\S]*contenteditable="true"/);

console.log("rich note policy tests passed");
