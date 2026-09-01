const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const files = pkg.build?.files || [];

const scriptSrcs = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map(match => match[1]);
assert.ok(scriptSrcs.length > 0, "index.html should load local scripts");

for (const src of scriptSrcs) {
  assert.ok(
    files.includes(src) || files.some(pattern => pattern.includes(src)),
    `packaged build.files must include ${src} or the installed app will crash on startup`
  );
  assert.ok(fs.existsSync(path.join(root, src)), `${src} must exist on disk`);
}

assert.ok(files.includes("schedule-hours-policy.js"), "work-hour policy must ship in the installer");

console.log("packaging script inventory tests passed");
