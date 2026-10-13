(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.RichNotePolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  const MAX_TEXT_CHARS = 4000;
  const MAX_IMAGES = 8;
  const MAX_HTML_CHARS = 2.8 * 1024 * 1024;
  const ALLOWED_TAGS = new Set(["BR", "DIV", "P", "SPAN", "IMG"]);
  const DATA_IMAGE_RE = /^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i;

  function containsMarkup(value) {
    return /<[a-z][\s\S]*>/i.test(String(value || ""));
  }

  function hasInlineImages(value) {
    return /<img\b/i.test(String(value || "")) && /data:image\//i.test(String(value || ""));
  }

  function decodeBasicEntities(value) {
    return String(value || "")
      .replace(/&nbsp;/gi, " ")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, "\"")
      .replace(/&#39;/gi, "'")
      .replace(/&amp;/gi, "&");
  }

  function plainTextFromNote(value) {
    const raw = String(value || "");
    if (!raw) return "";
    if (!containsMarkup(raw)) return raw.trim();
    return decodeBasicEntities(
      raw
        .replace(/<script\b[\s\S]*?<\/script>/gi, "")
        .replace(/<style\b[\s\S]*?<\/style>/gi, "")
        .replace(/<img\b[^>]*>/gi, "")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/\s*(p|div)\s*>/gi, "\n")
        .replace(/<[^>]+>/g, "")
    )
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function countImages(value) {
    const matches = String(value || "").match(/<img\b/gi);
    return matches ? matches.length : 0;
  }

  function isAllowedDataImageSrc(src) {
    const value = String(src || "").replace(/\s+/g, "");
    return DATA_IMAGE_RE.test(value) && value.length <= 2.2 * 1024 * 1024;
  }

  function serializeAllowed(node, out) {
    if (!node) return;
    if (node.nodeType === 3) {
      out.push(node.nodeValue || "");
      return;
    }
    if (node.nodeType !== 1) return;
    const tag = String(node.tagName || "").toUpperCase();
    if (tag === "SCRIPT" || tag === "STYLE") return;
    if (!ALLOWED_TAGS.has(tag)) {
      Array.from(node.childNodes || []).forEach(child => serializeAllowed(child, out));
      return;
    }
    if (tag === "BR") {
      out.push("<br>");
      return;
    }
    if (tag === "IMG") {
      const src = node.getAttribute("src") || "";
      if (!isAllowedDataImageSrc(src)) return;
      const alt = String(node.getAttribute("alt") || "").slice(0, 80);
      out.push(`<img src="${src.replace(/\s+/g, "")}" alt="${alt.replace(/"/g, "")}">`);
      return;
    }
    out.push(`<${tag.toLowerCase()}>`);
    Array.from(node.childNodes || []).forEach(child => serializeAllowed(child, out));
    out.push(`</${tag.toLowerCase()}>`);
  }

  function sanitizeNoteHtml(html, doc = null) {
    const raw = String(html || "");
    if (!raw.trim()) return "";
    const documentRef = doc || (typeof document !== "undefined" ? document : null);
    if (!documentRef?.createElement) {
      // Node / non-DOM fallback: keep plain text only.
      return plainTextFromNote(raw).slice(0, MAX_TEXT_CHARS);
    }
    const template = documentRef.createElement("template");
    template.innerHTML = raw;
    const parts = [];
    Array.from(template.content.childNodes).forEach(child => serializeAllowed(child, parts));
    return parts.join("").replace(/(?:<br>\s*)+$/i, "").trim();
  }

  function isEffectivelyEmpty(value) {
    if (!String(value || "").trim()) return true;
    if (hasInlineImages(value)) return false;
    return !plainTextFromNote(value);
  }

  function normalizeNoteForStorage(html, doc = null) {
    let sanitized = sanitizeNoteHtml(html, doc);
    if (isEffectivelyEmpty(sanitized)) return "";
    const text = plainTextFromNote(sanitized);
    if (text.length > MAX_TEXT_CHARS) {
      // Prefer keeping images; truncate only when text alone overflows.
      if (!hasInlineImages(sanitized)) {
        sanitized = text.slice(0, MAX_TEXT_CHARS);
      }
    }
    if (countImages(sanitized) > MAX_IMAGES) {
      let kept = 0;
      sanitized = sanitized.replace(/<img\b[^>]*>/gi, match => {
        kept += 1;
        return kept <= MAX_IMAGES ? match : "";
      });
    }
    if (sanitized.length > MAX_HTML_CHARS) {
      throw new Error("完成情况说明过大，请减少图片数量或尺寸后再保存");
    }
    return sanitized;
  }

  return {
    MAX_TEXT_CHARS,
    MAX_IMAGES,
    MAX_HTML_CHARS,
    containsMarkup,
    hasInlineImages,
    plainTextFromNote,
    countImages,
    isAllowedDataImageSrc,
    sanitizeNoteHtml,
    isEffectivelyEmpty,
    normalizeNoteForStorage
  };
});
