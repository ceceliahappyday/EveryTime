const assert = require("node:assert/strict");
const policy = require("../ai-provider-policy.js");

const moonshot = policy.getProvider("moonshot");
const templateBase = moonshot.baseUrl.replace(/\/$/, "");
const requestUrl = `${templateBase}/chat/completions`;
const intl = "https://api.moonshot.ai/v1";

assert.equal(
  policy.swapRequestBaseUrl(requestUrl, templateBase, intl),
  `${intl}/chat/completions`,
  "custom base URL must replace provider default host on every request"
);

console.log("ai fetch base url tests passed");
