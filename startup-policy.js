(function (root) {
  const canonicalName = "EveryTime";
  const aliases = [canonicalName, "\u4eca\u65e5\u65e5\u7a0b", "today-daily-planner", "Today Daily Planner"];
  const executableNames = ["\u4eca\u65e5\u65e5\u7a0b.exe", "EveryTime.exe", "today-daily-planner.exe"];
  const installMarkers = ["everytime", "today-daily-planner", "\u4eca\u65e5\u65e5\u7a0bapp", "\u4eca\u65e5\u65e5\u7a0b"];

  function executableName(command) {
    const text = String(command || "").trim();
    const quoted = text.match(/^\"([^\"]+\.exe)\"/i);
    const plain = text.match(/^([^\s]+\.exe)/i);
    const path = quoted?.[1] || plain?.[1] || "";
    return path.split(/[\\/]/).pop().toLowerCase();
  }

  function isOwnedCommand(command, currentExe = "") {
    const text = String(command || "").trim();
    const name = executableName(command);
    if (!executableNames.map(item => item.toLowerCase()).includes(name)) return false;
    const currentPath = String(currentExe || "").replaceAll("/", "\\").toLowerCase();
    const quoted = text.match(/^\"([^\"]+\.exe)\"/i);
    const plain = text.match(/^([^\s]+\.exe)/i);
    const commandPath = (quoted?.[1] || plain?.[1] || "").replaceAll("/", "\\").toLowerCase();
    if (!commandPath) return false;
    if (currentPath && commandPath === currentPath) return true;
    const directory = commandPath.slice(0, Math.max(0, commandPath.lastIndexOf("\\")));
    return installMarkers.some(marker => directory.includes(marker));
  }

  function cleanupPlan(entries = [], currentExe = "") {
    const allowed = new Set(aliases.map(item => item.toLowerCase()));
    return entries.filter(entry => allowed.has(String(entry.name || "").toLowerCase()) && isOwnedCommand(entry.command, currentExe));
  }

  root.StartupPolicy = { canonicalName, aliases, executableNames, installMarkers, executableName, isOwnedCommand, cleanupPlan };
  if (typeof module !== "undefined" && module.exports) module.exports = root.StartupPolicy;
})(typeof window === "undefined" ? globalThis : window);
