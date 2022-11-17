import Ventana from "@sugarcrm/ventana";

const SugarApi = Ventana.getInstance({
  serverUrl: process.env.serverUrl,
  platform: process.env.platform,
  timeout: process.env.serverTimeout,
  clientID: process.env.clientID,
});

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

  const result = SugarApi.getMetadata();

  console.log(result, handlerOptions);

  return { body: "Welcome" };
};

export const main = handler;
