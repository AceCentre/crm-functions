"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addToNewsletter = void 0;
const slugify_1 = require("./slugify");
const undici_1 = require("undici");
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
    if (input.event && typeof input.event === "string") {
        validInput.event = input.event;
    }
    return {
        validatedInput: validInput,
        valid: true,
    };
};
const HUBSPOT_BASE_URL = "https://api.hubapi.com";
const getHubspotHeaders = () => {
    const token = process.env.HUBSPOT_TOKEN;
    if (!token) {
        throw new Error("Missing HUBSPOT_TOKEN env var");
    }
    return {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };
};
const getExistingContact = async (email) => {
    var _a;
    const searchUrl = `${HUBSPOT_BASE_URL}/crm/v3/objects/contacts/search`;
    const searchBody = {
        filterGroups: [
            {
                filters: [
                    {
                        propertyName: "email",
                        operator: "EQ",
                        value: email,
                    },
                ],
            },
        ],
        properties: ["email", "main_tag", "sign_up_form_location"],
        limit: 1,
    };
    const { body, statusCode } = await (0, undici_1.request)(searchUrl, {
        method: "POST",
        headers: getHubspotHeaders(),
        body: JSON.stringify(searchBody),
    });
    const result = (await body.json());
    if (statusCode !== 200) {
        throw new Error(`HubSpot search failed (${statusCode}): ${JSON.stringify(result)}`);
    }
    if ((_a = result === null || result === void 0 ? void 0 : result.results) === null || _a === void 0 ? void 0 : _a.length) {
        return result.results[0];
    }
    return null;
};
const upsertContact = async (email, properties) => {
    const existing = await getExistingContact(email);
    if (existing === null || existing === void 0 ? void 0 : existing.id) {
        const updateUrl = `${HUBSPOT_BASE_URL}/crm/v3/objects/contacts/${existing.id}`;
        const { body, statusCode } = await (0, undici_1.request)(updateUrl, {
            method: "PATCH",
            headers: getHubspotHeaders(),
            body: JSON.stringify({ properties }),
        });
        const result = await body.json();
        if (statusCode !== 200) {
            throw new Error(`HubSpot update failed (${statusCode}): ${JSON.stringify(result)}`);
        }
        return result;
    }
    const createUrl = `${HUBSPOT_BASE_URL}/crm/v3/objects/contacts`;
    const { body, statusCode } = await (0, undici_1.request)(createUrl, {
        method: "POST",
        headers: getHubspotHeaders(),
        body: JSON.stringify({ properties: Object.assign({ email }, properties) }),
    });
    const result = await body.json();
    if (statusCode !== 201) {
        throw new Error(`HubSpot create failed (${statusCode}): ${JSON.stringify(result)}`);
    }
    return result;
};
const addToNewsletter = async (handlerInput, _crmService, logger) => {
    var _a, _b, _c;
    const { validatedInput, valid, reason } = validateInput(handlerInput);
    if (!valid || !validateInput) {
        return {
            statusCode: 500,
            body: JSON.stringify({ reason: reason }),
        };
    }
    try {
        const existing = await getExistingContact(validatedInput.email);
        const incomingTags = ((_a = validatedInput.tags) === null || _a === void 0 ? void 0 : _a.map((tag) => tag.name).filter(Boolean)) || [];
        const existingMainTags = ((_c = (_b = existing === null || existing === void 0 ? void 0 : existing.properties) === null || _b === void 0 ? void 0 : _b.main_tag) === null || _c === void 0 ? void 0 : _c.split(";").filter(Boolean)) || [];
        const mergedMainTags = Array.from(new Set([...existingMainTags, ...incomingTags])).join(";");
        const properties = {
            email: validatedInput.email,
            optin_newsletter_temporary: true,
        };
        if (mergedMainTags) {
            properties.main_tag = mergedMainTags;
        }
        if (validatedInput.location) {
            properties.sign_up_form_location = (0, slugify_1.slugify)(validatedInput.location);
        }
        if (validatedInput.event) {
            properties.event = validatedInput.event;
        }
        if (incomingTags.includes("pragmatics-profile-people-use-aac")) {
            properties.last_resource_downloaded = new Date().toISOString();
        }
        if (validatedInput.firstName) {
            properties.firstname = validatedInput.firstName;
        }
        if (validatedInput.lastName) {
            properties.lastname = validatedInput.lastName;
        }
        await upsertContact(validatedInput.email, properties);
    }
    catch (error) {
        logger.error("Failed to upsert HubSpot contact", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ reason: "Failed to update HubSpot contact." }),
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
        body: JSON.stringify({ message: "Updated HubSpot contact" }),
    };
};
exports.addToNewsletter = addToNewsletter;
//# sourceMappingURL=add-to-newsletter.js.map