import { App } from "@slack/bolt";

const INPUT_KEYS = ["email", "location", "firstName", "lastName", "eventSlug"];

export class SlackService {
  connected: boolean;
  debugInfo: { [key: string]: any };
  app: any;

  constructor(debugInfo: { [key: string]: any } = {}) {
    this.debugInfo = {};

    for (const key of INPUT_KEYS) {
      this.debugInfo[key] = debugInfo[key] || null;
    }
  }

  async connect() {
    if (!process.env.SLACK_TOKEN || !process.env.SLACK_SIGNING_TOKEN) {
      console.log("NOT CONNECTING TO SLACK", process.env.SEND_SUCCESS);

      this.connected = false;
    } else {
      // Connect to slack
      this.app = await new App({
        token: process.env.SLACK_TOKEN,
        signingSecret: process.env.SLACK_SIGNING_TOKEN,
      });

      console.log(
        "CONNECTED TO SLACK, logging success:",
        process.env.SEND_SUCCESS
      );

      this.connected = true;
    }
  }

  async sendError(message: string) {
    if (this.connected) {
      // Send message
      console.log("Trying to send a slack message");
      await this.app.client.chat.postMessage({
        channel: "C02E0MC3HB2",
        text: `<@U01S5QXCDV3> - ${message}
        \`\`\`
        ${JSON.stringify(this.debugInfo, null, 2)}
        \`\`\``,
      });
      console.log("Sent a slack message");
    } else {
      console.error("==== NOT CONNECTED TO SLACK (ERR) ====");
      console.error(message);
      console.error(JSON.stringify(this.debugInfo, null, 2));
      console.log("");
    }
  }

  async sendSuccess(message: string) {
    if (process.env.SEND_SUCCESS) {
      if (this.connected) {
        // Send message
        console.log("Trying to send a slack message");
        await this.app.client.chat.postMessage({
          channel: "C02E0MC3HB2",
          text: `<@U01S5QXCDV3> - ${message}
          \`\`\`
          ${JSON.stringify(this.debugInfo, null, 2)}
          \`\`\``,
        });
        console.log("Sent a slack message");
      } else {
        console.log("==== NOT CONNECTED TO SLACK (SUC) ====");
        console.log(message);
        console.error(JSON.stringify(this.debugInfo, null, 2));
        console.log("");
      }
    }
  }
}
