// Rolls all logs into one message for observability

type LogMessage = {
  message: string;
  level: "INFO" | "SUCCESS" | "ERROR";
};

export class Logger {
  messages: LogMessage[];

  constructor() {
    this.messages = [];
  }

  async connect() {}

  info(message: string, extraInfo?: any) {
    this.messages.push({ message, level: "INFO" });
  }

  success(message: string) {
    this.messages.push({ message, level: "SUCCESS" });
  }

  error(message: string, error?: any) {
    this.messages.push({ message, level: "ERROR" });
  }

  // Flushes logs to console and slack depending on log level
  async flush() {}
}
