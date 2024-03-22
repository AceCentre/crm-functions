import { HandlerInput } from "./types";

const ALLOWED_PATHS = ["", "/"];

export const validateRequestParameters = (
  handlerOptions: HandlerInput
): { valid: boolean; reason: string } => {
  if (
    handlerOptions.__ow_method === undefined ||
    handlerOptions.__ow_method.toLowerCase() !== "post"
  ) {
    return {
      valid: false,
      reason: "Endpoint only accepts POST requests",
    };
  }

  if (
    handlerOptions.__ow_path === undefined ||
    !ALLOWED_PATHS.includes(handlerOptions.__ow_path)
  ) {
    return {
      valid: false,
      reason: "Endpoint only accepts requests to /",
    };
  }

  return { valid: true, reason: "" };
};
