import { addToNewsletter } from "./add-to-newsletter";
import { SlackService } from "./slack-service";
import { SugarService } from "./sugar-service";
import { HandlerInput, HandlerResult } from "./types";
import { validateRequestParameters } from "./validate-request";

export const handler = async (
  handlerOptions: HandlerInput
): Promise<HandlerResult> => {
  console.log("====== INPUT =======");
  console.log({ handlerOptions });
  console.log("");

  const { valid, reason } = validateRequestParameters(handlerOptions);

  if (!valid) {
    return { statusCode: 404, body: JSON.stringify({ reason }) };
  }

  const crmService = new SugarService();
  const slackService = new SlackService(handlerOptions);

  try {
    slackService.connect();
  } catch (err) {
    console.log("Failed to connect to slack");
    console.log(err);

    return {
      statusCode: 500,
      body: JSON.stringify({ reason: "Failed to connect to slack" }),
    };
  }

  if (handlerOptions.method === "add-to-newsletter") {
    return await addToNewsletter(handlerOptions, crmService, slackService);
  }

  if (handlerOptions.method === "add-to-course") {
    return {
      statusCode: 404,
      body: JSON.stringify({ reason: "Not yet implemented" }),
    };
  }

  return {
    statusCode: 404,
    body: JSON.stringify({ reason: "No method supplied" }),
  };
};

export const main = handler;
