(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.ScheduleMeetingDemotePolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  function normalizeTitle(title) {
    return String(title || "").trim().replace(/\s+/g, " ");
  }

  function parentIdOf(task) {
    return task?.parentId || task?.parentTaskId || task?.parentTask || task?.parent || "";
  }

  /**
   * True for the meeting/event itself (time block), not follow-up work about a meeting.
   * "2026年07月集团财务月度会议" → true
   * "7月财务例会会议纪要修改" → false
   */
  function isMeetingEventTitle(title) {
    const t = normalizeTitle(title);
    if (!t) return false;
    if (!/(会议|例会|沟通会|对接会|研讨会|座谈会|讨论会|月会|周会|行政会)/.test(t)) return false;
    if (/(纪要|材料|编写|修改|准备|整理|通知|审核|更新|输出|测算|报告|方案|讲解|拉通|复盘|检查|分析|拟稿|通报)/.test(t)) {
      return false;
    }
    return true;
  }

  function collectTasks(data = {}) {
    const rows = [];
    Object.entries(data || {}).forEach(([dateKey, day]) => {
      (day?.tasks || []).forEach((task, index) => rows.push({ task, dateKey, day, index }));
    });
    return rows;
  }

  function collectEntries(data = {}) {
    const rows = [];
    Object.entries(data || {}).forEach(([dateKey, day]) => {
      (day?.entries || []).forEach(entry => rows.push({ entry, dateKey, day }));
    });
    return rows;
  }

  function demoteEntryToCalendar(entry) {
    if (!entry) return false;
    const hadLink = Boolean(entry.taskId) || entry.entryType === "task_work";
    entry.entryType = "calendar";
    entry.taskId = "";
    return hadLink;
  }

  function removeTaskEverywhere(data, taskId) {
    let removed = 0;
    Object.values(data || {}).forEach(day => {
      const before = (day.tasks || []).length;
      day.tasks = (day.tasks || []).filter(task => task.id !== taskId);
      removed += before - day.tasks.length;
    });
    return removed;
  }

  /**
   * Convert mistaken meeting todos back to calendar-only schedule blocks.
   * Keeps real follow-up work (纪要/材料/…) as leaf tasks, reparented if needed.
   */
  function demoteMeetingEventTasks(data = {}) {
    const next = data;
    let convertedEntries = 0;
    let reparentedChildren = 0;
    let removedTasks = 0;
    const demotedTitles = [];

    const taskRows = collectTasks(next);
    const byId = new Map(taskRows.map(row => [row.task.id, row.task]));
    const meetingTaskIds = new Set(
      taskRows
        .filter(({ task }) => isMeetingEventTitle(task.title))
        .map(({ task }) => task.id)
    );

    // 1) Same-titled task_work on a meeting task (or entry titled as a meeting event) → calendar.
    collectEntries(next).forEach(({ entry }) => {
      const entryTitle = normalizeTitle(entry.title);
      const linked = entry.taskId ? byId.get(entry.taskId) : null;
      const entryIsMeeting = isMeetingEventTitle(entryTitle);
      const linkedIsMeeting = linked && isMeetingEventTitle(linked.title);
      const sameTitleAsMeetingTask = linkedIsMeeting && entryTitle === normalizeTitle(linked.title);
      if (!entryIsMeeting && !sameTitleAsMeetingTask) return;
      if (demoteEntryToCalendar(entry)) convertedEntries += 1;
    });

    // Refresh after entry changes.
    const rows = collectTasks(next);
    const childrenMap = new Map();
    rows.forEach(({ task }) => {
      const pid = parentIdOf(task);
      if (!pid) return;
      if (!childrenMap.has(pid)) childrenMap.set(pid, []);
      childrenMap.get(pid).push(task);
    });

    // 2) Meeting-event tasks: move real children to grandparent, then delete the meeting task.
    [...meetingTaskIds].forEach(meetingId => {
      const meeting = byId.get(meetingId);
      if (!meeting) return;
      const grandparentId = parentIdOf(meeting) || "";
      const children = childrenMap.get(meetingId) || [];
      children.forEach(child => {
        // Drop duplicate leaf that only mirrored the meeting title.
        if (normalizeTitle(child.title) === normalizeTitle(meeting.title) && isMeetingEventTitle(child.title)) {
          // Convert any leftover links then remove.
          collectEntries(next).forEach(({ entry }) => {
            if (entry.taskId === child.id) demoteEntryToCalendar(entry);
          });
          removedTasks += removeTaskEverywhere(next, child.id);
          return;
        }
        if (parentIdOf(child) !== grandparentId) {
          child.parentId = grandparentId;
          reparentedChildren += 1;
        }
      });
      collectEntries(next).forEach(({ entry }) => {
        if (entry.taskId === meetingId) demoteEntryToCalendar(entry);
      });
      removedTasks += removeTaskEverywhere(next, meetingId);
      demotedTitles.push(normalizeTitle(meeting.title));
    });

    // 3) Orphan meeting-titled leaves with no remaining task_work links → remove.
    collectTasks(next).forEach(({ task }) => {
      if (!isMeetingEventTitle(task.title)) return;
      const stillLinked = collectEntries(next).some(({ entry }) => entry.taskId === task.id && entry.entryType === "task_work");
      if (stillLinked) return;
      const hasKids = collectTasks(next).some(({ task: child }) => parentIdOf(child) === task.id);
      if (hasKids) return;
      removedTasks += removeTaskEverywhere(next, task.id);
      if (!demotedTitles.includes(normalizeTitle(task.title))) demotedTitles.push(normalizeTitle(task.title));
    });

    return {
      data: next,
      changed: convertedEntries > 0 || reparentedChildren > 0 || removedTasks > 0,
      report: {
        convertedEntries,
        reparentedChildren,
        removedTasks,
        demotedTitles
      }
    };
  }

  return {
    normalizeTitle,
    isMeetingEventTitle,
    demoteMeetingEventTasks
  };
});
