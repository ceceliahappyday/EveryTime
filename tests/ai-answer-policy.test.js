const assert = require("node:assert/strict");
const policy = require("../ai-answer-policy.js");

const withFence = [
  "以下是未完成任务：",
  "",
  "| 任务 | 状态 |",
  "| --- | --- |",
  "| 合同审批 | 进行中 |",
  "",
  "```everytime-tables",
  JSON.stringify({
    tables: [{
      name: "未完成任务",
      headers: ["任务", "状态", "工时"],
      rows: [["合同审批", "进行中", 1.5]]
    }]
  }),
  "```"
].join("\n");

const parsed = policy.parseAssistantAnswer(withFence);
assert.match(parsed.displayText, /以下是未完成任务/);
assert.doesNotMatch(parsed.displayText, /everytime-tables/);
assert.equal(parsed.tables.length, 1);
assert.equal(parsed.tables[0].name, "未完成任务");
assert.deepEqual(parsed.tables[0].headers, ["任务", "状态", "工时"]);
assert.deepEqual(parsed.tables[0].rows[0], ["合同审批", "进行中", 1.5]);

const markdownOnly = policy.parseAssistantAnswer([
  "明细如下：",
  "| 名称 | 负责人 |",
  "|---|---|",
  "| A | 我 |",
  "| B | 张三 |"
].join("\n"));
assert.equal(markdownOnly.tables.length, 1);
assert.equal(markdownOnly.tables[0].rows.length, 2);
assert.match(markdownOnly.displayText, /明细如下/);

assert.equal(policy.wantsTableExport("请导出 excel 表格"), true);
assert.equal(policy.wantsTableExport("今天有什么会"), false);

console.log("ai answer policy tests passed");
