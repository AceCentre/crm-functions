import { Logger, LOG_LEVEL } from "../logger";

describe("Logger", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("Nothing is logged when set to NONE", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const logger = new Logger({ consoleLevel: LOG_LEVEL.NONE });

    logger.info("Uh oh");
    logger.success("Uh oh");
    logger.error("Uh oh");

    await logger.flush();

    expect(logSpy).not.toBeCalled();
  });

  test("Level INFO logs info messages", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const logger = new Logger({ consoleLevel: LOG_LEVEL.INFO });

    logger.info("Uh oh");

    await logger.flush();

    expect(logSpy).toBeCalled();
  });

  test("Level INFO logs success messages", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const logger = new Logger({ consoleLevel: LOG_LEVEL.INFO });

    logger.success("Uh oh");

    await logger.flush();

    expect(logSpy).toBeCalled();
  });

  test("Level INFO logs error messages", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const logger = new Logger({ consoleLevel: LOG_LEVEL.INFO });

    logger.error("Uh oh");

    await logger.flush();

    expect(logSpy).toBeCalled();
  });

  test("Level Success ignores info", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const logger = new Logger({ consoleLevel: LOG_LEVEL.SUCCESS });

    logger.info("Uh oh");

    await logger.flush();

    expect(logSpy).not.toBeCalled();
  });

  test("Level Success logs success", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const logger = new Logger({ consoleLevel: LOG_LEVEL.SUCCESS });

    logger.success("Uh oh");

    await logger.flush();

    expect(logSpy).toBeCalled();
  });

  test("Level Success logs errors", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const logger = new Logger({ consoleLevel: LOG_LEVEL.SUCCESS });

    logger.error("Uh oh");

    await logger.flush();

    expect(logSpy).toBeCalled();
  });

  test("Level Error ignore info", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const logger = new Logger({ consoleLevel: LOG_LEVEL.ERROR });

    logger.info("Uh oh");

    await logger.flush();

    expect(logSpy).not.toBeCalled();
  });

  test("Level Error ignore success", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const logger = new Logger({ consoleLevel: LOG_LEVEL.ERROR });

    logger.success("Uh oh");

    await logger.flush();

    expect(logSpy).not.toBeCalled();
  });

  test("Level Error logs error", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const logger = new Logger({ consoleLevel: LOG_LEVEL.ERROR });

    logger.error("Uh oh");

    await logger.flush();

    expect(logSpy).toBeCalled();
  });
});

describe.skip("logger formatting", () => {
  test("See what an error looks like in the console", async () => {
    const logger = new Logger({ consoleLevel: LOG_LEVEL.INFO });

    const err = new Error("An error was caught");

    logger.error("Uh oh", err);

    await logger.flush();
  });

  test("See what an error looks like in the console", async () => {
    const logger = new Logger({ consoleLevel: LOG_LEVEL.INFO });

    const err = new Error("An error was caught");

    logger.success("Uh oh", err);

    await logger.flush();
  });

  test("See what an info looks like in the console", async () => {
    const logger = new Logger({ consoleLevel: LOG_LEVEL.INFO });

    const err = new Error("An error was caught");

    logger.info("Uh oh", err);

    await logger.flush();
  });
});

describe.skip("Slack formatting", () => {
  test("See what a slack message looks like", async () => {
    const logger = new Logger({
      slackLevel: LOG_LEVEL.INFO,
      consoleLevel: LOG_LEVEL.NONE,
      debugInfo: { email: "test", ignored: true },
    });

    process.env.SLACK_TOKEN =
      "xoxb-3066715391-2450100639013-kjRgi3lLK7IjdMfI7Da7gY0Z";
    process.env.SLACK_SIGNING_TOKEN = "a4e665a9f9b44e6be9259a96b1f5258e";

    await logger.connect();

    const err = new Error("First error");

    logger.info("Something happened good");
    logger.error("Something went wrong", err);
    logger.error("Something else went wrong", { errorWithNoTrace: "testing" });
    logger.info("Something else happened", { test: true });

    await logger.flush();
  });
});
