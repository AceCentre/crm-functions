import { sharedFunction } from "../../../src/share-lib";

const handler = (...allArgs: any) => {
  console.log(allArgs);
  sharedFunction();
  return { body: "Welcome" };
};

export const main = handler;
