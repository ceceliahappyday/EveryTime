const assert = require("node:assert/strict");
const policy = require("../ai-provider-policy.js");

assert.equal(policy.detectProviderId("sk-or-v1-abc"), "openrouter");
assert.equal(policy.detectProviderId("sk-ant-api03-xyz"), "anthropic");
assert.equal(policy.detectProviderId("gsk_abc"), "groq");
assert.equal(policy.detectProviderId("AIzaSyAbc"), "gemini");
assert.equal(policy.detectProviderId("sk-proj-openai"), "openai");
assert.equal(policy.isAmbiguousSkKey("sk-proj-openai"), true);
assert.equal(policy.isAmbiguousSkKey("sk-or-v1-abc"), false);

const resolved = policy.resolveProvider({ apiKey: "sk-test", providerId: "deepseek" });
assert.equal(resolved.id, "deepseek");
assert.equal(resolved.ambiguous, true);
assert.ok(resolved.selectableProviderIds.includes("moonshot"));

const fixed = policy.resolveProvider({ apiKey: "sk-or-v1-abc", providerId: "deepseek" });
assert.equal(fixed.id, "openrouter", "clear prefixes should win over manual incompatible choice");

const models = policy.normalizeModelEntries([
  { id: "gpt-4.1-mini" },
  { id: "text-embedding-3-large" },
  { id: "whisper-1" }
], policy.getProvider("openai"));
assert.deepEqual(models, ["gpt-4.1-mini"]);

const chat = policy.buildChatRequest({
  provider: policy.getProvider("openai"),
  apiKey: "sk-test",
  model: "gpt-4.1-mini",
  question: "有哪些未完成任务",
  rangeLabel: "本周",
  context: { tasks: [{ title: "A" }] }
});
assert.match(chat.url, /\/chat\/completions$/);
assert.equal(chat.body.model, "gpt-4.1-mini");
assert.equal(chat.body.messages[0].role, "system");

const anthropic = policy.buildChatRequest({
  provider: policy.getProvider("anthropic"),
  apiKey: "sk-ant-test",
  model: "claude-3-5-haiku-latest",
  question: "总结",
  context: {}
});
assert.match(anthropic.url, /\/messages$/);
assert.ok(anthropic.headers["x-api-key"]);

assert.equal(
  policy.extractChatText({ choices: [{ message: { content: "你好" } }] }, policy.getProvider("openai")),
  "你好"
);
assert.equal(
  policy.extractChatText({ content: [{ type: "text", text: "Claude 回复" }] }, policy.getProvider("anthropic")),
  "Claude 回复"
);

console.log("ai provider policy tests passed");
