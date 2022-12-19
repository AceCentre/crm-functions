import { addToCourse } from "../add-to-course";
import { Logger } from "../logger";

describe("addToCourse", () => {
  test("Email is required", async () => {
    const logger = new Logger();
    const crmService = {
      logger,
      apiPath: "apiPath",
      hostname: "hostname",
      api: "api",
      token: "token",
      username: "fake",
      password: "fake",

      createEventAttendance: jest.fn(),
      getEventAttendances: jest.fn(),
      getAllEvents: jest.fn(),

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
    };

    const result = await addToCourse({ email: undefined }, crmService, logger);

    expect(result.statusCode).toBe(500);
    expect(result.body).toBe('{"reason":"No email provided"}');
  });

  test("Course name is required", async () => {
    const logger = new Logger();
    const crmService = {
      logger,
      apiPath: "apiPath",
      hostname: "hostname",
      api: "api",
      token: "token",
      username: "fake",
      password: "fake",

      createEventAttendance: jest.fn(),
      getEventAttendances: jest.fn(),
      getAllEvents: jest.fn(),

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
    };

    const result = await addToCourse(
      { email: "email@email.com", eventSlug: undefined },
      crmService,
      logger
    );

    expect(result.statusCode).toBe(500);
    expect(result.body).toBe('{"reason":"No eventSlug provided"}');
  });

  test("Returns an error if the CRM can't authenticate", async () => {
    const logger = new Logger();
    const crmService = {
      logger,
      apiPath: "apiPath",
      hostname: "hostname",
      api: "api",
      token: "token",
      username: "fake",
      password: "fake",

      createEventAttendance: jest.fn(),
      getEventAttendances: jest.fn(),
      getAllEvents: jest.fn(),

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
    };

    const result = await addToCourse(
      { email: "email@email.com", eventSlug: "new-product" },
      crmService,
      logger
    );

    expect(result.statusCode).toBe(500);
    expect(result.body).toBe(
      '{"reason":"Failed to authenticate to SugarCRM."}'
    );
  });

  test("Returns an error if the CRM can't return events", async () => {
    const logger = new Logger();
    const crmService = {
      logger,
      apiPath: "apiPath",
      hostname: "hostname",
      api: "api",
      token: "token",
      username: "fake",
      password: "fake",

      createEventAttendance: jest.fn(),
      getEventAttendances: jest.fn(),
      getAllEvents: jest.fn(() => {
        throw new Error("An error occurred");
      }),

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
        return Promise.resolve({
          id: "123",
          firstName: "",
          lastName: "",
          location: "",
          receivesNewsletter: true,
          email: "",
        });
      }),
    };

    const result = await addToCourse(
      { email: "email@email.com", eventSlug: "new-product" },
      crmService,
      logger
    );

    expect(result.statusCode).toBe(500);
    expect(result.body).toBe('{"reason":"Failed to get a list of events"}');
  });

  test("Returns an error if there are too many matching events", async () => {
    const logger = new Logger();
    const crmService = {
      logger,
      apiPath: "apiPath",
      hostname: "hostname",
      api: "api",
      token: "token",
      username: "fake",
      password: "fake",

      createEventAttendance: jest.fn(),
      getEventAttendances: jest.fn(),
      getAllEvents: jest.fn(() => {
        return Promise.resolve([
          { id: "1", webpage: "new-product", name: "Event" },
          { id: "2", webpage: "new-product", name: "Event 2" },
        ]);
      }),

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
        return Promise.resolve({
          id: "123",
          firstName: "",
          lastName: "",
          location: "",
          receivesNewsletter: true,
          email: "",
        });
      }),
    };

    const result = await addToCourse(
      { email: "email@email.com", eventSlug: "new-product" },
      crmService,
      logger
    );

    expect(result.statusCode).toBe(404);
    expect(result.body).toBe(
      '{"reason":"You gave an an event slug tht we couldn\'t find or found too many events for (2)"}'
    );
  });

  test("Returns an error if there are too few matching events", async () => {
    const logger = new Logger();
    const crmService = {
      logger,
      apiPath: "apiPath",
      hostname: "hostname",
      api: "api",
      token: "token",
      username: "fake",
      password: "fake",

      createEventAttendance: jest.fn(),
      getEventAttendances: jest.fn(),
      getAllEvents: jest.fn(() => {
        return Promise.resolve([]);
      }),

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
        return Promise.resolve({
          id: "123",
          firstName: "",
          lastName: "",
          location: "",
          receivesNewsletter: true,
          email: "",
        });
      }),
    };

    const result = await addToCourse(
      { email: "email@email.com", eventSlug: "new-product" },
      crmService,
      logger
    );

    expect(result.statusCode).toBe(404);
    expect(result.body).toBe(
      '{"reason":"You gave an an event slug tht we couldn\'t find or found too many events for (0)"}'
    );
  });

  test("Returns an error if it cannot get the contacts", async () => {
    const logger = new Logger();
    const crmService = {
      logger,
      apiPath: "apiPath",
      hostname: "hostname",
      api: "api",
      token: "token",
      username: "fake",
      password: "fake",

      createEventAttendance: jest.fn(),
      getEventAttendances: jest.fn(),
      getAllEvents: jest.fn(() => {
        return Promise.resolve([
          { id: "123", name: "Event", webpage: "new-product" },
        ]);
      }),

      getBody: jest.fn(() => {
        return Promise.resolve({ result: true });
      }),

      authenticate: jest.fn(() => {
        return Promise.resolve();
      }),

      getContactsByEmail: jest.fn(() => {
        throw new Error("Uh oh");
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
    };

    const result = await addToCourse(
      { email: "email@email.com", eventSlug: "new-product" },
      crmService,
      logger
    );

    expect(result.statusCode).toBe(500);
    expect(result.body).toBe('{"reason":"Failed to get contacts by email."}');
  });

  test("Returns an error if there are too many contacts", async () => {
    const logger = new Logger();
    const crmService = {
      logger,
      apiPath: "apiPath",
      hostname: "hostname",
      api: "api",
      token: "token",
      username: "fake",
      password: "fake",

      createEventAttendance: jest.fn(),
      getEventAttendances: jest.fn(),
      getAllEvents: jest.fn(() => {
        return Promise.resolve([
          { id: "123", name: "Event", webpage: "new-product" },
        ]);
      }),

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
            location: "location",
            firstName: "name",
            lastName: "name",
            email: "email@email.com",
            receivesNewsletter: true,
          },
          {
            id: "124",
            location: "location",
            firstName: "name",
            lastName: "name",
            email: "email@email.com",
            receivesNewsletter: true,
          },
        ]);
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
    };

    const result = await addToCourse(
      { email: "email@email.com", eventSlug: "new-product" },
      crmService,
      logger
    );

    expect(result.statusCode).toBe(500);
    expect(result.body).toBe(
      '{"reason":"There are too many (2) contacts for the email address: email@email.com"}'
    );
  });

  test("Returns an error if it can't create a contact", async () => {
    const logger = new Logger();
    const crmService = {
      logger,
      apiPath: "apiPath",
      hostname: "hostname",
      api: "api",
      token: "token",
      username: "fake",
      password: "fake",

      createEventAttendance: jest.fn(),
      getEventAttendances: jest.fn(),
      getAllEvents: jest.fn(() => {
        return Promise.resolve([
          { id: "123", name: "Event", webpage: "new-product" },
        ]);
      }),

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
        throw new Error("Uh oh");
      }),
    };

    const result = await addToCourse(
      { email: "email@email.com", eventSlug: "new-product" },
      crmService,
      logger
    );

    expect(result.statusCode).toBe(500);
    expect(result.body).toBe('{"reason":"Failed to create a new contact."}');
  });

  test("Returns an error if the event attendance already exists", async () => {
    const logger = new Logger();
    const crmService = {
      logger,
      apiPath: "apiPath",
      hostname: "hostname",
      api: "api",
      token: "token",
      username: "fake",
      password: "fake",

      createEventAttendance: jest.fn(),
      getEventAttendances: jest.fn(() => {
        return Promise.resolve([{ id: "123", name: "name" }]);
      }),
      getAllEvents: jest.fn(() => {
        return Promise.resolve([
          { id: "123", name: "Event", webpage: "new-product" },
        ]);
      }),

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
    };

    const result = await addToCourse(
      { email: "email@email.com", eventSlug: "new-product" },
      crmService,
      logger
    );

    expect(result.statusCode).toBe(500);
    expect(result.body).toBe(
      '{"reason":"There should be no existing event attendances for the contact and course"}'
    );
  });

  test("Returns an error if it cannot create the event attendance", async () => {
    const logger = new Logger();
    const crmService = {
      logger,
      apiPath: "apiPath",
      hostname: "hostname",
      api: "api",
      token: "token",
      username: "fake",
      password: "fake",

      createEventAttendance: jest.fn(() => {
        throw new Error("uh oh");
      }),
      getEventAttendances: jest.fn(() => {
        return Promise.resolve([]);
      }),
      getAllEvents: jest.fn(() => {
        return Promise.resolve([
          { id: "123", name: "Event", webpage: "new-product" },
        ]);
      }),

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
    };

    const result = await addToCourse(
      { email: "email@email.com", eventSlug: "new-product" },
      crmService,
      logger
    );

    expect(result.statusCode).toBe(500);
    expect(result.body).toBe('{"reason":"Failed to create event attendance"}');
  });

  test("Creates a new contact if one doesn't exist and create event attendance", async () => {
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

    const logger = new Logger();
    const crmService = {
      logger,
      apiPath: "apiPath",
      hostname: "hostname",
      api: "api",
      token: "token",
      username: "fake",
      password: "fake",

      createEventAttendance: jest.fn(() => {
        return Promise.resolve({ id: "123", name: "123" });
      }),
      getEventAttendances: jest.fn(() => {
        return Promise.resolve([]);
      }),
      getAllEvents: jest.fn(() => {
        return Promise.resolve([
          { id: "123", name: "Event", webpage: "new-product" },
        ]);
      }),

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
    };

    const result = await addToCourse(
      { email: "email@email.com", eventSlug: "new-product" },
      crmService,
      logger
    );

    expect(createNewContact).toBeCalledTimes(1);
    expect(createNewContact).toBeCalledWith({
      email: "email@email.com",
      firstName: "email@email.com",
      lastName: "Unknown",
      location: "add-to-course",
      receivesNewsletter: false,
    });
    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(
      '{"message":"Successfully created a new event attendance"}'
    );
  });

  test("Create event attendance with existing contact", async () => {
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

    const createEventAttendance = jest.fn(() => {
      return Promise.resolve({ id: "123", name: "123" });
    });

    const logger = new Logger();
    const crmService = {
      logger,
      apiPath: "apiPath",
      hostname: "hostname",
      api: "api",
      token: "token",
      username: "fake",
      password: "fake",

      createEventAttendance,
      getEventAttendances: jest.fn(() => {
        return Promise.resolve([]);
      }),
      getAllEvents: jest.fn(() => {
        return Promise.resolve([
          { id: "123", name: "Event", webpage: "new-product" },
        ]);
      }),

      getBody: jest.fn(() => {
        return Promise.resolve({ result: true });
      }),

      authenticate: jest.fn(() => {
        return Promise.resolve();
      }),

      getContactsByEmail: jest.fn(() => {
        return Promise.resolve([
          {
            id: "existing-event",
            firstName: "",
            lastName: "",
            location: "",
            receivesNewsletter: true,
            email: "",
          },
        ]);
      }),

      updateContact: jest.fn(() => {
        return Promise.resolve();
      }),

      createNewContact,
    };

    const result = await addToCourse(
      { email: "email@email.com", eventSlug: "new-product" },
      crmService,
      logger
    );

    expect(createNewContact).toBeCalledTimes(0);
    expect(createEventAttendance).toBeCalledTimes(1);
    expect(createEventAttendance).toBeCalledWith(
      { id: "123", name: "Event", webpage: "new-product" },
      {
        email: "",
        firstName: "",
        id: "existing-event",
        lastName: "",
        location: "",
        receivesNewsletter: true,
      }
    );
    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(
      '{"message":"Successfully created a new event attendance"}'
    );
  });

  test("Uses first and last name in new contact", async () => {
    const createNewContact = jest.fn(() => {
      return Promise.resolve({
        id: "123",
        firstName: "First Name",
        lastName: "Last Name",
        location: "",
        receivesNewsletter: true,
        email: "",
      });
    });

    const logger = new Logger();
    const crmService = {
      logger,
      apiPath: "apiPath",
      hostname: "hostname",
      api: "api",
      token: "token",
      username: "fake",
      password: "fake",

      createEventAttendance: jest.fn(() => {
        return Promise.resolve({ id: "123", name: "123" });
      }),
      getEventAttendances: jest.fn(() => {
        return Promise.resolve([]);
      }),
      getAllEvents: jest.fn(() => {
        return Promise.resolve([
          { id: "123", name: "Event", webpage: "new-product" },
        ]);
      }),

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
    };

    const result = await addToCourse(
      {
        email: "email@email.com",
        eventSlug: "new-product",
        firstName: "First Name",
        lastName: "Last Name",
      },
      crmService,
      logger
    );

    expect(createNewContact).toBeCalledTimes(1);
    expect(createNewContact).toBeCalledWith({
      email: "email@email.com",
      firstName: "First Name",
      lastName: "Last Name",
      location: "add-to-course",
      receivesNewsletter: false,
    });
    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(
      '{"message":"Successfully created a new event attendance"}'
    );
  });
});
