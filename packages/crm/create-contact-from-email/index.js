//  const { sharedFunction } = require("../../../src/share-lib");

function main(args, ...rest) {
  //  sharedFunction();
  const name = args.name || "stranger";
  const greeting = "Hello " + name + "!";
  console.log(greeting, args, rest);
  return { body: greeting };
}

exports.main = main;
