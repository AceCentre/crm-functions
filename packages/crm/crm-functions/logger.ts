import { App } from "@slack/bolt";

// Rolls all logs into one message for observability

type LogMessage = {
  message: string;
  level: LOG_LEVEL;
  extraInfo?: any;
  error?: any;
};

// Info will send everything
// Success will send success and errors
// Error will only send errors (if it does get an error it will send everything for that given request)
// None will do nothing
export enum LOG_LEVEL {
  INFO = 2,
  SUCCESS = 3,
  ERROR = 4,
  NONE = 5,
}

const INPUT_KEYS = ["email", "location", "firstName", "lastName", "eventSlug"];

export class Logger {
  messages: LogMessage[];
  consoleLevel: LOG_LEVEL;
  slackLevel: LOG_LEVEL;
  debugInfo: { [key: string]: any };
  isConnected: boolean;
  app: any;

  constructor({
    debugInfo = {},
    consoleLevel = LOG_LEVEL.INFO,
    slackLevel = LOG_LEVEL.SUCCESS,
  }: {
    debugInfo?: { [key: string]: any };
    consoleLevel?: LOG_LEVEL;
    slackLevel?: LOG_LEVEL;
  }) {
    this.debugInfo = {};
    this.isConnected = false;
    for (const key of INPUT_KEYS) {
      this.debugInfo[key] = debugInfo[key];
    }

    this.consoleLevel = consoleLevel;
    this.slackLevel = slackLevel;
    this.messages = [];
  }

  async connect() {
    if (!process.env.SLACK_TOKEN || !process.env.SLACK_SIGNING_TOKEN) {
      throw new Error(
        "You tried to connect to slack but didn't provide any tokens"
      );
    }

    // Connect to slack
    this.app = await new App({
      token: process.env.SLACK_TOKEN,
      signingSecret: process.env.SLACK_SIGNING_TOKEN,
    });

    this.isConnected = true;
  }

  info(message: string, extraInfo?: any) {
    this.messages.push({ message, level: LOG_LEVEL.INFO, extraInfo });
  }

  success(message: string, extraInfo?: any) {
    this.messages.push({ message, level: LOG_LEVEL.SUCCESS, extraInfo });
  }

  error(message: string, error?: any) {
    this.messages.push({ message, level: LOG_LEVEL.ERROR, error });
  }

  getMessages(logLevel: LOG_LEVEL): LogMessage[] {
    const filteredMessages = this.messages.filter(
      (message) => message.level >= logLevel
    );

    const doesIncludeError = filteredMessages
      .flatMap((x) => x.level)
      .includes(LOG_LEVEL.ERROR);

    const messagesToLog = doesIncludeError ? this.messages : filteredMessages;

    return messagesToLog;
  }

  flushToConsole() {
    const messagesToLog = this.getMessages(this.consoleLevel);

    if (messagesToLog.length > 0) {
      console.log("----------------");
      console.log("Debug Info", this.debugInfo);
    }

    let messageCount = 1;
    for (const message of messagesToLog) {
      console.log(`Message ${messageCount}:`, message.message);
      if (message.extraInfo !== undefined) {
        console.log(`Extra Info ${messageCount}:`, message.extraInfo);
      }

      if (message.error !== undefined) {
        console.log(`Error ${messageCount}:`, message.error);
      }

      messageCount++;
    }

    if (messagesToLog.length > 0) {
      console.log("----------------");
    }
  }

  async flushToSlack() {
    let slackMessage = "<@U01S5QXCDV3> - CRM Service sent a log.\n";
    slackMessage += "Here are the debug options for the given message:\n";
    slackMessage += "```\n";
    slackMessage += JSON.stringify(this.debugInfo, null, 2);
    slackMessage += "```\n\n";

    const messagesToLog = this.getMessages(this.slackLevel);

    let messageCount = 1;
    for (const message of messagesToLog) {
      slackMessage += `Message ${messageCount}:  ${message.message}\n`;
      if (message.extraInfo !== undefined) {
        if (message.extraInfo.stack !== undefined) {
          slackMessage += `Extra Info ${messageCount}:\n`;
          slackMessage += "```\n";
          slackMessage += JSON.stringify(message.extraInfo.stack, null, 2);
          slackMessage += "```\n\n";
        } else {
          slackMessage += `Extra Info ${messageCount}:\n`;
          slackMessage += "```\n";
          slackMessage += JSON.stringify(message.extraInfo, null, 2);
          slackMessage += "```\n\n";
        }
      }

      if (message.error !== undefined) {
        if (message.error.stack !== undefined) {
          slackMessage += `Error ${messageCount}:\n`;
          slackMessage += "```\n";
          slackMessage += JSON.stringify(message.error.stack, null, 2);
          slackMessage += "```\n\n";
        } else {
          slackMessage += `Error ${messageCount}:\n`;
          slackMessage += "```\n";
          slackMessage += JSON.stringify(message.error, null, 2);
          slackMessage += "```\n\n";
        }
      }

      messageCount++;
    }

    await this.app.client.chat.postMessage({
      channel: "C02E0MC3HB2",
      text: slackMessage,
    });
  }

  // Flushes logs to console and slack depending on log level
  async flush() {
    this.flushToConsole();
    if (this.isConnected) {
      await this.flushToSlack();
    }

    this.messages = [];
  }
}
