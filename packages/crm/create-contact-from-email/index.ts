type GenericHandlerOptions = {
  __ow_method?: string;
  __ow_path?: string;
  __ow_headers?: {};
};

type GenericHandlerResult = {
  statusCode?: number;
  body?: { reason?: string; message?: string };
};

class SugarCrmService {
  constructor() {}
}

const ALLOWED_PATHS = ["", "/"];

type CreateContactHandlerOptions = {
  email?: string;
} & GenericHandlerOptions;

type CreateContactHandlerResult = {} & GenericHandlerResult;

export const handler = (
  handlerOptions: CreateContactHandlerOptions
): CreateContactHandlerResult => {
  if (
    handlerOptions.__ow_method === undefined ||
    handlerOptions.__ow_method.toLowerCase() !== "post"
  ) {
    return {
      statusCode: 404,
      body: { reason: "Endpoint only accepts POST requests" },
    };
  }

  if (
    handlerOptions.__ow_path === undefined ||
    !ALLOWED_PATHS.includes(handlerOptions.__ow_path)
  ) {
    return {
      statusCode: 404,
      body: { reason: "Endpoint only accepts requests to /" },
    };
  }

  if (!handlerOptions.email) {
    return { statusCode: 400, body: { reason: "No email provided" } };
  }

  const crmService = new SugarCrmService();

  console.log(handlerOptions);

  return { body: { message: "Welcome" } };
};

export const main = handler;
