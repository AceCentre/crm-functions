"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = exports.handler = void 0;
const add_to_course_1 = require("./add-to-course");
const add_to_newsletter_1 = require("./add-to-newsletter");
const logger_1 = require("./logger");
const sugar_service_1 = require("./sugar-service");
const validate_request_1 = require("./validate-request");
const handler = async (handlerOptions) => {
    const { valid, reason } = (0, validate_request_1.validateRequestParameters)(handlerOptions);
    if (!valid) {
        return { statusCode: 404, body: JSON.stringify({ reason }) };
    }
    const logger = new logger_1.Logger({
        debugInfo: handlerOptions,
        consoleLevel: logger_1.LOG_LEVEL.INFO,
        slackLevel: logger_1.LOG_LEVEL.ERROR,
    });
    const crmService = new sugar_service_1.SugarService({
        username: process.env.CRM_USERNAME,
        password: process.env.CRM_PASSWORD,
    }, logger);
    try {
        await logger.connect();
    }
    catch (err) {
        console.log("Failed to connect to slack");
        console.log(err);
        return {
            statusCode: 500,
            body: JSON.stringify({ reason: "Failed to connect to slack" }),
        };
    }
    let result = {
        statusCode: 404,
        body: JSON.stringify({ reason: "No method supplied" }),
    };
    if (handlerOptions.method === "add-to-newsletter") {
        result = await (0, add_to_newsletter_1.addToNewsletter)(handlerOptions, crmService, logger);
    }
    if (handlerOptions.method === "add-to-course") {
        result = await (0, add_to_course_1.addToCourse)(handlerOptions, crmService, logger);
    }
    if (handlerOptions.method === undefined) {
        result = await (0, add_to_newsletter_1.addToNewsletter)(Object.assign(Object.assign({}, handlerOptions), { location: "arlo", tags: [{ name: "ace-centre-learning" }] }), crmService, logger);
    }
    logger.info(`Result:`, result);
    try {
        await logger.flush();
    }
    catch (error) {
        console.log("Failed to flush logs", error);
    }
    return result;
};
exports.handler = handler;
exports.main = exports.handler;
//# sourceMappingURL=index.js.map