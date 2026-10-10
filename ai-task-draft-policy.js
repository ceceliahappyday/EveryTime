(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.AiTaskDraftPolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  const VALID_PRIORITIES = new Set([
    "general_daily",
    "kpi",
    "follow_up",
    "important_urgent",
    "paused"
  ]);
  const MAX_DRAFTS = 12;

  const EXTRACT_SYSTEM_PROMPT = [
    "你是 EveryTime 的截图事项提取助手。",
    "用户会提供一张与工作相关的截图（聊天、邮件、会议邀请、会议纪要、通知、清单等）和可选说明。",
    "请从截图中提炼出 1 条或多条事项；截图里有几件独立事项就提取几条，不要把无关内容硬拆。",
    "每条必须判断类型 kind：",
    '  meeting = 需要出席/参加的会议或日程本身（邀请、预约、例会、沟通会时间安排等）；',
    "  task = 需要执行的待办工作（纪要修改、准备材料、跟进审批、回复邮件等）。",
    "若截图同时有会议安排和会后待办，请拆成多条并分别标注 kind。",
    "最多输出 12 条。只根据截图与说明中可见的信息填写；看不到的日期、责任人/参会人不要编造。",
    "只输出一个 JSON 对象，不要 Markdown、不要代码围栏、不要解释文字。",
    '格式：{"items":[...]}；兼容 {"tasks":[...]}；若只有一条也可直接输出单个对象。',
    "每条字段：",
    '  kind: \"task\" | \"meeting\"，必填；',
    '  title: string，必填，不超过 80 字；会议用会议名称，待办写成可执行名称；',
    "  dueDate: string，YYYY-MM-DD 或空字符串（会议为开会日期，待办为目标日期）；",
    "  dueTime: string，HH:MM 24 小时制或空字符串（会议为开始时间）；",
    '  owner: string，待办默认「我」；会议可填参会人，多人用逗号分隔，未知则空字符串；',
    "  priority: general_daily | kpi | follow_up | important_urgent | paused（会议可固定 general_daily）；",
    "  businessBackground: string，不超过 800 字，用中文概括该条相关要点；",
    "  confidence: number，0 到 1，表示把握。"
  ].join("");

  function normalizeMimeType(mimeType = "") {
    const value = String(mimeType || "").trim().toLowerCase();
    if (value === "image/jpg") return "image/jpeg";
    if (["image/png", "image/jpeg", "image/webp", "image/gif"].includes(value)) return value;
    return "image/png";
  }

  function stripDataUrl(base64OrDataUrl = "") {
    const raw = String(base64OrDataUrl || "").trim();
    const match = raw.match(/^data:([^;]+);base64,(.+)$/i);
    if (match) {
      return { mimeType: normalizeMimeType(match[1]), base64: match[2].replace(/\s+/g, "") };
    }
    return { mimeType: "", base64: raw.replace(/\s+/g, "") };
  }

  function buildExtractUserText({ note = "", today = "" } = {}) {
    const lines = [
      `今天日期：${String(today || "").trim() || "未知"}`,
      "请根据附图提取事项（可多条），每条标明 kind=task 或 meeting，并只返回 JSON：{\"items\":[...]}。"
    ];
    const hint = String(note || "").trim().slice(0, 1000);
    if (hint) lines.push(`用户补充说明：${hint}`);
    return lines.join("\n");
  }

  function looksLikeMeetingEventTitle(title = "") {
    const t = String(title || "").trim().replace(/\s+/g, " ");
    if (!t) return false;
    if (!/(会议|例会|沟通会|对接会|研讨会|座谈会|讨论会|月会|周会|行政会)/.test(t)) return false;
    if (/(纪要|材料|编写|修改|准备|整理|通知|审核|更新|输出|测算|报告|方案|讲解|拉通|复盘|检查|分析|拟稿|通报)/.test(t)) {
      return false;
    }
    return true;
  }

  function normalizeItemKind(source = {}, title = "") {
    const raw = String(source.kind || source.type || source.itemType || "").trim().toLowerCase();
    if (["meeting", "calendar", "event", "会议", "日程"].includes(raw)) return "meeting";
    if (["task", "todo", "待办", "任务"].includes(raw)) return "task";
    return looksLikeMeetingEventTitle(title) ? "meeting" : "task";
  }

  function buildVisionUserParts({ note = "", imageBase64 = "", mimeType = "image/png", today = "" } = {}) {
    const parsed = stripDataUrl(imageBase64);
    const base64 = parsed.base64;
    const type = normalizeMimeType(mimeType || parsed.mimeType || "image/png");
    return {
      text: buildExtractUserText({ note, today }),
      mimeType: type,
      base64,
      dataUrl: base64 ? `data:${type};base64,${base64}` : ""
    };
  }

  function extractJsonValue(text = "") {
    const raw = String(text || "").trim();
    if (!raw) return null;
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = (fenced ? fenced[1] : raw).trim();
    try {
      return JSON.parse(candidate);
    } catch {}
    const objectStart = candidate.indexOf("{");
    const arrayStart = candidate.indexOf("[");
    let start = -1;
    let end = -1;
    if (objectStart >= 0 && (arrayStart < 0 || objectStart < arrayStart)) {
      start = objectStart;
      end = candidate.lastIndexOf("}");
    } else if (arrayStart >= 0) {
      start = arrayStart;
      end = candidate.lastIndexOf("]");
    }
    if (start < 0 || end <= start) return null;
    try {
      return JSON.parse(candidate.slice(start, end + 1));
    } catch {
      return null;
    }
  }

  function extractJsonObject(text = "") {
    return extractJsonValue(text);
  }

  function normalizeDate(value = "") {
    const text = String(value || "").trim();
    if (!text) return "";
    const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return match ? `${match[1]}-${match[2]}-${match[3]}` : "";
  }

  function normalizeTime(value = "") {
    const text = String(value || "").trim();
    if (!text) return "";
    const match = text.match(/^(\d{1,2}):(\d{1,2})/);
    if (!match) return "";
    const hour = Math.max(0, Math.min(23, Number(match[1])));
    const minute = Math.max(0, Math.min(59, Number(match[2])));
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  function parseOneDraft(source = {}) {
    if (!source || typeof source !== "object" || Array.isArray(source)) {
      throw new Error("AI 未返回可解析的事项 JSON");
    }
    const title = String(source.title || "").trim().slice(0, 80);
    if (!title) throw new Error("截图中未能识别出事项名称");
    const kind = normalizeItemKind(source, title);
    const priorityRaw = String(source.priority || "general_daily").trim();
    const priority = VALID_PRIORITIES.has(priorityRaw) ? priorityRaw : "general_daily";
    let confidence = Number(source.confidence);
    if (!Number.isFinite(confidence)) confidence = 0.6;
    confidence = Math.max(0, Math.min(1, confidence));
    const ownerDefault = kind === "meeting" ? "" : "我";
    const ownerLimit = kind === "meeting" ? 80 : 30;
    return {
      kind,
      title,
      dueDate: normalizeDate(source.dueDate),
      dueTime: normalizeTime(source.dueTime),
      owner: String(source.owner || ownerDefault).trim().slice(0, ownerLimit) || ownerDefault,
      priority,
      businessBackground: String(source.businessBackground || "").trim().slice(0, 800),
      confidence
    };
  }

  function coerceDraftSources(value) {
    if (Array.isArray(value)) return value;
    if (!value || typeof value !== "object") return [];
    if (Array.isArray(value.items)) return value.items;
    if (Array.isArray(value.tasks)) return value.tasks;
    if (value.title) return [value];
    return [];
  }

  function parseDraftResponse(text = {}) {
    const source = typeof text === "string" ? extractJsonValue(text) : text;
    const drafts = parseDraftListResponse(source);
    return drafts[0];
  }

  function parseDraftListResponse(text = {}) {
    const source = typeof text === "string" ? extractJsonValue(text) : text;
    if (source == null) throw new Error("AI 未返回可解析的事项 JSON");
    const rawItems = coerceDraftSources(source);
    const drafts = [];
    rawItems.forEach(item => {
      if (drafts.length >= MAX_DRAFTS) return;
      try {
        drafts.push(parseOneDraft(item));
      } catch {}
    });
    if (!drafts.length) throw new Error("截图中未能识别出事项名称");
    return drafts;
  }

  return {
    VALID_PRIORITIES,
    MAX_DRAFTS,
    EXTRACT_SYSTEM_PROMPT,
    normalizeMimeType,
    stripDataUrl,
    buildExtractUserText,
    buildVisionUserParts,
    extractJsonObject,
    extractJsonValue,
    looksLikeMeetingEventTitle,
    normalizeItemKind,
    parseOneDraft,
    parseDraftResponse,
    parseDraftListResponse
  };
});
