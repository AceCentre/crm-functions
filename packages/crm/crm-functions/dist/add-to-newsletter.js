"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addToNewsletter = void 0;
const slugify_1 = require("./slugify");
const validateInput = (input) => {
    if (!input.email || typeof input.email !== "string") {
        return { valid: false, reason: "You did not supply an email address" };
    }
    let validInput = {
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
const addToNewsletter = async (handlerInput, crmService, logger) => {
    const { validatedInput, valid, reason } = validateInput(handlerInput);
    if (!valid || !validateInput) {
        return {
            statusCode: 500,
            body: JSON.stringify({ reason: reason }),
        };
    }
    try {
        await crmService.authenticate();
    }
    catch (error) {
        logger.error("An error occurred whilst authenticating to SugarCRM", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ reason: "Failed to authenticate to SugarCRM." }),
        };
    }
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
    if (listOfExistingContacts.length === 0) {
        try {
            let unsavedContact = {
                email: validatedInput.email,
                receivesNewsletter: true,
                firstName: validatedInput.email,
                lastName: "Unknown",
            };
            if (validatedInput.tags) {
                unsavedContact.tags = validatedInput.tags;
            }
            if (validatedInput.location) {
                unsavedContact.location = (0, slugify_1.slugify)(validatedInput.location);
            }
            if (validatedInput.firstName) {
                unsavedContact.firstName = validatedInput.firstName;
            }
            if (validatedInput.lastName) {
                unsavedContact.lastName = validatedInput.lastName;
            }
            await crmService.createNewContact(unsavedContact);
        }
        catch (error) {
            logger.error(`An error occurred whilst trying to create a new contact for: ${validatedInput.email}`, error);
            return {
                statusCode: 500,
                body: JSON.stringify({ reason: "Failed to create a new contact." }),
            };
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
            body: JSON.stringify({ message: "Create a new contact for email." }),
        };
    }
    else {
        for (const currentContact of listOfExistingContacts) {
            try {
                let updateContact = {
                    id: currentContact.id,
                    receivesNewsletter: true,
                };
                if (validatedInput.tags !== undefined &&
                    currentContact.tags !== undefined) {
                    updateContact.tags = [...currentContact.tags, ...validatedInput.tags];
                }
                else if (validatedInput.tags !== undefined) {
                    updateContact.tags = validatedInput.tags;
                }
                if (!!currentContact.location == false && validatedInput.location) {
                    updateContact.location = (0, slugify_1.slugify)(validatedInput.location);
                }
                if (currentContact.lastName.toLowerCase() === "unknown" &&
                    validatedInput.lastName) {
                    updateContact.lastName = validatedInput.lastName;
                }
                if (currentContact.firstName.toLowerCase() ===
                    currentContact.email.toLowerCase() &&
                    validatedInput.firstName) {
                    updateContact.firstName = validatedInput.firstName;
                }
                await crmService.updateContact(updateContact);
            }
            catch (error) {
                logger.error(`An error occurred whilst trying to opt ${currentContact.id} into mailing`, error);
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
exports.addToNewsletter = addToNewsletter;
//# sourceMappingURL=add-to-newsletter.js.map