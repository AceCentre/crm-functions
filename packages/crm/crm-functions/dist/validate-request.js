"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequestParameters = void 0;
const types_1 = require("./types");
const ALLOWED_PATHS = ["", "/"];
const validateRequestParameters = (handlerOptions) => {
    if (handlerOptions.__ow_method === undefined ||
        handlerOptions.__ow_method.toLowerCase() !== "post") {
        return {
            valid: false,
            reason: "Endpoint only accepts POST requests",
        };
    }
    if (handlerOptions.__ow_path === undefined ||
        !ALLOWED_PATHS.includes(handlerOptions.__ow_path)) {
        return {
            valid: false,
            reason: "Endpoint only accepts requests to /",
        };
    }
    if (handlerOptions.method === undefined) {
        return {
            valid: false,
            reason: "You did not provide a 'method'",
        };
    }
    const readableMethods = [...types_1.ALLOWED_METHODS];
    if (!readableMethods.includes(handlerOptions.method.toLowerCase())) {
        return {
            valid: false,
            reason: `You provided a non recognised method: ${handlerOptions.method}`,
        };
    }
    return { valid: true, reason: "" };
};
exports.validateRequestParameters = validateRequestParameters;
