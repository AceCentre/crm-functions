"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlackService = void 0;
const bolt_1 = require("@slack/bolt");
class SlackService {
    constructor(handlerOptions) {
        this.handlerOptions = {
            email: handlerOptions.email,
            location: handlerOptions.location,
            firstName: handlerOptions.firstName,
            lastName: handlerOptions.lastName,
        };
        if (!process.env.SLACK_TOKEN || !process.env.SLACK_SIGNING_TOKEN) {
            console.log("NOT CONNECTING TO SLACK", process.env.SEND_SUCCESS);
            this.connected = false;
        }
        else {
            // Connect to slack
            this.app = new bolt_1.App({
                token: process.env.SLACK_TOKEN,
                signingSecret: process.env.SLACK_SIGNING_TOKEN,
            });
            console.log("CONNECTED TO SLACK, logging success:", process.env.SEND_SUCCESS);
            this.connected = true;
        }
    }
    async sendError(message) {
        if (this.connected) {
            // Send message
            console.log("Trying to send a slack message");
            await this.app.client.chat.postMessage({
                channel: "C02E0MC3HB2",
                text: `<@U01S5QXCDV3> - ${message}
        \`\`\`
        ${JSON.stringify(this.handlerOptions, null, 2)}
        \`\`\``,
            });
            console.log("Sent a slack message");
        }
        else {
            console.error("==== NOT CONNECTED TO SLACK (ERR) ====");
            console.error(message);
            console.error(JSON.stringify(this.handlerOptions, null, 2));
            console.log("");
        }
    }
    async sendSuccess(message) {
        if (process.env.SEND_SUCCESS) {
            if (this.connected) {
                // Send message
                console.log("Trying to send a slack message");
                await this.app.client.chat.postMessage({
                    channel: "C02E0MC3HB2",
                    text: `<@U01S5QXCDV3> - ${message}
          \`\`\`
          ${JSON.stringify(this.handlerOptions, null, 2)}
          \`\`\``,
                });
                console.log("Sent a slack message");
            }
            else {
                console.log("==== NOT CONNECTED TO SLACK (SUC) ====");
                console.log(message);
                console.error(JSON.stringify(this.handlerOptions, null, 2));
                console.log("");
            }
        }
    }
}
exports.SlackService = SlackService;
