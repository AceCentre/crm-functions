"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LOG_LEVEL = void 0;
const bolt_1 = require("@slack/bolt");
// Info will send everything
// Success will send success and errors
// Error will only send errors (if it does get an error it will send everything for that given request)
// None will do nothing
var LOG_LEVEL;
(function (LOG_LEVEL) {
    LOG_LEVEL[LOG_LEVEL["INFO"] = 2] = "INFO";
    LOG_LEVEL[LOG_LEVEL["SUCCESS"] = 3] = "SUCCESS";
    LOG_LEVEL[LOG_LEVEL["ERROR"] = 4] = "ERROR";
    LOG_LEVEL[LOG_LEVEL["NONE"] = 5] = "NONE";
})(LOG_LEVEL = exports.LOG_LEVEL || (exports.LOG_LEVEL = {}));
const INPUT_KEYS = ["email", "location", "firstName", "lastName", "eventSlug"];
class Logger {
    constructor({ debugInfo = {}, consoleLevel = LOG_LEVEL.INFO, slackLevel = LOG_LEVEL.SUCCESS, }) {
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
            throw new Error("You tried to connect to slack but didn't provide any tokens");
        }
        // Connect to slack
        this.app = await new bolt_1.App({
            token: process.env.SLACK_TOKEN,
            signingSecret: process.env.SLACK_SIGNING_TOKEN,
        });
        this.isConnected = true;
    }
    info(message, extraInfo) {
        this.messages.push({ message, level: LOG_LEVEL.INFO, extraInfo });
    }
    success(message, extraInfo) {
        this.messages.push({ message, level: LOG_LEVEL.SUCCESS, extraInfo });
    }
    error(message, error) {
        this.messages.push({ message, level: LOG_LEVEL.ERROR, error });
    }
    getMessages(logLevel) {
        const filteredMessages = this.messages.filter((message) => message.level >= logLevel);
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
                }
                else {
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
                }
                else {
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
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map