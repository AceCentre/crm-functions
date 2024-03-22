"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequestParameters = void 0;
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
    return { valid: true, reason: "" };
};
exports.validateRequestParameters = validateRequestParameters;
//# sourceMappingURL=validate-request.js.map