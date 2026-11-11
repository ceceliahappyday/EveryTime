(function (root) {
  const canonicalName = "DailyPlanner";
  const aliases = [
    canonicalName,
    "EveryTime",
    "\u4eca\u65e5\u65e5\u7a0b",
    "today-daily-planner",
    "Today Daily Planner",
    "Daily Planner"
  ];
  const executableNames = [
    "\u4eca\u65e5\u65e5\u7a0b.exe",
    "DailyPlanner.exe",
    "EveryTime.exe",
    "today-daily-planner.exe"
  ];
  const installMarkers = [
    "dailyplanner",
    "everytime",
    "today-daily-planner",
    "\u4eca\u65e5\u65e5\u7a0bapp",
    "\u4eca\u65e5\u65e5\u7a0b"
  ];

  function normalizePath(value) {
    return String(value || "").replaceAll("/", "\\").trim();
  }

  /** Extract the .exe path from a Run command, including unquoted paths with spaces. */
  function commandExecutablePath(command) {
    const text = String(command || "").trim();
    if (!text) return "";
    const quoted = text.match(/^"([^"]+\.exe)"/i);
    if (quoted) return normalizePath(quoted[1]);
    const throughExe = text.match(/^(.+?\.exe)(?:\s|$)/i);
    return throughExe ? normalizePath(throughExe[1]) : "";
  }

  function executableName(command) {
    const path = commandExecutablePath(command);
    return path.split(/[\\/]/).pop().toLowerCase();
  }

  function quoteCommand(exePath) {
    const clean = normalizePath(exePath).replaceAll('"', "");
    if (!clean) return "";
    return `"${clean}"`;
  }

  function isOwnedCommand(command, currentExe = "") {
    const commandPath = commandExecutablePath(command);
    const name = commandPath.split(/[\\/]/).pop().toLowerCase();
    if (!executableNames.map(item => item.toLowerCase()).includes(name)) return false;
    if (!commandPath) return false;
    const currentPath = normalizePath(currentExe).toLowerCase();
    const normalizedCommand = commandPath.toLowerCase();
    if (currentPath && normalizedCommand === currentPath) return true;
    const directory = normalizedCommand.slice(0, Math.max(0, normalizedCommand.lastIndexOf("\\")));
    return installMarkers.some(marker => directory.includes(marker));
  }

  function cleanupPlan(entries = [], currentExe = "") {
    const allowed = new Set(aliases.map(item => item.toLowerCase()));
    return entries.filter(entry =>
      allowed.has(String(entry.name || "").toLowerCase())
      && isOwnedCommand(entry.command, currentExe)
    );
  }

  root.StartupPolicy = {
    canonicalName,
    aliases,
    executableNames,
    installMarkers,
    executableName,
    commandExecutablePath,
    quoteCommand,
    isOwnedCommand,
    cleanupPlan
  };
  if (typeof module !== "undefined" && module.exports) module.exports = root.StartupPolicy;
})(typeof window === "undefined" ? globalThis : window);
