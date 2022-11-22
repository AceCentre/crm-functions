import { SugarService } from "./sugar-service";

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
} & GenericHandlerOptions;

type CreateContactHandlerResult = {} & GenericHandlerResult;

export const handler = async (
  handlerOptions: CreateContactHandlerOptions
): Promise<CreateContactHandlerResult> => {
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
      const newContact = await crmService.createNewContact(
        handlerOptions.email
      );
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
        await crmService.optInToMailing(currentContact);
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

  return {
    statusCode: 500,
    body: JSON.stringify({ reason: "An error occurred" }),
  };
};

export const main = handler;
