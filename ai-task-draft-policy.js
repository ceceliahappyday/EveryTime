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
  const MAX_DRAFTS = 24;

  const EXTRACT_SYSTEM_PROMPT = [
    "你是 EveryTime 的截图事项提取助手。先判断截图属于哪一类，再决定输出几条。",
    "场景规则（按优先级匹配）：",
    "1) 会议排期表/安排表（表格：场次、会议日期、开始/结束时间、周几列或汇报主题、地点、参会人等）：",
    "   每一行有效会议（含无场次号但有日期与时间的行）输出 1 条 kind=meeting；合并单元格的日期沿用上一行；",
    "   title 取该行有文字的主题/汇报内容（可能在「周一…周日」某一列）；dueDate 用会议日期（无年份时用用户提供的今天推断年份）；",
    "   dueTime/endTime 分别用「开始时间」「结束时间」列（可含秒，如 14:00:00）；地点、参会人摘要写入 businessBackground；按表格顺序输出，最多 24 条。",
    "2) 单封会议邀请/日程卡片/Outlook 详情：只输出 1 条 meeting；标题用会议名称。",
    "   会议时间：必填 dueTime 与 endTime，须与邀请「时间/会议时间」整段一致（如 9:00-11:30）；优先读顶部时间行，不要只看日视图色块或议程第一段。",
    "   businessBackground 须包含「时间/会议时间」行；若正文有多段议程时间，endTime 仍取整场结束（如 11:30）。",
    "3) 单个任务说明/长文备注：只输出 1 条 task。",
    "4) 聊天或清单里多件独立待办：每条 1 个 task。",
    "5) 拿不准且不是排期表时默认 1 条，勿把同一会议邀请拆成多条。",
    "不要把会议正文的每一行、邮件签名、系统栏、无动作的说明文字拆成待办。",
    "每条必须判断类型 kind：",
    '  meeting = 需要出席/参加的会议或日程本身；',
    "  task = 需要执行的待办工作。",
    "若同一张图里既有一场会议安排、又有明确的会后独立待办，可拆成 meeting + task；否则保持单条。",
    "最多输出 24 条（排期表尽量多行）；只根据截图与说明中可见的信息填写；看不到的不要编造。",
    "只输出一个 JSON 对象，不要 Markdown、不要代码围栏、不要解释文字。",
    '格式：{"items":[...]}；兼容 {"tasks":[...]}；若只有一条也可直接输出单个对象。',
    "每条字段：",
    '  kind: \"task\" | \"meeting\"，必填；',
    '  title: string，必填，不超过 80 字；会议用会议名称，待办写成可执行名称；',
    "  dueDate: string，YYYY-MM-DD 或空字符串（会议为开会日期，待办为目标日期）；",
    "  dueTime: string，HH:MM 24 小时制或空字符串（会议为开始时间）；",
    "  endTime: string，HH:MM 或空字符串（仅 meeting：结束时间；与 dueTime 成对填写）；",
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
      "先判断是「会议排期表」还是「单封邀请/任务/清单」。排期表按行输出多条 meeting（最多 24）；单封邀请只 1 条 meeting。会议请填 dueDate、dueTime、endTime。只返回 JSON：{\"items\":[...]}。"
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

  function normalizeDate(value = "", referenceDateKey = "") {
    const text = String(value || "").trim();
    if (!text) return "";
    const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
    const slash = text.match(/^(\d{4})[/.](\d{1,2})[/.](\d{1,2})/);
    if (slash) {
      return `${slash[1]}-${String(Number(slash[2])).padStart(2, "0")}-${String(Number(slash[3])).padStart(2, "0")}`;
    }
    const cn = text.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/)
      || text.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
    if (cn) {
      const year = cn[1] && cn[1].length === 4
        ? Number(cn[1])
        : Number(String(referenceDateKey || "").slice(0, 4)) || new Date().getFullYear();
      const month = Number(cn[cn.length === 4 ? 2 : 1]);
      const day = Number(cn[cn.length === 4 ? 3 : 2]);
      if (Number.isFinite(year) && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      }
    }
    return "";
  }

  function normalizeTimeText(value = "") {
    return String(value || "")
      .replace(/：/g, ":")
      .replace(/[\u2013\u2014\u2212–—]/g, "-");
  }

  function normalizeTime(value = "") {
    const text = normalizeTimeText(String(value || "").trim());
    if (!text) return "";
    const rangeOnly = text.match(/(\d{1,2}:\d{2})\s*[-~至到]\s*(\d{1,2}:\d{2})/);
    if (rangeOnly && text === rangeOnly[0]) {
      return normalizeTime(rangeOnly[1]);
    }
    const match = text.match(/^(\d{1,2}):(\d{1,2})/);
    if (!match) return "";
    const hour = Math.max(0, Math.min(23, Number(match[1])));
    const minute = Math.max(0, Math.min(59, Number(match[2])));
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  function findAllTimeRangesInText(...parts) {
    const raw = normalizeTimeText(parts.map(part => String(part || "")).join("\n"));
    if (!raw.trim()) return [];
    const re = /(\d{1,2}:\d{2})\s*[-~至到]\s*(\d{1,2}:\d{2})/g;
    const ranges = [];
    let match;
    while ((match = re.exec(raw)) !== null) {
      const start = normalizeTime(match[1]);
      const end = normalizeTime(match[2]);
      const startH = timeStringToScheduleHours(start);
      const endH = timeStringToScheduleHours(end);
      if (startH != null && endH != null && endH > startH) {
        ranges.push({ start, end, startH, endH, duration: endH - startH });
      }
    }
    return ranges;
  }

  function pickBestMeetingRange(ranges = [], preferStartTime = "") {
    if (!ranges.length) return null;
    const preferH = timeStringToScheduleHours(preferStartTime);
    const longRanges = ranges.filter(item => item.duration >= 1.25);
    if (longRanges.length) {
      longRanges.sort((a, b) => b.duration - a.duration);
      return { start: longRanges[0].start, end: longRanges[0].end };
    }
    if (ranges.length >= 2) {
      let minH = Infinity;
      let maxH = -Infinity;
      let minStart = "";
      let maxEnd = "";
      ranges.forEach(item => {
        if (item.startH < minH) {
          minH = item.startH;
          minStart = item.start;
        }
        if (item.endH > maxH) {
          maxH = item.endH;
          maxEnd = item.end;
        }
      });
      if (maxH - minH >= 1) {
        return { start: minStart, end: maxEnd };
      }
    }
    if (preferH != null) {
      const sameStart = ranges.filter(item => Math.abs(item.startH - preferH) < 0.03);
      if (sameStart.length) {
        sameStart.sort((a, b) => b.duration - a.duration);
        return { start: sameStart[0].start, end: sameStart[0].end };
      }
    }
    ranges.sort((a, b) => b.duration - a.duration);
    return { start: ranges[0].start, end: ranges[0].end };
  }

  function findTimeRangeInText(...parts) {
    const ranges = findAllTimeRangesInText(...parts);
    const last = parts[parts.length - 1];
    const preferStartTime = typeof last === "string" ? "" : "";
    return pickBestMeetingRange(ranges, preferStartTime);
  }

  function timeStringToScheduleHours(value = "") {
    const text = normalizeTime(value);
    if (!text) return null;
    const [hour, minute] = text.split(":").map(Number);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
    return hour + minute / 60;
  }

  function resolveMeetingScheduleRange(draft = {}, { defaultDurationHours = 1, maxEndHour = 22 } = {}) {
    const dueTime = normalizeTime(draft.dueTime);
    const endTime = normalizeTime(draft.endTime || draft.end_time || draft.meetingEndTime);
    const startFromDue = timeStringToScheduleHours(dueTime);
    const endFromField = timeStringToScheduleHours(endTime);
    if (startFromDue != null && endFromField != null && endFromField > startFromDue) {
      return {
        start: startFromDue,
        end: Math.min(maxEndHour, endFromField),
        dueTime,
        endTime
      };
    }
    const scanParts = [
      draft.businessBackground,
      draft.title,
      draft.dueTime,
      draft.endTime,
      draft.extraScanText
    ];
    const ranges = findAllTimeRangesInText(...scanParts);
    const range = pickBestMeetingRange(ranges, dueTime);
    if (range) {
      const rangeStart = timeStringToScheduleHours(range.start);
      const rangeEnd = timeStringToScheduleHours(range.end);
      if (rangeStart != null && rangeEnd != null && rangeEnd > rangeStart) {
        return {
          start: rangeStart,
          end: Math.min(maxEndHour, rangeEnd),
          dueTime: range.start,
          endTime: range.end
        };
      }
    }
    let start = startFromDue;
    if (start == null) start = 9;
    let end = endFromField;
    if (end == null || end <= start) {
      end = Math.min(maxEndHour, start + defaultDurationHours);
    } else {
      end = Math.min(maxEndHour, end);
    }
    return {
      start,
      end,
      dueTime: dueTime || "",
      endTime: endTime || ""
    };
  }

  function enrichMeetingDraftTimes(draft = {}, rawExtractText = "") {
    if (draft.kind !== "meeting") return draft;
    const range = resolveMeetingScheduleRange({
      ...draft,
      extraScanText: String(rawExtractText || "").slice(0, 4000)
    });
    draft.dueTime = range.dueTime || draft.dueTime;
    draft.endTime = range.endTime || draft.endTime;
    return draft;
  }

  function resolveDraftTitle(source = {}) {
    if (!source || typeof source !== "object") return "";
    const candidates = [
      source.title,
      source.name,
      source.subject,
      source.taskTitle,
      source.itemTitle,
      source.meetingTitle,
      source.task_name,
      source.item_name,
      source.summary,
      source.label,
      source.标题,
      source.名称,
      source.事项名称,
      source.会议名称
    ];
    for (const candidate of candidates) {
      const text = String(candidate || "").trim();
      if (text) return text.slice(0, 80);
    }
    return "";
  }

  function parseOneDraft(source = {}, options = {}) {
    if (!source || typeof source !== "object" || Array.isArray(source)) {
      throw new Error("AI 未返回可解析的事项 JSON");
    }
    const referenceDateKey = String(options.referenceDateKey || "").trim();
    const title = resolveDraftTitle(source);
    if (!title) throw new Error("截图中未能识别出事项名称");
    const kind = normalizeItemKind(source, title);
    const priorityRaw = String(source.priority || "general_daily").trim();
    const priority = VALID_PRIORITIES.has(priorityRaw) ? priorityRaw : "general_daily";
    let confidence = Number(source.confidence);
    if (!Number.isFinite(confidence)) confidence = 0.6;
    confidence = Math.max(0, Math.min(1, confidence));
    const ownerDefault = kind === "meeting" ? "" : "我";
    const ownerLimit = kind === "meeting" ? 80 : 30;
    const draft = {
      kind,
      title,
      dueDate: normalizeDate(source.dueDate || source.date || source.meetingDate, referenceDateKey),
      dueTime: normalizeTime(source.dueTime),
      endTime: normalizeTime(source.endTime || source.end_time || source.meetingEndTime),
      owner: String(source.owner || ownerDefault).trim().slice(0, ownerLimit) || ownerDefault,
      priority,
      businessBackground: String(source.businessBackground || "").trim().slice(0, 800),
      confidence
    };
    if (kind === "meeting") {
      enrichMeetingDraftTimes(draft, "");
    }
    return draft;
  }

  function coerceDraftSources(value) {
    if (Array.isArray(value)) return value;
    if (!value || typeof value !== "object") return [];
    if (Array.isArray(value.items)) return value.items;
    if (Array.isArray(value.tasks)) return value.tasks;
    if (Array.isArray(value.meetings)) return value.meetings;
    if (Array.isArray(value.data)) return value.data;
    if (Array.isArray(value.results)) return value.results;
    if (value.item && typeof value.item === "object") return [value.item];
    if (value.task && typeof value.task === "object") return [value.task];
    if (value.meeting && typeof value.meeting === "object") return [value.meeting];
    if (resolveDraftTitle(value)) return [value];
    return [];
  }

  function fallbackDraftFromPlainText(text = "") {
    const raw = String(text || "").trim();
    if (!raw) return null;
    const parsed = extractJsonValue(raw);
    if (parsed && typeof parsed === "object") return null;
    const lines = raw
      .replace(/```[\s\S]*?```/g, "\n")
      .split(/\n/)
      .map(line => line.trim())
      .filter(line => line && !/^[\[{]/.test(line) && !/^json$/i.test(line));
    const candidate = lines.find(line => line.length >= 2 && line.length <= 80)
      || lines.find(line => line.length >= 2 && line.length <= 120);
    if (!candidate) return null;
    const title = candidate
      .replace(/^[-*•\d.)、\s]+/, "")
      .replace(/^(title|名称|标题)\s*[:：]\s*/i, "")
      .trim()
      .slice(0, 80);
    if (!title || title.length < 2) return null;
    return parseOneDraft({ title, confidence: 0.35, businessBackground: raw.slice(0, 800) });
  }

  function parseDraftResponse(text = {}, options = {}) {
    const drafts = parseDraftListResponse(text, options);
    return drafts[0];
  }

  function parseDraftListResponse(text = {}, options = {}) {
    const rawText = typeof text === "string" ? text : "";
    const source = typeof text === "string" ? extractJsonValue(text) : text;
    if (source == null) {
      const plain = fallbackDraftFromPlainText(rawText);
      if (plain) return [plain];
      throw new Error("AI 未返回可解析的事项 JSON");
    }
    const rawItems = coerceDraftSources(source);
    const drafts = [];
    rawItems.forEach(item => {
      if (drafts.length >= MAX_DRAFTS) return;
      try {
        drafts.push(enrichMeetingDraftTimes(parseOneDraft(item, options), rawText));
      } catch {}
    });
    if (!drafts.length) {
      const plain = fallbackDraftFromPlainText(rawText);
      if (plain) return [plain];
      throw new Error("截图中未能识别出事项名称");
    }
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
    resolveDraftTitle,
    fallbackDraftFromPlainText,
    normalizeItemKind,
    parseOneDraft,
    parseDraftResponse,
    parseDraftListResponse,
    findTimeRangeInText,
    findAllTimeRangesInText,
    pickBestMeetingRange,
    timeStringToScheduleHours,
    resolveMeetingScheduleRange,
    enrichMeetingDraftTimes
  };
});
