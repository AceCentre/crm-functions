import { SlackService } from "./slack-service";
import { slugify } from "./slugify";
import { SugarService } from "./sugar-service";
import {
  HandlerInput,
  HandlerResult,
  NewContact,
  UpdateContact,
} from "./types";

type AddToNewsletterInput = {
  email: string;
  location?: string;
  firstName?: string;
  lastName?: string;
};

const validateInput = (input: {
  [key: string]: any;
}): {
  validatedInput?: AddToNewsletterInput;
  valid: boolean;
  reason?: string;
} => {
  if (!input.email || typeof input.email !== "string") {
    return { valid: false, reason: "You did not supply an email address" };
  }

  let validInput: AddToNewsletterInput = {
    email: input.email,
  };

  if (input.location && typeof input.location === "string") {
    validInput.location = input.location;
  }

  if (input.firstName && typeof input.firstName === "string") {
    validInput.firstName = input.firstName;
  }

  if (input.lastName && typeof input.lastName === "string") {
    validInput.lastName = input.lastName;
  }

  return {
    validatedInput: validInput,
    valid: true,
  };
};

export const addToNewsletter = async (
  handlerInput: HandlerInput,
  crmService: SugarService,
  slackService: SlackService
): Promise<HandlerResult> => {
  const { validatedInput, valid, reason } = validateInput(handlerInput);

  if (!valid || !validateInput) {
    return {
      statusCode: 500,
      body: JSON.stringify({ reason: reason || "Invalid input given" }),
    };
  }

  try {
    await crmService.authenticate();
  } catch (error) {
    console.log("An error occurred whilst authenticating to SugarCRM");
    console.log(error);

    slackService.sendError(
      "An error occurred whilst authenticating to SugarCRM"
    );

    return {
      statusCode: 500,
      body: JSON.stringify({ reason: "Failed to authenticate to SugarCRM." }),
    };
  }

  let listOfExistingContacts = [];
  try {
    listOfExistingContacts = await crmService.getContactsByEmail(
      validatedInput.email
    );
  } catch (error) {
    console.log("An error occurred whilst trying to get contacts by email");

    slackService.sendError(
      "An error occurred whilst trying to get contacts by email"
    );

    console.log(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ reason: "Failed to get contacts by email." }),
    };
  }

  if (listOfExistingContacts.length === 0) {
    console.log("No existing contacts found for:", validatedInput.email);

    try {
      let unsavedContact: NewContact = {
        email: validatedInput.email,
        receivesNewsletter: true,
        firstName: validatedInput.email,
        lastName: "Unknown",
      };

      if (validatedInput.location) {
        unsavedContact.location = slugify(validatedInput.location);
      }

      if (validatedInput.firstName) {
        unsavedContact.firstName = validatedInput.firstName;
      }

      if (validatedInput.lastName) {
        unsavedContact.lastName = validatedInput.lastName;
      }

      const newContact = await crmService.createNewContact(unsavedContact);
      console.log("Successfully created new contact", newContact.id);
    } catch (error) {
      console.log(
        `An error occurred whilst trying to create a new contact for: ${validatedInput.email}`
      );
      slackService.sendError(
        `An error occurred whilst trying to create a new contact for: ${validatedInput.email}`
      );
      console.log(error);
      return {
        statusCode: 500,
        body: JSON.stringify({ reason: "Failed to create a new contact." }),
      };
    }

    slackService.sendSuccess(`Create a new contact for email.`);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Create a new contact for email." }),
    };
  } else {
    console.log(
      `Found ${listOfExistingContacts.length} contact(s) for email ${validatedInput.email}`
    );

    for (const currentContact of listOfExistingContacts) {
      console.log("Opting into mailing for contact:", currentContact.id);

      try {
        let updateContact: UpdateContact = {
          id: currentContact.id,
          receivesNewsletter: true,
        };

        if (!!currentContact.location == false && validatedInput.location) {
          updateContact.location = slugify(validatedInput.location);
        }

        if (
          currentContact.lastName.toLowerCase() === "unknown" &&
          validatedInput.lastName
        ) {
          updateContact.lastName = validatedInput.lastName;
        }

        if (
          currentContact.firstName.toLowerCase() ===
            currentContact.email.toLowerCase() &&
          validatedInput.firstName
        ) {
          updateContact.firstName = validatedInput.firstName;
        }

        await crmService.updateContact(updateContact);
      } catch (error) {
        console.log(
          `An error occurred whilst trying to opt ${currentContact.id} into mailing`
        );

        slackService.sendError(
          `An error occurred whilst trying to opt ${currentContact.id} into mailing`
        );
        console.log(error);
        return {
          statusCode: 500,
          body: JSON.stringify({ reason: "Failed to opt user into mailing." }),
        };
      }
    }

    slackService.sendSuccess(
      `Updated ${listOfExistingContacts.length} existing contact`
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Updated ${listOfExistingContacts.length} existing contact`,
      }),
    };
  }
};
