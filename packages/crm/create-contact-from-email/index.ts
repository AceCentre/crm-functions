type HandlerOptions = {
  __ow_method: "get" | "post";
};

type HandlerResult = {
  statusCode?: 404;
  body?: string;
};

const handler = (handlerOptions: HandlerOptions): HandlerResult => {
  if (handlerOptions.__ow_method !== "post") {
    return { statusCode: 404 };
  }

  console.log(handlerOptions);

  return { body: "Welcome" };
};

export const main = handler;
