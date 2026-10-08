(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.AiAnswerPolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  const TABLE_FENCE_RE = /```(?:everytime-tables|json-tables)\s*([\s\S]*?)```/gi;

  function sanitizeCell(value) {
    if (value == null) return "";
    if (typeof value === "number" && Number.isFinite(value)) return value;
    return String(value).replace(/\r\n/g, "\n").trim();
  }

  function normalizeTable(raw = {}, index = 0) {
    const headers = Array.isArray(raw.headers)
      ? raw.headers.map(item => String(item ?? "").trim() || "列")
      : [];
    const rows = Array.isArray(raw.rows)
      ? raw.rows
        .filter(row => Array.isArray(row))
        .map(row => row.map(sanitizeCell))
      : [];
    if (!headers.length && !rows.length) return null;
    const width = Math.max(headers.length, ...rows.map(row => row.length), 1);
    const normalizedHeaders = Array.from({ length: width }, (_, i) => headers[i] || `列${i + 1}`);
    const normalizedRows = rows.map(row => Array.from({ length: width }, (_, i) => (
      row[i] == null ? "" : row[i]
    )));
    const name = String(raw.name || raw.title || `表格${index + 1}`).trim().slice(0, 31) || `表格${index + 1}`;
    return { name, headers: normalizedHeaders, rows: normalizedRows };
  }

  function extractJsonTables(text = "") {
    const tables = [];
    let displayText = String(text || "");
    displayText = displayText.replace(TABLE_FENCE_RE, (_match, body) => {
      try {
        const parsed = JSON.parse(String(body || "").trim());
        const list = Array.isArray(parsed?.tables)
          ? parsed.tables
          : (Array.isArray(parsed) ? parsed : (parsed?.headers ? [parsed] : []));
        list.forEach(item => {
          const table = normalizeTable(item, tables.length);
          if (table) tables.push(table);
        });
      } catch {
        /* keep original fence if JSON invalid */
        return _match;
      }
      return "";
    });
    return { displayText: displayText.replace(/\n{3,}/g, "\n\n").trim(), tables };
  }

  function splitMarkdownRow(line = "") {
    const trimmed = String(line || "").trim().replace(/^\|/, "").replace(/\|$/, "");
    if (!trimmed) return [];
    return trimmed.split("|").map(cell => cell.trim());
  }

  function isMarkdownSeparator(line = "") {
    const cells = splitMarkdownRow(line);
    return cells.length > 0 && cells.every(cell => /^:?-{3,}:?$/.test(cell));
  }

  function extractMarkdownTables(text = "") {
    const lines = String(text || "").split(/\r?\n/);
    const tables = [];
    const keep = [];
    let i = 0;
    while (i < lines.length) {
      const headerLine = lines[i];
      const separatorLine = lines[i + 1];
      if (
        headerLine &&
        separatorLine &&
        headerLine.includes("|") &&
        isMarkdownSeparator(separatorLine)
      ) {
        const headers = splitMarkdownRow(headerLine);
        if (headers.length) {
          const rows = [];
          let j = i + 2;
          while (j < lines.length && lines[j].includes("|") && !isMarkdownSeparator(lines[j])) {
            const row = splitMarkdownRow(lines[j]);
            if (row.some(cell => cell !== "")) rows.push(row);
            j += 1;
          }
          const table = normalizeTable({ name: `表格${tables.length + 1}`, headers, rows }, tables.length);
          if (table) tables.push(table);
          i = j;
          continue;
        }
      }
      keep.push(headerLine);
      i += 1;
    }
    return { displayText: keep.join("\n").replace(/\n{3,}/g, "\n\n").trim(), tables };
  }

  function parseAssistantAnswer(text = "") {
    const fromJson = extractJsonTables(text);
    // Prefer structured everytime-tables for export; keep Markdown in chat text for reading.
    if (fromJson.tables.length) {
      return {
        displayText: fromJson.displayText || String(text || "").trim(),
        tables: fromJson.tables
      };
    }
    const fromMarkdown = extractMarkdownTables(fromJson.displayText);
    return {
      displayText: fromMarkdown.displayText || fromJson.displayText || String(text || "").trim(),
      tables: fromMarkdown.tables
    };
  }

  function wantsTableExport(question = "") {
    return /(表格|excel|xlsx|csv|导出表|下载表|做成表|生成表)/i.test(String(question || ""));
  }

  return {
    TABLE_FENCE_RE,
    sanitizeCell,
    normalizeTable,
    extractJsonTables,
    extractMarkdownTables,
    parseAssistantAnswer,
    wantsTableExport
  };
});
