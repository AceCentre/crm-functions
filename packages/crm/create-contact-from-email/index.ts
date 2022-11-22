type GenericHandlerOptions = {
  __ow_method?: string;
  __ow_path?: string;
  __ow_headers?: {};
};

type GenericHandlerResult = {
  statusCode?: number;
  body?: string;
};

class SugarService {
  constructor() {}

  async authenticate(): Promise<void> {
    return;
  }
}

const ALLOWED_PATHS = ["", "/"];

type CreateContactHandlerOptions = {
  email?: string;
} & GenericHandlerOptions;

type CreateContactHandlerResult = {} & GenericHandlerResult;

export const handler = async (
  handlerOptions: CreateContactHandlerOptions
): Promise<CreateContactHandlerResult> => {
  return { statusCode: 200 };

  if (
    handlerOptions.__ow_method === undefined ||
    handlerOptions.__ow_method.toLowerCase() !== "post"
  ) {
    return {
      statusCode: 404,
      body: JSON.stringify({ reason: "Endpoint only accepts POST requests" }),
    };
  }

  if (
    handlerOptions.__ow_path === undefined ||
    !ALLOWED_PATHS.includes(handlerOptions.__ow_path)
  ) {
    return {
      statusCode: 404,
      body: JSON.stringify({ reason: "Endpoint only accepts requests to /" }),
    };
  }

  if (!handlerOptions.email) {
    return {
      statusCode: 400,
      body: JSON.stringify({ reason: "No email provided" }),
    };
  }

  const crmService = new SugarService();

  await crmService.authenticate();

  console.log(handlerOptions);

  return { body: JSON.stringify({ message: "Welcome" }) };
};

export const main = handler;
