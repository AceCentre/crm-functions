type HandlerOptions = {};

const handler = (handlerOptions: HandlerOptions) => {
  console.log(handlerOptions);

  return { body: "Welcome" };
};

export const main = handler;
