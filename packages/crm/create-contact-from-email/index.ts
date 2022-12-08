import { NewContact, SugarService, UpdateContact } from "./sugar-service";

type GenericHandlerOptions = {
  __ow_method?: string;
  __ow_path?: string;
  __ow_headers?: {};
};

type GenericHandlerResult = {
  statusCode?: number;
  body?: string;
};

const ALLOWED_PATHS = ["", "/"];

type CreateContactHandlerOptions = {
  email?: string;
  location?: string;
  firstName?: string;
  lastName?: string;
} & GenericHandlerOptions;

type CreateContactHandlerResult = {} & GenericHandlerResult;

const slugify = (input: string): string =>
  input
    .toLowerCase()
    .split(" ")
    .map((x) => x.trim())
    .join("-");

export const handler = async (
  handlerOptions: CreateContactHandlerOptions
): Promise<CreateContactHandlerResult> => {
  console.log("====== INPUT =======");
  console.log({ handlerOptions });
  console.log("");

  if (
    handlerOptions.__ow_method === undefined ||
    handlerOptions.__ow_method.toLowerCase() !== "post"
  ) {
    return {
      statusCode: 404,
      body: JSON.stringify({ reason: "Endpoint only accepts POST requests" }),
    };
  }

  if (
    handlerOptions.__ow_path === undefined ||
    !ALLOWED_PATHS.includes(handlerOptions.__ow_path)
  ) {
    return {
      statusCode: 404,
      body: JSON.stringify({ reason: "Endpoint only accepts requests to /" }),
    };
  }

  if (!handlerOptions.email) {
    return {
      statusCode: 400,
      body: JSON.stringify({ reason: "No email provided" }),
    };
  }

  const crmService = new SugarService();

  try {
    await crmService.authenticate();
  } catch (error) {
    console.log("An error occurred whilst authenticating to SugarCRM");
    console.log(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ reason: "Failed to authenticate to SugarCRM." }),
    };
  }

  let listOfExistingContacts = [];
  try {
    listOfExistingContacts = await crmService.getContactsByEmail(
      handlerOptions.email
    );
  } catch (error) {
    console.log("An error occurred whilst trying to get contacts by email");
    console.log(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ reason: "Failed to get contacts by email." }),
    };
  }

  if (listOfExistingContacts.length === 0) {
    console.log("No existing contacts found for:", handlerOptions.email);

    try {
      let unsavedContact: NewContact = {
        email: handlerOptions.email,
        receivesNewsletter: true,
        firstName: handlerOptions.email,
        lastName: "Unknown",
      };

      if (handlerOptions.location) {
        unsavedContact.location = slugify(handlerOptions.location);
      }

      if (handlerOptions.firstName) {
        unsavedContact.firstName = handlerOptions.firstName;
      }

      if (handlerOptions.lastName) {
        unsavedContact.lastName = handlerOptions.lastName;
      }

      const newContact = await crmService.createNewContact(unsavedContact);
      console.log("Successfully created new contact", newContact.id);
    } catch (error) {
      console.log(
        `An error occurred whilst trying to create a new contact for: ${handlerOptions.email}`
      );
      console.log(error);
      return {
        statusCode: 500,
        body: JSON.stringify({ reason: "Failed to create a new contact." }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Create a new contact for email." }),
    };
  } else {
    console.log(
      `Found ${listOfExistingContacts.length} contact(s) for email ${handlerOptions.email}`
    );

    for (const currentContact of listOfExistingContacts) {
      console.log("Opting into mailing for contact:", currentContact.id);

      try {
        let updateContact: UpdateContact = {
          id: currentContact.id,
          receivesNewsletter: true,
        };

        if (!!currentContact.location == false && handlerOptions.location) {
          updateContact.location = slugify(handlerOptions.location);
        }

        if (
          currentContact.lastName.toLowerCase() === "unknown" &&
          handlerOptions.lastName
        ) {
          updateContact.lastName = handlerOptions.lastName;
        }

        if (
          currentContact.firstName.toLowerCase() ===
            currentContact.email.toLowerCase() &&
          handlerOptions.firstName
        ) {
          updateContact.firstName = handlerOptions.firstName;
        }

        await crmService.updateContact(updateContact);
      } catch (error) {
        console.log(
          `An error occurred whilst trying to opt ${currentContact.id} into mailing`
        );
        console.log(error);
        return {
          statusCode: 500,
          body: JSON.stringify({ reason: "Failed to opt user into mailing." }),
        };
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Updated ${listOfExistingContacts.length} existing contact`,
      }),
    };
  }
};

export const main = handler;
