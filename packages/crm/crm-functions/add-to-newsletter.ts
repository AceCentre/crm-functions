import { Logger } from "./logger";
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
  tags?: Array<{ name: string }>;
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

  if (input.tags && Array.isArray(input.tags)) {
    validInput.tags = input.tags;
  }

  return {
    validatedInput: validInput,
    valid: true,
  };
};

export const addToNewsletter = async (
  handlerInput: HandlerInput,
  crmService: SugarService,
  logger: Logger
): Promise<HandlerResult> => {
  const { validatedInput, valid, reason } = validateInput(handlerInput);

  if (!valid || !validateInput) {
    return {
      statusCode: 500,
      body: JSON.stringify({ reason: reason }),
    };
  }

  try {
    await crmService.authenticate();
  } catch (error) {
    logger.error("An error occurred whilst authenticating to SugarCRM", error);

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
    logger.error(
      "An error occurred whilst trying to get contacts by email",
      error
    );

    return {
      statusCode: 500,
      body: JSON.stringify({ reason: "Failed to get contacts by email." }),
    };
  }

  if (listOfExistingContacts.length === 0) {
    try {
      let unsavedContact: NewContact = {
        email: validatedInput.email,
        receivesNewsletter: true,
        firstName: validatedInput.email,
        lastName: "Unknown",
      };

      if (validatedInput.tags) {
        unsavedContact.tags = validatedInput.tags;
      }

      if (validatedInput.location) {
        unsavedContact.location = slugify(validatedInput.location);
      }

      if (validatedInput.firstName) {
        unsavedContact.firstName = validatedInput.firstName;
      }

      if (validatedInput.lastName) {
        unsavedContact.lastName = validatedInput.lastName;
      }

      await crmService.createNewContact(unsavedContact);
    } catch (error) {
      logger.error(
        `An error occurred whilst trying to create a new contact for: ${validatedInput.email}`,
        error
      );

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
    for (const currentContact of listOfExistingContacts) {
      try {
        let updateContact: UpdateContact = {
          id: currentContact.id,
          receivesNewsletter: true,
        };

        if (
          validatedInput.tags !== undefined &&
          currentContact.tags !== undefined
        ) {
          updateContact.tags = [...currentContact.tags, ...validatedInput.tags];
        } else if (validatedInput.tags !== undefined) {
          updateContact.tags = validatedInput.tags;
        }

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
        logger.error(
          `An error occurred whilst trying to opt ${currentContact.id} into mailing`,
          error
        );

        return {
          statusCode: 500,
          body: JSON.stringify({ reason: "Failed to opt user into mailing." }),
        };
      }
    }

    if (validatedInput.location === "arlo") {
      return {
        statusCode: 302,
        headers: {
          Location: "https://acecentre.arlo.co",
        },
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Updated ${listOfExistingContacts.length} existing contact`,
      }),
    };
  }
};
