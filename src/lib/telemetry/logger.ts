type LogLevel = "info" | "warn" | "error";

interface LogPayload {
  message: string;
  context?: Record<string, unknown>;
}

function write(level: LogLevel, payload: LogPayload): void {
  const entry = {
    level,
    timestamp: new Date().toISOString(),
    message: payload.message,
    context: payload.context ?? {}
  };

  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export const logger = {
  info(message: string, context?: Record<string, unknown>): void {
    write("info", { message, context });
  },
  warn(message: string, context?: Record<string, unknown>): void {
    write("warn", { message, context });
  },
  error(message: string, context?: Record<string, unknown>): void {
    write("error", { message, context });
  }
};
