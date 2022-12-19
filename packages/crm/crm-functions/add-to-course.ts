import { SlackService } from "./slack-service";
import { SugarService } from "./sugar-service";
import {
  Contact,
  HandlerInput,
  HandlerResult,
  NewContact,
  SugarEvent,
} from "./types";

type AddToCourseInput = {
  email: string;
  eventSlug: string;
  firstName?: string;
  lastName?: string;
};

const validateInput = (input: {
  [key: string]: any;
}): {
  validatedInput?: AddToCourseInput;
  valid: boolean;
  reason?: string;
} => {
  if (!input || typeof input.email !== "string") {
    return { valid: false, reason: "No email provided" };
  }

  if (!input || typeof input.eventSlug !== "string") {
    return { valid: false, reason: "No eventSlug provided" };
  }

  const validInput: AddToCourseInput = {
    email: input.email,
    eventSlug: input.eventSlug,
  };

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

export const addToCourse = async (
  handlerInput: HandlerInput,
  crmService: SugarService,
  slackService: SlackService
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

  // Get all the events
  let events: SugarEvent[] = [];
  try {
    events = await crmService.getAllEvents();
  } catch (error) {
    console.log(
      "An error occurred whilst trying to get all the events from CRM"
    );
    slackService.sendError(
      "An error occurred whilst trying to get all events."
    );
    console.log(error);

    return {
      statusCode: 500,
      body: JSON.stringify({ reason: "Failed to get a list of events" }),
    };
  }

  // Find the event that was purchased
  const matchingEvents = events.filter((event: SugarEvent) =>
    event.webpage.toLowerCase().includes(validatedInput.eventSlug.toLowerCase())
  );

  if (matchingEvents.length !== 1) {
    slackService.sendError(
      `You gave an an event slug tht we couldn't find or found too many events for (${matchingEvents.length})`
    );

    return {
      statusCode: 404,
      body: JSON.stringify({
        reason: `You gave an an event slug tht we couldn't find or found too many events for (${matchingEvents.length})`,
      }),
    };
  }

  const event = matchingEvents[0];

  // Get all contacts
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

  // Bail if there are multiple contacts
  if (listOfExistingContacts.length > 1) {
    console.log(
      `There are too many (${listOfExistingContacts.length}) contacts for the email address: ${validatedInput.email}`
    );

    slackService.sendError(
      `There are too many (${listOfExistingContacts.length}) contacts for the email address: ${validatedInput.email}`
    );

    return {
      statusCode: 500,
      body: JSON.stringify({
        reason: `There are too many (${listOfExistingContacts.length}) contacts for the email address: ${validatedInput.email}`,
      }),
    };
  }

  // Create a contact if it doesn't exist or use existing contact
  let contact: Contact;
  if (listOfExistingContacts.length === 1) {
    contact = listOfExistingContacts[0];
  } else {
    try {
      let unsavedContact: NewContact = {
        email: validatedInput.email,
        location: "add-to-course",
        receivesNewsletter: false,
        firstName: validatedInput.email,
        lastName: "Unknown",
      };

      if (validatedInput.firstName) {
        unsavedContact.firstName = validatedInput.firstName;
      }

      if (validatedInput.lastName) {
        unsavedContact.lastName = validatedInput.lastName;
      }

      contact = await crmService.createNewContact(unsavedContact);
      console.log("Successfully created new contact", contact.id);
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
  }

  // By this point we are guaranteed a course and event
  const eventAttendances = await crmService.getEventAttendances(contact, event);

  if (eventAttendances.length !== 0) {
    console.log(
      `There should be no existing event attendances for the contact and course`
    );
    slackService.sendError(
      `There should be no existing event attendances for the contact and course`
    );

    return {
      statusCode: 500,
      body: JSON.stringify({
        reason: `There should be no existing event attendances for the contact and course`,
      }),
    };
  }

  try {
    await crmService.createEventAttendance(event, contact);
  } catch (error) {
    console.log(error);
    slackService.sendError(`Failed to create event attendance`);
    return {
      statusCode: 500,
      body: JSON.stringify({
        reason: "Failed to create event attendance",
      }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Successfully created a new event attendance",
    }),
  };
};
