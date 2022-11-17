const handler = (...allArgs: any) => {
  console.log(allArgs);

  return { body: "Welcome" };
};

export const main = handler;
