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
      apiPath: "apiPath",
      hostname: "hostname",
      api: "api",
      token: "token",

      getBody: jest.fn(() => {
        return Promise.resolve({ result: true });
      }),

      authenticate: jest.fn(() => {
        throw new Error("");
      }),

      getContactsByEmail: jest.fn(() => {
        return Promise.resolve([]);
      }),

      updateContact: jest.fn(() => {
        return Promise.resolve();
      }),

      createNewContact: jest.fn(() => {
        return Promise.resolve({
          id: "123",
          firstName: "",
          lastName: "",
          location: "",
          receivesNewsletter: true,
          email: "",
        });
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
      apiPath: "apiPath",
      hostname: "hostname",
      api: "api",
      token: "token",

      getBody: jest.fn(() => {
        return Promise.resolve({ result: true });
      }),

      authenticate: jest.fn(() => {
        return Promise.resolve();
      }),

      getContactsByEmail: jest.fn(() => {
        throw new Error("Cant get contacts");
      }),

      updateContact: jest.fn(() => {
        return Promise.resolve();
      }),

      createNewContact: jest.fn(() => {
        return Promise.resolve({
          id: "123",
          firstName: "",
          lastName: "",
          location: "",
          receivesNewsletter: true,
          email: "",
        });
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
      apiPath: "apiPath",
      hostname: "hostname",
      api: "api",
      token: "token",

      getBody: jest.fn(() => {
        return Promise.resolve({ result: true });
      }),

      authenticate: jest.fn(() => {
        return Promise.resolve();
      }),

      getContactsByEmail: jest.fn(() => {
        return Promise.resolve([]);
      }),

      updateContact: jest.fn(() => {
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
      apiPath: "apiPath",
      hostname: "hostname",
      api: "api",
      token: "token",

      getBody: jest.fn(() => {
        return Promise.resolve({ result: true });
      }),

      authenticate: jest.fn(() => {
        return Promise.resolve();
      }),

      getContactsByEmail: jest.fn(() => {
        return Promise.resolve([
          {
            id: "123",
            firstName: "",
            lastName: "",
            location: "",
            email: "",
            receivesNewsletter: false,
          },
        ]);
      }),

      updateContact: jest.fn(() => {
        throw new Error("Failed to opt user in");
      }),

      createNewContact: jest.fn(() => {
        return Promise.resolve({
          id: "123",
          firstName: "",
          lastName: "",
          location: "",
          receivesNewsletter: true,
          email: "",
        });
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

describe("Sign up location", () => {
  test("Sends a sign up location if it is given", async () => {
    const createNewContact = jest.fn(() => {
      return Promise.resolve({
        id: "123",
        firstName: "",
        lastName: "",
        location: "test-location",
        receivesNewsletter: true,
        email: "",
      });
    });

    jest.mocked(SugarService).mockImplementation(() => ({
      apiPath: "apiPath",
      hostname: "hostname",
      api: "api",
      token: "token",

      getBody: jest.fn(() => {
        return Promise.resolve({ result: true });
      }),

      authenticate: jest.fn(() => {
        return Promise.resolve();
      }),

      getContactsByEmail: jest.fn(() => {
        return Promise.resolve([]);
      }),

      updateContact: jest.fn(() => {
        return Promise.resolve();
      }),

      createNewContact,
    }));

    const result = await main({
      __ow_method: "post",
      __ow_path: "",
      email: "user-to-add@email.com",
      location: "test-location",
    });

    expect(result).toEqual({
      statusCode: 200,
      body: '{"message":"Create a new contact for email."}',
    });

    expect(createNewContact).toBeCalledTimes(1);
    expect(createNewContact).toBeCalledWith({
      email: "user-to-add@email.com",
      location: "test-location",
      receivesNewsletter: true,
      firstName: "user-to-add@email.com",
      lastName: "Unknown",
    });
  });

  test("Converts location into slug", async () => {
    const createNewContact = jest.fn(() => {
      return Promise.resolve({
        id: "123",
        firstName: "",
        lastName: "",
        location: "non-slugged-test",
        receivesNewsletter: true,
        email: "",
      });
    });

    jest.mocked(SugarService).mockImplementation(() => ({
      apiPath: "apiPath",
      hostname: "hostname",
      api: "api",
      token: "token",

      getBody: jest.fn(() => {
        return Promise.resolve({ result: true });
      }),

      authenticate: jest.fn(() => {
        return Promise.resolve();
      }),

      getContactsByEmail: jest.fn(() => {
        return Promise.resolve([]);
      }),

      updateContact: jest.fn(() => {
        return Promise.resolve();
      }),

      createNewContact,
    }));

    const result = await main({
      __ow_method: "post",
      __ow_path: "",
      email: "user-to-add@email.com",
      location: "Non Slugged test",
    });

    expect(result).toEqual({
      statusCode: 200,
      body: '{"message":"Create a new contact for email."}',
    });

    expect(createNewContact).toBeCalledTimes(1);
    expect(createNewContact).toBeCalledWith({
      email: "user-to-add@email.com",
      location: "non-slugged-test",
      firstName: "user-to-add@email.com",
      lastName: "Unknown",
      receivesNewsletter: true,
    });
  });

  test("Ignores an empty sign up location", async () => {
    const createNewContact = jest.fn(() => {
      return Promise.resolve({
        id: "123",
        firstName: "",
        lastName: "",
        location: "",
        receivesNewsletter: true,
        email: "",
      });
    });

    jest.mocked(SugarService).mockImplementation(() => ({
      apiPath: "apiPath",
      hostname: "hostname",
      api: "api",
      token: "token",

      getBody: jest.fn(() => {
        return Promise.resolve({ result: true });
      }),

      authenticate: jest.fn(() => {
        return Promise.resolve();
      }),

      getContactsByEmail: jest.fn(() => {
        return Promise.resolve([]);
      }),

      updateContact: jest.fn(() => {
        return Promise.resolve();
      }),

      createNewContact,
    }));

    const result = await main({
      __ow_method: "post",
      __ow_path: "",
      email: "user-to-add@email.com",
      location: "",
    });

    expect(result).toEqual({
      statusCode: 200,
      body: '{"message":"Create a new contact for email."}',
    });

    expect(createNewContact).toBeCalledTimes(1);
    expect(createNewContact).toBeCalledWith({
      email: "user-to-add@email.com",
      firstName: "user-to-add@email.com",
      lastName: "Unknown",
      receivesNewsletter: true,
    });
  });

  test("Overwrites an empty location", async () => {
    const updateContact = jest.fn(() => {
      return Promise.resolve();
    });

    jest.mocked(SugarService).mockImplementation(() => ({
      apiPath: "apiPath",
      hostname: "hostname",
      api: "api",
      token: "token",

      getBody: jest.fn(() => {
        return Promise.resolve({ result: true });
      }),

      authenticate: jest.fn(() => {
        return Promise.resolve();
      }),

      getContactsByEmail: jest.fn(() => {
        return Promise.resolve([
          {
            id: "123",
            firstName: "",
            lastName: "",
            location: "",
            receivesNewsletter: true,
            email: "",
          },
        ]);
      }),

      updateContact,

      createNewContact: jest.fn(() => {
        return Promise.resolve({
          id: "123",
          firstName: "",
          lastName: "",
          location: "",
          receivesNewsletter: true,
          email: "",
        });
      }),
    }));

    const result = await main({
      __ow_method: "post",
      __ow_path: "",
      email: "user-to-add@email.com",
      location: "overwrite",
    });

    expect(result).toEqual({
      statusCode: 200,
      body: '{"message":"Updated 1 existing contact"}',
    });

    expect(updateContact).toBeCalledTimes(1);
    expect(updateContact).toBeCalledWith({
      id: "123",
      location: "overwrite",
      receivesNewsletter: true,
    });
  });

  test("Leaves an existing location", async () => {
    const updateContact = jest.fn(() => {
      return Promise.resolve();
    });

    jest.mocked(SugarService).mockImplementation(() => ({
      apiPath: "apiPath",
      hostname: "hostname",
      api: "api",
      token: "token",

      getBody: jest.fn(() => {
        return Promise.resolve({ result: true });
      }),

      authenticate: jest.fn(() => {
        return Promise.resolve();
      }),

      getContactsByEmail: jest.fn(() => {
        return Promise.resolve([
          {
            id: "123",
            firstName: "",
            lastName: "",
            location: "existing-location",
            receivesNewsletter: true,
            email: "",
          },
        ]);
      }),

      updateContact,

      createNewContact: jest.fn(() => {
        return Promise.resolve({
          id: "123",
          firstName: "",
          lastName: "",
          location: "",
          receivesNewsletter: true,
          email: "",
        });
      }),
    }));

    const result = await main({
      __ow_method: "post",
      __ow_path: "",
      email: "user-to-add@email.com",
      location: "overwrite",
    });

    expect(result).toEqual({
      statusCode: 200,
      body: '{"message":"Updated 1 existing contact"}',
    });

    expect(updateContact).toBeCalledTimes(1);
    expect(updateContact).toBeCalledWith({
      id: "123",
      receivesNewsletter: true,
    });
  });
});

describe("Names", () => {
  test("Ignores names if a name already exists", async () => {
    const updateContact = jest.fn(() => {
      return Promise.resolve();
    });

    jest.mocked(SugarService).mockImplementation(() => ({
      apiPath: "apiPath",
      hostname: "hostname",
      api: "api",
      token: "token",

      getBody: jest.fn(() => {
        return Promise.resolve({ result: true });
      }),

      authenticate: jest.fn(() => {
        return Promise.resolve();
      }),

      getContactsByEmail: jest.fn(() => {
        return Promise.resolve([
          {
            id: "123",
            firstName: "Gavin",
            lastName: "Henderson",
            location: "",
            receivesNewsletter: true,
            email: "",
          },
        ]);
      }),

      updateContact,

      createNewContact: jest.fn(() => {
        return Promise.resolve({
          id: "123",
          firstName: "realName",
          lastName: "realName",
          location: "",
          receivesNewsletter: true,
          email: "",
        });
      }),
    }));

    const result = await main({
      __ow_method: "post",
      __ow_path: "",
      email: "user-to-add@email.com",
      firstname: "NewFirst",
      lastname: "NewLast",
    });

    expect(result).toEqual({
      statusCode: 200,
      body: '{"message":"Updated 1 existing contact"}',
    });

    expect(updateContact).toBeCalledTimes(1);
    expect(updateContact).toBeCalledWith({
      id: "123",
      receivesNewsletter: true,
    });
  });

  test("Only updates last name if its previously 'unknown'", async () => {
    const updateContact = jest.fn(() => {
      return Promise.resolve();
    });

    jest.mocked(SugarService).mockImplementation(() => ({
      apiPath: "apiPath",
      hostname: "hostname",
      api: "api",
      token: "token",

      getBody: jest.fn(() => {
        return Promise.resolve({ result: true });
      }),

      authenticate: jest.fn(() => {
        return Promise.resolve();
      }),

      getContactsByEmail: jest.fn(() => {
        return Promise.resolve([
          {
            id: "123",
            firstName: "Gavin",
            lastName: "Unknown",
            location: "",
            receivesNewsletter: true,
            email: "",
          },
        ]);
      }),

      updateContact,

      createNewContact: jest.fn(() => {
        return Promise.resolve({
          id: "123",
          firstName: "realName",
          lastName: "realName",
          location: "",
          receivesNewsletter: true,
          email: "",
        });
      }),
    }));

    const result = await main({
      __ow_method: "post",
      __ow_path: "",
      email: "user-to-add@email.com",
      lastname: "NewLast",
    });

    expect(result).toEqual({
      statusCode: 200,
      body: '{"message":"Updated 1 existing contact"}',
    });

    expect(updateContact).toBeCalledTimes(1);
    expect(updateContact).toBeCalledWith({
      id: "123",
      receivesNewsletter: true,
      lastName: "NewLast",
    });
  });

  test("Only updates first name if its previously matches the email", async () => {
    const updateContact = jest.fn(() => {
      return Promise.resolve();
    });

    jest.mocked(SugarService).mockImplementation(() => ({
      apiPath: "apiPath",
      hostname: "hostname",
      api: "api",
      token: "token",

      getBody: jest.fn(() => {
        return Promise.resolve({ result: true });
      }),

      authenticate: jest.fn(() => {
        return Promise.resolve();
      }),

      getContactsByEmail: jest.fn(() => {
        return Promise.resolve([
          {
            id: "123",
            firstName: "user-to-add@email.com",
            lastName: "Henderson",
            location: "",
            receivesNewsletter: true,
            email: "user-to-add@email.com",
          },
        ]);
      }),

      updateContact,

      createNewContact: jest.fn(() => {
        return Promise.resolve({
          id: "123",
          firstName: "realName",
          lastName: "realName",
          location: "",
          receivesNewsletter: true,
          email: "",
        });
      }),
    }));

    const result = await main({
      __ow_method: "post",
      __ow_path: "",
      email: "user-to-add@email.com",
      firstname: "NewFirst",
    });

    expect(result).toEqual({
      statusCode: 200,
      body: '{"message":"Updated 1 existing contact"}',
    });

    expect(updateContact).toBeCalledTimes(1);
    expect(updateContact).toBeCalledWith({
      id: "123",
      receivesNewsletter: true,
      firstName: "NewFirst",
    });
  });

  test("Update both names", async () => {
    const updateContact = jest.fn(() => {
      return Promise.resolve();
    });

    jest.mocked(SugarService).mockImplementation(() => ({
      apiPath: "apiPath",
      hostname: "hostname",
      api: "api",
      token: "token",

      getBody: jest.fn(() => {
        return Promise.resolve({ result: true });
      }),

      authenticate: jest.fn(() => {
        return Promise.resolve();
      }),

      getContactsByEmail: jest.fn(() => {
        return Promise.resolve([
          {
            id: "123",
            firstName: "user-to-add@email.com",
            lastName: "Unknown",
            location: "",
            receivesNewsletter: true,
            email: "user-to-add@email.com",
          },
        ]);
      }),

      updateContact,

      createNewContact: jest.fn(() => {
        return Promise.resolve({
          id: "123",
          firstName: "realName",
          lastName: "realName",
          location: "",
          receivesNewsletter: true,
          email: "",
        });
      }),
    }));

    const result = await main({
      __ow_method: "post",
      __ow_path: "",
      email: "user-to-add@email.com",
      firstname: "NewFirst",
      lastname: "NewLast",
    });

    expect(result).toEqual({
      statusCode: 200,
      body: '{"message":"Updated 1 existing contact"}',
    });

    expect(updateContact).toBeCalledTimes(1);
    expect(updateContact).toBeCalledWith({
      id: "123",
      receivesNewsletter: true,
      firstName: "NewFirst",
      lastName: "NewLast",
    });
  });

  test("Generate names", async () => {
    const createNewContact = jest.fn(() => {
      return Promise.resolve({
        id: "123",
        firstName: "realName",
        lastName: "realName",
        location: "",
        receivesNewsletter: true,
        email: "",
      });
    });

    jest.mocked(SugarService).mockImplementation(() => ({
      apiPath: "apiPath",
      hostname: "hostname",
      api: "api",
      token: "token",

      getBody: jest.fn(() => {
        return Promise.resolve({ result: true });
      }),

      authenticate: jest.fn(() => {
        return Promise.resolve();
      }),

      getContactsByEmail: jest.fn(() => {
        return Promise.resolve([]);
      }),

      updateContact: jest.fn(() => {
        return Promise.resolve();
      }),

      createNewContact,
    }));

    const result = await main({
      __ow_method: "post",
      __ow_path: "",
      email: "user-to-add@email.com",
    });

    expect(result).toEqual({
      statusCode: 200,
      body: '{"message":"Create a new contact for email."}',
    });

    expect(createNewContact).toBeCalledTimes(1);
    expect(createNewContact).toBeCalledWith({
      email: "user-to-add@email.com",
      receivesNewsletter: true,
      firstName: "user-to-add@email.com",
      lastName: "Unknown",
    });
  });

  test("Use given names", async () => {
    const createNewContact = jest.fn(() => {
      return Promise.resolve({
        id: "123",
        firstName: "realName",
        lastName: "realName",
        location: "",
        receivesNewsletter: true,
        email: "",
      });
    });

    jest.mocked(SugarService).mockImplementation(() => ({
      apiPath: "apiPath",
      hostname: "hostname",
      api: "api",
      token: "token",

      getBody: jest.fn(() => {
        return Promise.resolve({ result: true });
      }),

      authenticate: jest.fn(() => {
        return Promise.resolve();
      }),

      getContactsByEmail: jest.fn(() => {
        return Promise.resolve([]);
      }),

      updateContact: jest.fn(() => {
        return Promise.resolve();
      }),

      createNewContact,
    }));

    const result = await main({
      __ow_method: "post",
      __ow_path: "",
      email: "user-to-add@email.com",
      firstname: "Gavin",
      lastname: "Henderson",
    });

    expect(result).toEqual({
      statusCode: 200,
      body: '{"message":"Create a new contact for email."}',
    });

    expect(createNewContact).toBeCalledTimes(1);
    expect(createNewContact).toBeCalledWith({
      email: "user-to-add@email.com",
      receivesNewsletter: true,
      firstName: "Gavin",
      lastName: "Henderson",
    });
  });
});
