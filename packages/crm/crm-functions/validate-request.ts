import { ALLOWED_METHODS, HandlerInput } from "./types";

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

  if (handlerOptions.method === undefined) {
    return {
      valid: false,
      reason: "You did not provide a 'method'",
    };
  }

  const readableMethods: string[] = [...ALLOWED_METHODS];

  if (!readableMethods.includes(handlerOptions.method.toLowerCase())) {
    return {
      valid: false,
      reason: `You provided a non recognised method: ${handlerOptions.method}`,
    };
  }

  return { valid: true, reason: "" };
};
