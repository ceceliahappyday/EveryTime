const assert = require("node:assert/strict");
const policy = require("../ai-task-draft-policy.js");

assert.ok(policy.EXTRACT_SYSTEM_PROMPT.includes("tasks"));

const parts = policy.buildVisionUserParts({
  note: "跟进合同",
  imageBase64: "data:image/png;base64,AAAA",
  today: "2026-09-23"
});
assert.equal(parts.mimeType, "image/png");
assert.equal(parts.base64, "AAAA");
assert.match(parts.text, /2026-09-23/);
assert.match(parts.text, /跟进合同/);

const draft = policy.parseDraftResponse(`\`\`\`json
{
  "title": "跟进合同审批进度并补充材料",
  "dueDate": "2026-09-30",
  "dueTime": "18:00",
  "owner": "王芳",
  "priority": "important_urgent",
  "businessBackground": "截图来自微信催办。",
  "confidence": 0.82
}
\`\`\``);
assert.equal(draft.title, "跟进合同审批进度并补充材料");
assert.equal(draft.dueDate, "2026-09-30");
assert.equal(draft.dueTime, "18:00");
assert.equal(draft.owner, "王芳");
assert.equal(draft.priority, "important_urgent");
assert.equal(draft.confidence, 0.82);

const many = policy.parseDraftListResponse(JSON.stringify({
  tasks: [
    { title: "准备周报", dueDate: "2026-09-24", priority: "kpi" },
    { title: "回复客户邮件", dueTime: "9:30" },
    { title: "" },
    { title: "同步项目进度", priority: "weird" }
  ]
}));
assert.equal(many.length, 3);
assert.equal(many[0].title, "准备周报");
assert.equal(many[1].dueTime, "09:30");
assert.equal(many[2].priority, "general_daily");

const asArray = policy.parseDraftListResponse(JSON.stringify([
  { title: "A" },
  { title: "B" }
]));
assert.equal(asArray.length, 2);

const fallback = policy.parseDraftResponse(JSON.stringify({
  title: "整理周报",
  priority: "not-a-real-priority",
  dueDate: "bad",
  dueTime: "9:5",
  confidence: 2
}));
assert.equal(fallback.priority, "general_daily");
assert.equal(fallback.dueDate, "");
assert.equal(fallback.dueTime, "09:05");
assert.equal(fallback.confidence, 1);

assert.throws(() => policy.parseDraftResponse("没有 JSON"), /可解析|未能识别/);
assert.throws(() => policy.parseDraftListResponse('{"title":""}'), /未能识别/);

console.log("ai task draft policy tests passed");
