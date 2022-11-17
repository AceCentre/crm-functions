function main(args, ...rest) {
  let name = args.name || "stranger";
  let greeting = "Hello " + name + "!";
  console.log(greeting, args, rest);
  return { body: greeting };
}

exports.main = main;
