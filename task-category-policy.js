(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.TaskCategoryPolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  /**
   * 分类 = 平行标签（Outlook / OneNote）。一项一名一色；颜色可选 Excel 式色板（hex）。
   */
  const STORAGE_KEY = "today-planner-task-categories-v1";
  const DEFAULT_CATEGORY = "work";

  /** 旧版具名色 → hex（兼容已有数据） */
  const LEGACY_COLOR_MAP = {
    sage: "#638576",
    blue: "#5D7F9E",
    amber: "#AA7B39",
    rose: "#A46568",
    violet: "#756B9D"
  };
  const COLOR_IDS = Object.keys(LEGACY_COLOR_MAP);
  const DEFAULT_COLOR = LEGACY_COLOR_MAP.sage;

  /**
   * Excel「主题颜色」风格：10 列 × 6 行（浅→深）
   * 参考 Office 主题色板布局，便于点选。
   */
  const THEME_PALETTE = [
    ["#FFFFFF", "#000000", "#E7E6E6", "#44546A", "#5B9BD5", "#ED7D31", "#A5A5A5", "#FFC000", "#4472C4", "#70AD47"],
    ["#F2F2F2", "#7F7F7F", "#D0CECE", "#D6DCE4", "#DDEBF7", "#FCE4D6", "#EDEDED", "#FFF2CC", "#D6DCE4", "#E2EFDA"],
    ["#D9D9D9", "#595959", "#AEAAAA", "#ACB9CA", "#BDD7EE", "#F8CBAD", "#DBDBDB", "#FFE699", "#B4C6E7", "#C6E0B4"],
    ["#BFBFBF", "#3F3F3F", "#757070", "#8496B0", "#9BC2E6", "#F4B183", "#C9C9C9", "#FFD966", "#8FAADC", "#A9D08E"],
    ["#A6A6A6", "#262626", "#3A3838", "#323F4F", "#2E75B6", "#C45911", "#7B7B7B", "#BF8F00", "#2F5496", "#548235"],
    ["#7F7F7F", "#0D0D0D", "#171616", "#222A35", "#1F4E79", "#833C0C", "#525252", "#806000", "#1F3864", "#375623"]
  ];

  /** Excel「标准颜色」一行 */
  const STANDARD_PALETTE = [
    "#C00000", "#FF0000", "#FFC000", "#FFFF00", "#92D050",
    "#00B050", "#00B0F0", "#0070C0", "#002060", "#7030A0"
  ];

  /** 应用内默认分类色也放进色板，保证能点回 */
  const APP_DEFAULT_PALETTE = Object.values(LEGACY_COLOR_MAP);

  const COLOR_PALETTE = [
    ...THEME_PALETTE.flat(),
    ...STANDARD_PALETTE,
    ...APP_DEFAULT_PALETTE
  ].filter((hex, index, list) => list.findIndex(item => item.toUpperCase() === hex.toUpperCase()) === index);

  const BUILTIN = [
    { id: "work", label: "工作", description: "", color: LEGACY_COLOR_MAP.sage, builtin: true },
    { id: "meeting", label: "会议", description: "", color: LEGACY_COLOR_MAP.amber, builtin: true },
    { id: "study", label: "学习", description: "", color: LEGACY_COLOR_MAP.blue, builtin: true },
    { id: "life", label: "生活", description: "", color: LEGACY_COLOR_MAP.rose, builtin: true },
    { id: "other", label: "其他", description: "", color: LEGACY_COLOR_MAP.violet, builtin: true }
  ];

  let memoryCatalog = null;

  function cloneCategory(item) {
    return {
      id: item.id,
      label: item.label,
      description: item.description || "",
      color: normalizeColor(item.color),
      builtin: Boolean(item.builtin)
    };
  }

  function defaultCatalog() {
    return BUILTIN.map(cloneCategory);
  }

  function expandShortHex(hex) {
    const h = hex.slice(1);
    if (h.length !== 3) return hex.toUpperCase();
    return `#${h.split("").map(ch => ch + ch).join("")}`.toUpperCase();
  }

  function normalizeColor(color) {
    if (color == null || color === "") return DEFAULT_COLOR;
    const raw = String(color).trim();
    if (LEGACY_COLOR_MAP[raw]) return LEGACY_COLOR_MAP[raw];
    if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw.toUpperCase();
    if (/^#[0-9a-fA-F]{3}$/.test(raw)) return expandShortHex(raw);
    return DEFAULT_COLOR;
  }

  function hexToRgb(hex) {
    const value = normalizeColor(hex).slice(1);
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16)
    };
  }

  function rgbToHex(r, g, b) {
    return `#${[r, g, b].map(n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
  }

  /** 日程块浅底：约 18% 色 + 82% 白 */
  function softBackground(hex) {
    const { r, g, b } = hexToRgb(hex);
    const mix = channel => channel * 0.18 + 255 * 0.82;
    return rgbToHex(mix(r), mix(g), mix(b));
  }

  function glassBackground(hex) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r},${g},${b},0.46)`;
  }

  function colorTokens(color, { glass = false } = {}) {
    const entry = normalizeColor(color);
    return {
      entry,
      entryBg: glass ? glassBackground(entry) : softBackground(entry)
    };
  }

  function legacyColorId(color) {
    const hex = normalizeColor(color);
    return COLOR_IDS.find(id => LEGACY_COLOR_MAP[id] === hex) || "";
  }

  function slugId(label) {
    const base = String(label || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\u4e00-\u9fff_-]/g, "")
      .slice(0, 24);
    return base || `tag-${Date.now().toString(36)}`;
  }

  function normalizeCategoryRecord(raw, fallbackId = "") {
    if (!raw || typeof raw !== "object") return null;
    const builtinMeta = BUILTIN.find(item => item.id === raw.id);
    const id = String(raw.id || fallbackId || "").trim();
    if (!id) return null;
    const label = String(raw.label || builtinMeta?.label || id).trim().slice(0, 24) || id;
    return {
      id,
      label,
      description: String(raw.description ?? builtinMeta?.description ?? "").trim().slice(0, 80),
      color: normalizeColor(raw.color || builtinMeta?.color || DEFAULT_COLOR),
      builtin: Boolean(builtinMeta || raw.builtin)
    };
  }

  function normalizeCatalog(list) {
    const byId = new Map();
    (Array.isArray(list) ? list : []).forEach(item => {
      const normalized = normalizeCategoryRecord(item);
      if (!normalized || byId.has(normalized.id)) return;
      byId.set(normalized.id, normalized);
    });
    const ordered = [];
    BUILTIN.forEach(item => {
      ordered.push(byId.get(item.id) || cloneCategory(item));
      byId.delete(item.id);
    });
    [...byId.values()]
      .sort((a, b) => a.label.localeCompare(b.label, "zh-CN"))
      .forEach(item => ordered.push({ ...item, builtin: false }));
    return ordered;
  }

  function getStorage() {
    try {
      return typeof localStorage !== "undefined" ? localStorage : null;
    } catch {
      return null;
    }
  }

  function loadCatalog(storage = getStorage()) {
    if (!memoryCatalog) {
      let parsed = null;
      try {
        parsed = JSON.parse(storage?.getItem?.(STORAGE_KEY) || "null");
      } catch {
        parsed = null;
      }
      memoryCatalog = normalizeCatalog(parsed?.categories || parsed);
    }
    return memoryCatalog.map(cloneCategory);
  }

  function saveCatalog(categories, storage = getStorage()) {
    memoryCatalog = normalizeCatalog(categories);
    try {
      storage?.setItem?.(STORAGE_KEY, JSON.stringify({ categories: memoryCatalog }));
    } catch {}
    return memoryCatalog.map(cloneCategory);
  }

  function resetCatalog(storage = getStorage()) {
    memoryCatalog = defaultCatalog();
    return saveCatalog(memoryCatalog, storage);
  }

  function listCategories() {
    return loadCatalog();
  }

  function findCategory(id) {
    return listCategories().find(item => item.id === id) || null;
  }

  function normalizeCategory(id, { meeting = false } = {}) {
    if (meeting) return "meeting";
    if (findCategory(id)) return id;
    return DEFAULT_CATEGORY;
  }

  function colorForCategory(id) {
    return normalizeColor(findCategory(normalizeCategory(id))?.color || DEFAULT_COLOR);
  }

  function labelForCategory(id) {
    return findCategory(normalizeCategory(id))?.label || "工作";
  }

  function descriptionForCategory(id) {
    return findCategory(normalizeCategory(id))?.description || "";
  }

  function resolveTaskCategory(task = {}) {
    if (task?.category && findCategory(task.category)) return task.category;
    const hex = normalizeColor(task?.color);
    const byColor = listCategories().find(item => normalizeColor(item.color) === hex);
    if (byColor) return byColor.id;
    return DEFAULT_CATEGORY;
  }

  function resolveTaskColor(task = {}) {
    return colorForCategory(resolveTaskCategory(task));
  }

  function resolveEntryColor(entry = {}, task = null) {
    if (task) return resolveTaskColor(task);
    if (entry?.type === "calendar" || entry?.kind === "meeting" || entry?.entryType === "calendar") {
      return colorForCategory("meeting");
    }
    if (entry?.category && findCategory(entry.category)) return colorForCategory(entry.category);
    return normalizeColor(entry?.color || DEFAULT_COLOR);
  }

  function categoryOptionsHtml(selected = DEFAULT_CATEGORY, { includeMeeting = true } = {}) {
    const current = normalizeCategory(selected);
    return listCategories()
      .filter(item => includeMeeting || item.id !== "meeting")
      .map(item => {
        const title = item.description ? ` title="${escapeAttr(item.description)}"` : "";
        return `<option value="${escapeAttr(item.id)}"${item.id === current ? " selected" : ""}${title}>${escapeText(item.label)}</option>`;
      })
      .join("");
  }

  function escapeAttr(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  function escapeText(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;");
  }

  function upsertCategory(input = {}) {
    const list = loadCatalog();
    let id = String(input.id || "").trim();
    const isNew = !id || !list.some(item => item.id === id);
    if (isNew) {
      id = slugId(input.label || input.id);
      let unique = id;
      let n = 2;
      while (list.some(item => item.id === unique) || BUILTIN.some(item => item.id === unique)) {
        unique = `${id}-${n++}`;
      }
      id = unique;
    }
    const existing = list.find(item => item.id === id);
    const next = normalizeCategoryRecord({
      id,
      label: input.label ?? existing?.label,
      description: input.description ?? existing?.description,
      color: input.color ?? existing?.color,
      builtin: existing?.builtin || BUILTIN.some(item => item.id === id)
    });
    if (!next) return loadCatalog();
    if (existing) Object.assign(existing, next);
    else list.push(next);
    return saveCatalog(list);
  }

  function removeCategory(id) {
    const target = findCategory(id);
    if (!target || target.builtin) return loadCatalog();
    return saveCatalog(loadCatalog().filter(item => item.id !== id));
  }

  function createCategory({ label = "新分类", description = "", color = DEFAULT_COLOR } = {}) {
    return upsertCategory({ label, description, color });
  }

  return {
    STORAGE_KEY,
    CATEGORIES: BUILTIN,
    COLOR_IDS,
    COLOR_PALETTE,
    THEME_PALETTE,
    STANDARD_PALETTE,
    LEGACY_COLOR_MAP,
    DEFAULT_CATEGORY,
    DEFAULT_COLOR,
    defaultCatalog,
    loadCatalog,
    saveCatalog,
    resetCatalog,
    listCategories,
    findCategory,
    normalizeCategory,
    normalizeColor,
    softBackground,
    glassBackground,
    colorTokens,
    legacyColorId,
    colorForCategory,
    labelForCategory,
    descriptionForCategory,
    resolveTaskCategory,
    resolveTaskColor,
    resolveEntryColor,
    categoryOptionsHtml,
    upsertCategory,
    removeCategory,
    createCategory
  };
});
