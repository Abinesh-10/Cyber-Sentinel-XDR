const LEVELS = Object.freeze({
  silent: -1,
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
});

export function createLogger({ level = "info", scope = "cybersentinel" } = {}) {
  const activeLevel = LEVELS[level] ?? LEVELS.info;

  function write(logLevel, message, details) {
    if ((LEVELS[logLevel] ?? LEVELS.info) > activeLevel) return;

    const entry = {
      timestamp: new Date().toISOString(),
      level: logLevel,
      scope,
      message,
      ...(details && Object.keys(details).length ? { details } : {}),
    };
    const output = JSON.stringify(entry);

    if (logLevel === "error") {
      console.error(output);
    } else if (logLevel === "warn") {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  return {
    error(message, details) {
      write("error", message, details);
    },
    warn(message, details) {
      write("warn", message, details);
    },
    info(message, details) {
      write("info", message, details);
    },
    debug(message, details) {
      write("debug", message, details);
    },
    child(childScope) {
      return createLogger({
        level,
        scope: `${scope}.${childScope}`,
      });
    },
  };
}
