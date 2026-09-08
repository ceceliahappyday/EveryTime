const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const styles = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

assert.match(
  styles,
  /\.task-list\.project-view\s+\.task-group-heading\s*\{[^}]*position:\s*static/s,
  "project status headings should scroll with the project list instead of sticking over cards"
);

assert.match(
  styles,
  /\.project-gantt\s*\{[^}]*width:\s*100%[^}]*min-width:\s*0/s,
  "gantt container should stay inside the visible panel instead of expanding to content width"
);
assert.doesNotMatch(
  styles,
  /\.project-gantt\s*\{[^}]*width:\s*max-content/s,
  "gantt should not create an oversized draggable horizontal surface"
);

assert.match(
  styles,
  /\.project-gantt-days\s*\{[^}]*position:\s*sticky/s,
  "gantt date header should stay visible while task rows scroll vertically"
);
assert.match(
  styles,
  /\.project-gantt-chrome\s*\{[^}]*flex:\s*0\s*0\s*auto/s,
  "gantt toolbar and legend should stay fixed above the scrolling chart area"
);
assert.match(
  styles,
  /Do not set scrollbar-width/,
  "desktop scrollbars must avoid native Windows bars that ignore webkit styling"
);
assert.match(
  styles,
  /::-webkit-scrollbar-button[\s\S]*display:\s*none/s,
  "custom scrollbars must hide native arrow buttons"
);
assert.match(
  styles,
  /\.project-gantt-hscroll\s*\{[^}]*flex:\s*0\s*0\s*var\(--scroll-size\)/s,
  "gantt horizontal scrollbar should stay a thin overlay track"
);
assert.match(
  styles,
  /\.timeline-wrap:has\(\.project-gantt\)\s*\{[^}]*overflow-x:\s*hidden/s,
  "project timeline wrapper should not horizontally scroll the toolbar away"
);
assert.match(
  styles,
  /\.project-gantt-split\s*\{[^}]*display:\s*flex/s,
  "gantt should use a fixed label pane beside the scrolling chart"
);
assert.match(
  styles,
  /\.project-gantt-label-pane\s*\{[^}]*flex:\s*0\s*0\s*var\(--gantt-label-width/s,
  "task titles should stay in a fixed left column while dates scroll"
);
assert.match(
  styles,
  /\.project-gantt-title strong\s*\{[^}]*text-overflow:\s*ellipsis/s,
  "gantt titles should truncate inside the fixed label column"
);
assert.match(
  styles,
  /\.gantt-progress-pct\s*\{/s,
  "task progress should render on the gantt bar instead of under the title"
);
assert.match(
  styles,
  /body\.in-desktop\.glass-mode\s+\.app-shell|body\.in-desktop\s+\.app-shell/s,
  "desktop shell should be allowed to use the resized window width"
);
assert.match(
  styles,
  /body\.in-desktop\s+\.topbar\s*\{/s,
  "desktop topbar should use a compact responsive layout inside a resized window"
);
assert.match(
  styles,
  /body\.in-desktop\s+\.topbar-main\s*\{/s,
  "desktop topbar should distribute controls through a main flex region"
);
assert.doesNotMatch(
  html,
  /id="quickAddButton"/,
  "topbar must not duplicate left-panel quick-add with a 新建待办 button"
);
assert.doesNotMatch(
  html,
  /id="glassToggleButton"/,
  "topbar must not duplicate settings glass toggle"
);
assert.match(
  html,
  /id="quickTaskForm"/,
  "left panel quick-add remains the single create-task entry"
);
assert.match(
  html,
  /id="settingGlass"/,
  "glass mode stays available in settings"
);

assert.match(
  styles,
  /body\.in-desktop \.app-shell\s*\{[^}]*margin:\s*0/s,
  "desktop shell should be full-bleed without outer margin"
);
assert.match(
  styles,
  /body\.in-desktop \.app-shell\s*\{[^}]*border:\s*0/s,
  "desktop shell should not show a visible window border"
);
assert.match(
  styles,
  /body\.in-desktop \.app-shell\s*\{[^}]*border-radius:\s*16px/s,
  "desktop shell should keep soft rounded corners"
);
assert.match(
  styles,
  /\.resize-edge-top\s*\{[^}]*right:\s*148px/s,
  "top resize edge must leave room for window controls"
);
assert.match(
  styles,
  /body\.in-desktop \.window-controls\s*\{[^}]*z-index:\s*140/s,
  "window controls must stay above resize hit targets"
);
assert.match(
  styles,
  /body\.in-desktop \.window-controls\s*\{[^}]*background:\s*transparent/s,
  "window controls must not inherit topbar gradients as a dark patch"
);
assert.match(
  styles,
  /\.resize-edge-left/s,
  "left resize edge should allow horizontal window sizing"
);
assert.match(
  styles,
  /\.resize-edge-top/s,
  "top resize edge should allow vertical window sizing"
);
assert.match(
  styles,
  /body\.in-desktop\.glass-mode \.app-shell\s*\{[^}]*rgba\(6,\s*18,\s*32,\s*\.46\)/s,
  "glass mode shell must stay translucent so the desktop shows through"
);
assert.doesNotMatch(
  styles,
  /body\.in-desktop\.glass-mode \.app-shell\s*\{[^}]*backdrop-filter\s*:/s,
  "glass shell must not use backdrop-filter; Electron paints it as opaque black"
);
assert.doesNotMatch(
  styles,
  /body\.in-desktop\.glass-mode \.app-shell\s*\{[^}]*rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*\.(?:7|8|9)/s,
  "glass shell must not fall back to near-opaque black fills"
);
assert.match(
  styles,
  /body\.in-desktop\.glass-mode \.topbar,\s*body\.in-desktop\.glass-mode \.week-strip\s*\{[^}]*rgba\(8,\s*22,\s*36,\s*\.72\)/s,
  "glass chrome should use translucent frosted panels, not opaque black"
);
assert.match(
  styles,
  /body\.in-desktop\.glass-mode \.task-panel[\s\S]*?background:\s*rgba\(6,\s*16,\s*28,\s*\.62\)/s,
  "glass panels need enough opacity to stop desktop content bleeding through"
);
assert.match(
  styles,
  /#datePicker\s*\{[^}]*clip-path:\s*inset\(50%\)/s,
  "native date input must stay fully clipped so it cannot show a broken chrome fragment in the topbar"
);
assert.match(
  styles,
  /body\.in-desktop \.date-controls\s*\{[^}]*overflow:\s*visible/s,
  "desktop date controls must not clip the prev/next buttons in half"
);
assert.doesNotMatch(
  styles,
  /\.app-shell\s*\{[^}]*zoom:/s,
  "app shell should not use css zoom, which breaks resize hit targets"
);
assert.match(
  styles,
  /body\.in-desktop \.header-actions\s*\{[^}]*flex-wrap:\s*nowrap/s,
  "desktop header should stay on one row"
);
assert.match(
  styles,
  /body\.in-desktop\.header-tools-overflow \.header-tools-slot:empty\s*\{[^}]*display:\s*none/s,
  "overflowed tool slot should collapse when tools move into the more menu"
);
assert.match(
  styles,
  /body\.in-desktop \.topbar\s*\{[^}]*grid-template-columns:\s*auto\s+minmax\(0,\s*1fr\)\s+auto\s+max-content\s+max-content/s,
  "desktop topbar must keep view/actions/window on non-shrinking tracks"
);
assert.match(
  styles,
  /body\.in-desktop\s+\.header-actions\s*\{[^}]*overflow:\s*visible/s,
  "desktop header actions must never silently clip trailing chrome"
);
assert.match(
  styles,
  /body\.in-desktop\s+\.header-actions\s*\{[^}]*min-width:\s*max-content/s,
  "desktop header actions must reserve intrinsic width for settings and overflow"
);
assert.match(
  styles,
  /body\.in-desktop\.shell-focus(?:\.shell-(?:narrow|compact-topbar))? \.topbar[\s\S]*?display:\s*flex/s,
  "focus topbar must use flex so date and view never share a squeezed grid track"
);
assert.match(
  styles,
  /body\.in-desktop\.shell-focus(?:\.shell-(?:narrow|compact-topbar))? \.topbar-main[\s\S]*?min-width:\s*max-content/s,
  "focus date cluster must keep intrinsic width including ← date →"
);
assert.match(
  styles,
  /body\.in-desktop\.shell-focus(?:\.shell-(?:narrow|compact-topbar))? \.header-actions[\s\S]*?margin-left:\s*auto/s,
  "focus actions must sit after the date cluster without overlapping it"
);
assert.match(
  styles,
  /body:not\(\.in-desktop\) \.workspace\s*\{[^}]*grid-template-rows:\s*minmax\(190px,\s*38%\)/s,
  "stacked todo/schedule under 760px is web-only; desktop uses shell-* instead"
);
assert.match(
  app,
  /ResizeObserver/,
  "header overflow should resync from ResizeObserver, not only window resize"
);
assert.match(
  app,
  /availableForTools/,
  "overflow sync must budget tools against reserved trailing chrome"
);
assert.match(
  styles,
  /\.schedule-heading\s*\{[^}]*height:\s*auto/s,
  "schedule heading must grow with title and stats instead of a fixed 54px crop"
);
assert.match(
  styles,
  /\.schedule-stats\s*\{[^}]*flex-shrink:\s*0/s,
  "schedule stats must stay visible instead of being crushed off-screen"
);
assert.match(
  app,
  /settingsButton/,
  "overflow sync must reserve the pinned settings button"
);
assert.match(
  app,
  /innerWidth < 1180|forceOverflow/,
  "overflow sync should collapse tools earlier on common desktop widths"
);
assert.match(
  app,
  /rectClipped|getBoundingClientRect/,
  "overflow sync must detect mid-label button clipping via bounding rects"
);
assert.match(
  app,
  /positionHeaderOverflowMenu/,
  "overflow menu must be positioned fixed so app-shell overflow cannot clip it"
);
assert.match(
  styles,
  /button\[hidden\][\s\S]*display:\s*none\s*!important/,
  "hidden attribute must win over soft-button display so overflow control can truly hide"
);
assert.match(
  app,
  /header-tools-overflow/,
  "overflow menu should key off the header-tools-overflow state"
);
assert.match(
  app,
  /syncHeaderOverflow/,
  "adaptive chrome should sync secondary tools into the overflow menu"
);
assert.match(
  styles,
  /body\.in-desktop\.shell-focus \.schedule-panel[\s\S]*display:\s*none\s*!important/s,
  "focus windows must hide the schedule/gantt panel"
);
assert.match(
  styles,
  /body\.in-desktop\.shell-focus \.task-panel\s*\{[^}]*display:\s*flex\s*!important/s,
  "focus windows must keep the todo list visible"
);
assert.match(
  styles,
  /body\.in-desktop:not\(\.shell-focus\) \.workspace\s*\{[^}]*clamp\(200px/s,
  "desktop wider than todo strip must restore split panes instead of stacking"
);
assert.match(
  styles,
  /body\.in-desktop\.shell-focus \.workspace\s*\{[^}]*grid-template-rows:\s*minmax\(0,\s*1fr\)/s,
  "focus layout should fill the full workspace height with a single surface"
);
assert.match(
  styles,
  /body\.in-desktop\.shell-focus \.header-view-switcher[\s\S]*display:\s*none\s*!important/s,
  "narrow focus should hide the full day/week/month/project switcher"
);
assert.match(
  styles,
  /body\.in-desktop\.shell-focus \.date-controls[\s\S]*display:\s*flex\s*!important/s,
  "narrow focus should keep compact date selection for day todos"
);
assert.match(
  styles,
  /body\.in-desktop\.shell-narrow \.brand\s*\{[^}]*display:\s*none\s*!important/s,
  "narrow desktop should drop brand chrome so the topbar stays one clean row"
);
assert.match(
  styles,
  /body:not\(\.shell-focus\) \.focus-view-menu[\s\S]*display:\s*none\s*!important/s,
  "focus view menu must not linger after the window expands out of focus mode"
);
assert.match(
  styles,
  /body\.in-desktop \.week-days\s*\{[^}]*min-width:\s*0/s,
  "desktop week strip must not force a 620px horizontal scroller"
);
assert.match(
  styles,
  /body\.in-desktop\.shell-focus \.focus-view-chrome[\s\S]*display:\s*inline-flex/s,
  "narrow focus should expose a view menu affordance"
);
assert.match(
  styles,
  /body\.in-desktop \.focus-view-chrome\.desktop-only[\s\S]*display:\s*none\s*!important/s,
  "wide desktop must hide the focus-only 视图 button even though it is desktop-only"
);
assert.match(
  app,
  /SHELL_FOCUS_MAX_WIDTH\s*=\s*560/,
  "todo-only focus should end near todo-panel width (~560)"
);
assert.match(
  app,
  /expandWindowForView|VIEW_EXPAND_WIDTHS/,
  "choosing a view in focus mode should expand the window"
);
assert.match(
  app,
  /bindFocusViewMenu/,
  "focus mode needs an explicit view menu binder"
);
assert.match(
  html,
  /id="focusViewButton"/,
  "focus view menu trigger must exist in markup"
);
assert.match(
  styles,
  /\.date-picker-button\s*\{[^}]*height:\s*40px/s,
  "date picker should share the same control height as other topbar buttons"
);
assert.match(
  styles,
  /\.soft-button\s*\{[^}]*height:\s*40px/s,
  "soft buttons should use a fixed topbar control height"
);
assert.match(
  styles,
  /\.header-view-switcher\s*\{[^}]*height:\s*40px/s,
  "view switcher should match the shared topbar control height"
);
assert.match(
  styles,
  /body\.in-desktop\.glass-mode \.date-picker-button(?:\s*,[^,{]*)*\{[^}]*color:\s*#f4fbff/s,
  "glass mode date picker text should stay light on dark frosted controls"
);
assert.match(
  styles,
  /\.date-picker-button\s*\{[^}]*color:\s*var\(--ink\)/s,
  "date picker should use ink color so glass mode can flip to light text"
);
assert.match(
  styles,
  /\.day-button\s*\{[^}]*color:\s*var\(--ink\)/s,
  "week-strip day buttons should use ink color so glass mode can flip to light text"
);
assert.match(
  styles,
  /body\.in-desktop\.glass-mode \.day-button(?:\s*,[^,{]*)*\{[^}]*color:\s*#f4fbff/s,
  "glass mode week-strip day labels must stay light on frosted surfaces"
);
assert.match(
  styles,
  /body\.week-mode \.week-strip/s,
  "week calendar should hide the day-selection strip like month view"
);
assert.match(
  html,
  /id="settingWorkStartHour"/,
  "settings should expose work-hour start control"
);
assert.match(
  app,
  /ScheduleHoursPolicy\.visibleTimelineHours/,
  "day timeline should respect configured work hours"
);

assert.match(
  styles,
  /body\.in-desktop\.glass-mode \.schedule-entry\.amber\s*\{[^}]*--entry-bg:\s*rgba\(/s,
  "glass mode amber schedule cards need a dark translucent background like sage"
);
assert.match(
  styles,
  /body\.in-desktop\.glass-mode \.schedule-entry\.blue\s*\{[^}]*--entry-bg:\s*rgba\(/s,
  "glass mode blue schedule cards need a dark translucent background like sage"
);
assert.match(
  styles,
  /body\.in-desktop\.glass-mode \.schedule-entry\.rose\s*\{[^}]*--entry-bg:\s*rgba\(/s,
  "glass mode rose schedule cards need a dark translucent background like sage"
);
assert.match(
  styles,
  /body\.in-desktop\.glass-mode \.schedule-entry\.violet\s*\{[^}]*--entry-bg:\s*rgba\(/s,
  "glass mode violet schedule cards need a dark translucent background like sage"
);
assert.match(
  styles,
  /#todayButton\s*\{[^}]*white-space:\s*nowrap/s,
  "today button must not wrap into a vertical unclickable stack"
);

console.log("project style policy tests passed");
