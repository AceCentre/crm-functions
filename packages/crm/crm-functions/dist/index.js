"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = exports.handler = void 0;
const add_to_course_1 = require("./add-to-course");
const add_to_newsletter_1 = require("./add-to-newsletter");
const slack_service_1 = require("./slack-service");
const sugar_service_1 = require("./sugar-service");
const validate_request_1 = require("./validate-request");
const handler = async (handlerOptions) => {
    console.log("====== INPUT =======");
    console.log({ handlerOptions });
    console.log("");
    const { valid, reason } = (0, validate_request_1.validateRequestParameters)(handlerOptions);
    if (!valid) {
        return { statusCode: 404, body: JSON.stringify({ reason }) };
    }
    const crmService = new sugar_service_1.SugarService({
        username: process.env.USERNAME,
        password: process.env.PASSWORD,
    });
    const slackService = new slack_service_1.SlackService(handlerOptions);
    try {
        await slackService.connect();
    }
    catch (err) {
        console.log("Failed to connect to slack");
        console.log(err);
        return {
            statusCode: 500,
            body: JSON.stringify({ reason: "Failed to connect to slack" }),
        };
    }
    if (handlerOptions.method === "add-to-newsletter") {
        return await (0, add_to_newsletter_1.addToNewsletter)(handlerOptions, crmService, slackService);
    }
    if (handlerOptions.method === "add-to-course") {
        return await (0, add_to_course_1.addToCourse)(handlerOptions, crmService, slackService);
    }
    return {
        statusCode: 404,
        body: JSON.stringify({ reason: "No method supplied" }),
    };
};
exports.handler = handler;
exports.main = exports.handler;
