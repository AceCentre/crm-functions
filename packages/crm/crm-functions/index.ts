import { addToCourse } from "./add-to-course";
import { addToNewsletter } from "./add-to-newsletter";
import { Logger, LOG_LEVEL } from "./logger";
import { SugarService } from "./sugar-service";
import { HandlerInput, HandlerResult } from "./types";
import { validateRequestParameters } from "./validate-request";

export const handler = async (
  handlerOptions: HandlerInput
): Promise<HandlerResult> => {
  const { valid, reason } = validateRequestParameters(handlerOptions);

  if (!valid) {
    return { statusCode: 404, body: JSON.stringify({ reason }) };
  }

  const logger = new Logger({
    debugInfo: handlerOptions,
    consoleLevel: LOG_LEVEL.INFO,
    slackLevel: LOG_LEVEL.INFO,
  });

  const crmService = new SugarService(
    {
      username: process.env.CRM_USERNAME,
      password: process.env.CRM_PASSWORD,
    },
    logger
  );

  try {
    await logger.connect();
  } catch (err) {
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
    result = await addToNewsletter(handlerOptions, crmService, logger);
  }

  if (handlerOptions.method === "add-to-course") {
    result = await addToCourse(handlerOptions, crmService, logger);
  }

  logger.info(`Result:`, result);

  try {
    await logger.flush();
  } catch (error) {
    console.log("Failed to flush logs", error);
  }

  return result;
};

export const main = handler;
