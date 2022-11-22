import { main } from "../index";
import { SugarService } from "../sugar-service";

jest.mock("../sugar-service");

beforeEach(() => {
  // Clear all instances and calls to constructor and all methods:
  const mocked = jest.mocked(SugarService);

  mocked.mockClear();
});

describe("Check suite is working", () => {
  test("Forever passing test", () => {
    expect(true).toEqual(true);
  });
});

describe("Validate Request", () => {
  test("Returns a 404 when no method is given", async () => {
    const result = await main({ __ow_path: "" });

    expect(result).toEqual({
      statusCode: 404,
      body: `{"reason":"Endpoint only accepts POST requests"}`,
    });
  });

  test("Returns a 404 when a get is sent", async () => {
    const result = await main({ __ow_path: "", __ow_method: "get" });

    expect(result).toEqual({
      statusCode: 404,
      body: `{"reason":"Endpoint only accepts POST requests"}`,
    });
  });

  test("Returns a 404 when a made up method is sent", async () => {
    const result = await main({ __ow_path: "", __ow_method: "not real" });

    expect(result).toEqual({
      statusCode: 404,
      body: `{"reason":"Endpoint only accepts POST requests"}`,
    });
  });

  test("Returns a 404 when no path is given", async () => {
    const result = await main({ __ow_method: "post" });

    expect(result).toEqual({
      statusCode: 404,
      body: `{"reason":"Endpoint only accepts requests to /"}`,
    });
  });

  test("Returns a 404 when another path is given", async () => {
    const result = await main({
      __ow_method: "post",
      __ow_path: "/this-is-a-path",
    });

    expect(result).toEqual({
      statusCode: 404,
      body: `{"reason":"Endpoint only accepts requests to /"}`,
    });
  });

  test("Returns a bad request if no email is given", async () => {
    const result = await main({ __ow_method: "post", __ow_path: "" });

    expect(result).toEqual({
      statusCode: 400,
      body: `{"reason":"No email provided"}`,
    });
  });
});

describe("Handles Sugar errors", () => {
  test("Returns 500 when Sugar can't authenticate the user", async () => {
    jest.mocked(SugarService).mockImplementation(() => ({
      authenticate: jest.fn(() => {
        throw new Error("");
      }),

      getContactsByEmail: jest.fn(() => {
        return Promise.resolve([]);
      }),

      optInToMailing: jest.fn(() => {
        return Promise.resolve();
      }),

      createNewContact: jest.fn(() => {
        return Promise.resolve({ id: "123" });
      }),
    }));

    const result = await main({
      __ow_method: "post",
      __ow_path: "",
      email: "user-to-add@email.com",
    });

    expect(result).toEqual({
      statusCode: 500,
      body: `{"reason":"Failed to authenticate to SugarCRM."}`,
    });
  });

  test("Returns 500 when Sugar can't get contacts", async () => {
    jest.mocked(SugarService).mockImplementation(() => ({
      authenticate: jest.fn(() => {
        return Promise.resolve();
      }),

      getContactsByEmail: jest.fn(() => {
        throw new Error("Cant get contacts");
      }),

      optInToMailing: jest.fn(() => {
        return Promise.resolve();
      }),

      createNewContact: jest.fn(() => {
        return Promise.resolve({ id: "123" });
      }),
    }));

    const result = await main({
      __ow_method: "post",
      __ow_path: "",
      email: "user-to-add@email.com",
    });

    expect(result).toEqual({
      statusCode: 500,
      body: `{"reason":"Failed to get contacts by email."}`,
    });
  });

  test("Returns 500 when Sugar can't create a new contact", async () => {
    jest.mocked(SugarService).mockImplementation(() => ({
      authenticate: jest.fn(() => {
        return Promise.resolve();
      }),

      getContactsByEmail: jest.fn(() => {
        return Promise.resolve([]);
      }),

      optInToMailing: jest.fn(() => {
        return Promise.resolve();
      }),

      createNewContact: jest.fn(() => {
        throw new Error("Cant create user");
      }),
    }));

    const result = await main({
      __ow_method: "post",
      __ow_path: "",
      email: "user-to-add@email.com",
    });

    expect(result).toEqual({
      statusCode: 500,
      body: `{"reason":"Failed to create a new contact."}`,
    });
  });

  test("Returns 500 when Sugar can't opt a user in", async () => {
    jest.mocked(SugarService).mockImplementation(() => ({
      authenticate: jest.fn(() => {
        return Promise.resolve();
      }),

      getContactsByEmail: jest.fn(() => {
        return Promise.resolve([{ id: "123" }]);
      }),

      optInToMailing: jest.fn(() => {
        throw new Error("Failed to opt user in");
      }),

      createNewContact: jest.fn(() => {
        return Promise.resolve({ id: "123" });
      }),
    }));

    const result = await main({
      __ow_method: "post",
      __ow_path: "",
      email: "user-to-add@email.com",
    });

    expect(result).toEqual({
      statusCode: 500,
      body: `{"reason":"Failed to opt user into mailing."}`,
    });
  });
});
