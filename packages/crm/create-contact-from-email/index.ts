type HandlerOptions = {
  __ow_method?: "get" | "post";
  __ow_path?: string;
  __ow_headers?: {};
};

type HandlerResult = {
  statusCode?: 404;
  body?: string;
};

class SugarCrmService {
  constructor() {}
}

export const handler = (handlerOptions: HandlerOptions): HandlerResult => {
  if (handlerOptions.__ow_method !== "post") {
    return { statusCode: 404 };
  }

  if (handlerOptions.__ow_path !== "") {
    return { statusCode: 404 };
  }

  const crmService = new SugarCrmService();

  console.log(handlerOptions);

  return { body: "Welcome" };
};

export const main = handler;
