"use strict";

function overlapArea(a, b) {
  if (!a || !b) return 0;
  const x = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const y = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return x * y;
}

function isBoundsOnAnyDisplay(bounds, displays, minOverlap = 12000) {
  if (!bounds || !Array.isArray(displays) || !displays.length) return false;
  return displays.some((display) => {
    const area = display.workArea || display.bounds;
    return overlapArea(bounds, area) >= minOverlap;
  });
}

function centerBoundsInWorkArea(workArea, width, height) {
  const nextWidth = Math.min(Math.max(320, width), workArea.width);
  const nextHeight = Math.min(Math.max(240, height), workArea.height);
  return {
    x: Math.round(workArea.x + Math.max(0, (workArea.width - nextWidth) / 2)),
    y: Math.round(workArea.y + Math.max(0, (workArea.height - nextHeight) / 2)),
    width: nextWidth,
    height: nextHeight
  };
}

function sanitizeWindowBounds(saved, displays, options = {}) {
  const minWidth = options.minWidth || 900;
  const minHeight = options.minHeight || 520;
  const defaultWidth = options.defaultWidth || 1380;
  const defaultHeight = options.defaultHeight || 900;
  const width = Math.max(minWidth, Math.round(Number(saved?.width) || defaultWidth));
  const height = Math.max(minHeight, Math.round(Number(saved?.height) || defaultHeight));
  const x = Number.isFinite(saved?.x) ? Math.round(saved.x) : null;
  const y = Number.isFinite(saved?.y) ? Math.round(saved.y) : null;
  const list = Array.isArray(displays) ? displays : [];
  const preferred = options.preferredDisplay
    || list.find((display) => display.primary)
    || list[0];
  const workArea = preferred?.workArea || preferred?.bounds || { x: 0, y: 0, width: 1280, height: 800 };
  const candidate = { x: x ?? workArea.x, y: y ?? workArea.y, width, height };

  if (x == null || y == null || !isBoundsOnAnyDisplay(candidate, list)) {
    return {
      ...centerBoundsInWorkArea(workArea, width, height),
      reset: true
    };
  }

  return { x, y, width, height, reset: false };
}

function relocateBoundsToDisplay(bounds, display) {
  const workArea = display?.workArea || display?.bounds || { x: 0, y: 0, width: 1280, height: 800 };
  const width = Math.max(320, Math.round(Number(bounds?.width) || 1380));
  const height = Math.max(240, Math.round(Number(bounds?.height) || 900));
  return centerBoundsInWorkArea(workArea, width, height);
}

module.exports = {
  overlapArea,
  isBoundsOnAnyDisplay,
  sanitizeWindowBounds,
  relocateBoundsToDisplay,
  centerBoundsInWorkArea
};
