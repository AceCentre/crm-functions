import { Logger } from "./logger";
import { slugify } from "./slugify";
import { request } from "undici";
import { HandlerInput, HandlerResult } from "./types";

type AddToNewsletterInput = {
  email: string;
  location?: string;
  firstName?: string;
  lastName?: string;
  tags?: Array<{ name: string }>;
  event?: string;
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

  if (input.event && typeof input.event === "string") {
    validInput.event = input.event;
  }

  return {
    validatedInput: validInput,
    valid: true,
  };
};

const HUBSPOT_BASE_URL = "https://api.hubapi.com";
const HUBSPOT_NEWSLETTER_SUBSCRIPTION_ID = "1872717030";
const HUBSPOT_NEWSLETTER_CONSENT_TEXT = "User subscribed via NewsLetter form";

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

const getExistingContact = async (email: string) => {
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

  const { body, statusCode } = await request(searchUrl, {
    method: "POST",
    headers: getHubspotHeaders(),
    body: JSON.stringify(searchBody),
  });

  const result = (await body.json()) as {
    results?: Array<{ id: string; properties?: { main_tag?: string } }>;
  };

  if (statusCode !== 200) {
    throw new Error(
      `HubSpot search failed (${statusCode}): ${JSON.stringify(result)}`,
    );
  }

  if (result?.results?.length) {
    return result.results[0];
  }

  return null;
};

const upsertContact = async (
  email: string,
  properties: { [key: string]: any },
) => {
  const existing = await getExistingContact(email);

  if (existing?.id) {
    const updateUrl = `${HUBSPOT_BASE_URL}/crm/v3/objects/contacts/${existing.id}`;

    const { body, statusCode } = await request(updateUrl, {
      method: "PATCH",
      headers: getHubspotHeaders(),
      body: JSON.stringify({ properties }),
    });

    const result = await body.json();

    if (statusCode !== 200) {
      throw new Error(
        `HubSpot update failed (${statusCode}): ${JSON.stringify(result)}`,
      );
    }

    return result;
  }

  const createUrl = `${HUBSPOT_BASE_URL}/crm/v3/objects/contacts`;

  const { body, statusCode } = await request(createUrl, {
    method: "POST",
    headers: getHubspotHeaders(),
    body: JSON.stringify({ properties: { email, ...properties } }),
  });

  const result = await body.json();

  if (statusCode !== 201) {
    throw new Error(
      `HubSpot create failed (${statusCode}): ${JSON.stringify(result)}`,
    );
  }

  return result;
};

const subscribeToNewsletter = async (email: string) => {
  const subscribeUrl = `${HUBSPOT_BASE_URL}/communication-preferences/v3/subscribe`;
  const payload = {
    emailAddress: email,
    subscriptionId: HUBSPOT_NEWSLETTER_SUBSCRIPTION_ID,
    legalBasis: "CONSENT_WITH_NOTICE",
    legalBasisExplanation: HUBSPOT_NEWSLETTER_CONSENT_TEXT,
    timestamp: new Date().toISOString(),
  };

  const { body, statusCode } = await request(subscribeUrl, {
    method: "POST",
    headers: getHubspotHeaders(),
    body: JSON.stringify(payload),
  });

  if (statusCode === 409) {
    return;
  }

  if (statusCode < 200 || statusCode >= 300) {
    const result = await body.json();
    throw new Error(
      `HubSpot subscribe failed (${statusCode}): ${JSON.stringify(result)}`,
    );
  }
};

export const addToNewsletter = async (
  handlerInput: HandlerInput,
  _crmService: unknown,
  logger: Logger,
): Promise<HandlerResult> => {
  const { validatedInput, valid, reason } = validateInput(handlerInput);

  if (!valid || !validateInput) {
    return {
      statusCode: 500,
      body: JSON.stringify({ reason: reason }),
    };
  }

  try {
    const existing = await getExistingContact(validatedInput.email);
    const incomingTags =
      validatedInput.tags?.map((tag) => tag.name).filter(Boolean) || [];
    const existingMainTags =
      existing?.properties?.main_tag?.split(";").filter(Boolean) || [];
    const mergedMainTags = Array.from(
      new Set([...existingMainTags, ...incomingTags]),
    ).join(";");

    const properties: { [key: string]: any } = {
      email: validatedInput.email,
      optin_newsletter_temporary: true,
    };

    if (mergedMainTags) {
      properties.main_tag = mergedMainTags;
    }

    if (validatedInput.location) {
      properties.sign_up_form_location = slugify(validatedInput.location);
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
    try {
      await subscribeToNewsletter(validatedInput.email);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error("Failed to update HubSpot subscription", error);
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Updated HubSpot contact",
          subscriptionWarning: errorMessage,
        }),
      };
    }
  } catch (error) {
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
