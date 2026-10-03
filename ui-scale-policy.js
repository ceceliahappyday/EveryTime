(function (root) {
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function uiScaleForWindow({ width, height, compact = false } = {}) {
    const w = Number(width) || 1180;
    const h = Number(height) || 760;
    const refWidth = 1180;
    const refHeight = 760;
    const ratio = Math.min(w / refWidth, h / refHeight);
    const base = clamp(ratio, 0.9, 1.24);
    if (!compact) return base;
    return clamp(base * 0.94, 0.88, 1.18);
  }

  const api = { clamp, uiScaleForWindow };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.UiScalePolicy = api;
})(typeof window !== "undefined" ? window : globalThis);
