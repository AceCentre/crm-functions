"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addToCourse = void 0;
const validateInput = (input) => {
    if (!input || typeof input.email !== "string") {
        return { valid: false, reason: "No email provided" };
    }
    if (!input || typeof input.eventSlug !== "string") {
        return { valid: false, reason: "No eventSlug provided" };
    }
    const validInput = {
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
const addToCourse = async (handlerInput, crmService, logger) => {
    const { validatedInput, valid, reason } = validateInput(handlerInput);
    if (!valid || !validateInput) {
        logger.error("An invalid input was given");
        return {
            statusCode: 500,
            body: JSON.stringify({ reason: reason }),
        };
    }
    try {
        await crmService.authenticate();
    }
    catch (error) {
        logger.error("An error occurred whilst authenticating to SugarCRM.", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ reason: "Failed to authenticate to SugarCRM." }),
        };
    }
    // Get all the events
    let events = [];
    try {
        events = await crmService.getAllEvents();
    }
    catch (error) {
        logger.error("An error occurred whilst trying to get all events.", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ reason: "Failed to get a list of events" }),
        };
    }
    // Find the event that was purchased
    const matchingEvents = events.filter((event) => event.webpage.toLowerCase().includes(validatedInput.eventSlug.toLowerCase()));
    if (matchingEvents.length !== 1) {
        logger.error(`You gave an an event slug tht we couldn't find or found too many events for (${matchingEvents.length})`);
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
        listOfExistingContacts = await crmService.getContactsByEmail(validatedInput.email);
    }
    catch (error) {
        logger.error("An error occurred whilst trying to get contacts by email", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ reason: "Failed to get contacts by email." }),
        };
    }
    // Bail if there are multiple contacts
    if (listOfExistingContacts.length > 1) {
        logger.error(`There are too many (${listOfExistingContacts.length}) contacts for the email address: ${validatedInput.email}`);
        return {
            statusCode: 500,
            body: JSON.stringify({
                reason: `There are too many (${listOfExistingContacts.length}) contacts for the email address: ${validatedInput.email}`,
            }),
        };
    }
    // Create a contact if it doesn't exist or use existing contact
    let contact;
    if (listOfExistingContacts.length === 1) {
        contact = listOfExistingContacts[0];
    }
    else {
        try {
            let unsavedContact = {
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
        }
        catch (error) {
            logger.error(`An error occurred whilst trying to create a new contact for: ${validatedInput.email}`, error);
            return {
                statusCode: 500,
                body: JSON.stringify({ reason: "Failed to create a new contact." }),
            };
        }
    }
    // By this point we are guaranteed a course and event
    const eventAttendances = await crmService.getEventAttendances(contact, event);
    if (eventAttendances.length !== 0) {
        logger.error(`There should be no existing event attendances for the contact and course`);
        return {
            statusCode: 500,
            body: JSON.stringify({
                reason: `There should be no existing event attendances for the contact and course`,
            }),
        };
    }
    try {
        await crmService.createEventAttendance(event, contact);
    }
    catch (error) {
        logger.error(`Failed to create event attendance`, error);
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
exports.addToCourse = addToCourse;
//# sourceMappingURL=add-to-course.js.map