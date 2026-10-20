const assert = require("assert");
const fs = require("fs");

const html = fs.readFileSync("index.html", "utf8");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const files = new Set(pkg.build?.files || []);

const scriptSrcs = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map(match => match[1]);
assert.ok(scriptSrcs.length > 5, "index.html should load policy scripts");
scriptSrcs.forEach(src => {
  assert.ok(files.has(src), `package.json build.files must include ${src} (installed builds omit missing entries)`);
  assert.ok(fs.existsSync(src), `${src} must exist on disk`);
});

assert.ok(
  files.has("schedule-overlap-policy.js"),
  "overlap layout policy must ship in the installer"
);

console.log("packaging files tests passed");
