const assert = require("assert");
const fs = require("fs");

const styles = fs.readFileSync("styles.css", "utf8");
const app = fs.readFileSync("app.js", "utf8");

assert.match(
  styles,
  /body:not\(\.week-mode\):not\(\.month-mode\):not\(\.project-mode\) \.day-button\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s,
  "day-view week strip chips must stack vertically so narrow columns do not crush labels"
);
assert.match(
  styles,
  /body:not\(\.week-mode\):not\(\.month-mode\):not\(\.project-mode\) \.day-name strong,\s*body:not\(\.week-mode\):not\(\.month-mode\):not\(\.project-mode\) \.day-name span\s*\{[^}]*white-space:\s*nowrap/s,
  "day-view weekday and month labels must not wrap character-by-character"
);
const renderWeek = app.slice(app.indexOf("function renderWeek()"), app.indexOf("function taskDatesForView()"));
assert.match(
  renderWeek,
  /\$\{date\.getMonth\(\) \+ 1\}月<\/span>/,
  "day strip secondary label should show month only; the day number is already large"
);
assert.doesNotMatch(
  renderWeek,
  /\$\{date\.getMonth\(\) \+ 1\}月\$\{date\.getDate\(\)\}日/,
  "day strip must not repeat the day number in the secondary label"
);

console.log("week strip layout tests passed");
