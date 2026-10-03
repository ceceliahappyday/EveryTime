const assert = require("assert");
const {
  isBoundsOnAnyDisplay,
  sanitizeWindowBounds,
  relocateBoundsToDisplay
} = require("../window-bounds-policy.js");

const primary = {
  primary: true,
  workArea: { x: 0, y: 0, width: 1536, height: 912 }
};
const upper = {
  primary: false,
  workArea: { x: -615, y: -1152, width: 2752, height: 1104 }
};

assert.strictEqual(
  isBoundsOnAnyDisplay({ x: 1100, y: -1052, width: 928, height: 912 }, [primary, upper]),
  true,
  "saved dual-monitor bounds should still count as on-screen"
);

assert.strictEqual(
  isBoundsOnAnyDisplay({ x: 8000, y: 8000, width: 928, height: 912 }, [primary, upper]),
  false,
  "far-away bounds must be treated as off-screen"
);

const reset = sanitizeWindowBounds(
  { x: 8000, y: -4000, width: 928, height: 912 },
  [primary, upper]
);
assert.strictEqual(reset.reset, true);
assert.ok(reset.x >= primary.workArea.x && reset.x < primary.workArea.x + primary.workArea.width);
assert.ok(reset.y >= primary.workArea.y && reset.y < primary.workArea.y + primary.workArea.height);

const keep = sanitizeWindowBounds(
  { x: 1100, y: -1052, width: 928, height: 912 },
  [primary, upper]
);
assert.strictEqual(keep.reset, false);
assert.strictEqual(keep.x, 1100);
assert.strictEqual(keep.y, -1052);

const firstIsSecondary = sanitizeWindowBounds(
  null,
  [upper, primary],
  { preferredDisplay: primary }
);
assert.strictEqual(firstIsSecondary.reset, true);
assert.ok(firstIsSecondary.y >= 0, "fallback must use preferred/primary display, not displays[0]");

const moved = relocateBoundsToDisplay({ width: 928, height: 912 }, primary);
assert.ok(moved.x >= 0 && moved.y >= 0);
assert.strictEqual(moved.width, 928);
assert.strictEqual(moved.height, 912);

console.log("window-bounds-policy.test.js passed");
