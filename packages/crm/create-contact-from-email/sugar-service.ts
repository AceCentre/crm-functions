import { request } from "undici";

const USERNAME = "<REDACTED>";
const PASSWORD = "<REDACTED>";

export class SugarService {
  hostname: string;
  apiPath: string;
  api: string;
  token?: string;

  constructor() {
    this.hostname = "https://ace.acrm.accessacloud.com";
    this.apiPath = "/rest/v10";
    this.api = `${this.hostname}${this.apiPath}`;
  }

  async getBody(
    path: string,
    method: "GET" | "POST" | "PUT",
    withAuth: boolean = true,
    reqBody: { [key: string]: any } = {}
  ): Promise<{ [key: string]: any }> {
    if (withAuth && this.token === undefined) {
      throw new Error(
        `Tried to request ${path}, but didn't have an auth token saved`
      );
    }

    let headers: { [key: string]: string } = {};

    if (withAuth) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const { body, statusCode } = await request(path, {
      method,
      body: JSON.stringify(reqBody),
      headers,
    });

    let response = null;

    try {
      response = await body.json();
    } catch (error) {
      throw new Error(
        `Failed to parse body on path (${path} - ${method}). Given the status code: ${statusCode}`
      );
    }

    if (statusCode !== 200) {
      throw new Error(
        `Non 200 status given for path: ${path}. Status code: ${statusCode}, body: ${JSON.stringify(
          response
        )}`
      );
    }

    return response;
  }

  async authenticate(): Promise<void> {
    const authPath = `${this.api}/oauth2/token`;

    const reqBody = {
      grant_type: "password",
      client_id: "sugar",
      username: USERNAME,
      password: PASSWORD,
      platform: "custom-crm-connector",
    };

    const result = await this.getBody(authPath, "POST", false, reqBody);

    if (
      result &&
      result.access_token &&
      typeof result.access_token === "string"
    ) {
      const token = result.access_token;

      this.token = token;
    } else {
      throw new Error(
        `Failed to authenticate, response given: ${JSON.stringify(result)}`
      );
    }
  }

  async getContactsByEmail(email: string): Promise<Contact[]> {
    const contactsPath = `${this.api}/Contacts?filter=[{"email": "${email}" }]`;

    const result = await this.getBody(contactsPath, "GET", true);

    if (result && result.records && Array.isArray(result.records)) {
      return result.records
        .map((record) => {
          if (record.id && typeof record.id === "string") {
            return { id: record.id };
          }
          return null;
        })
        .filter((x) => x !== null);
    }

    throw new Error(
      `Got invalid response from ContactsByEmail: ${JSON.stringify(result)}`
    );
  }

  async optInToMailing(contact: Contact): Promise<void> {
    const optInPath = `${this.api}/Contacts/${contact.id}`;

    const result = await this.getBody(optInPath, "PUT", true, {
      receives_newsletter_c: true,
    });

    if (result.receives_newsletter_c && result.receives_newsletter_c === true) {
      return;
    }

    throw new Error(`Failed to correctly opt them into mailing: ${contact.id}`);
  }

  async createNewContact(email: string): Promise<Contact> {
    const createPath = `${this.api}/Contacts`;

    const result = await this.getBody(createPath, "POST", true, {
      email,
      first_name: email,
      last_name: "Unknown",
      receives_newsletter_c: true,
    });

    if (result && result.id && typeof result.id === "string") {
      return { id: result.id };
    }

    throw new Error(`Failed to create a new contact: ${email}`);
  }
}

export type Contact = {
  id: string;
};
