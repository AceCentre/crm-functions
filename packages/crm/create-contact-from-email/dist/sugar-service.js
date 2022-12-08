"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SugarService = void 0;
const undici_1 = require("undici");
const USERNAME = process.env.CRM_USERNAME;
const PASSWORD = process.env.CRM_PASSWORD;
class SugarService {
    constructor() {
        this.hostname = "https://ace.acrm.accessacloud.com";
        this.apiPath = "/rest/v10";
        this.api = `${this.hostname}${this.apiPath}`;
    }
    async getBody(path, method, withAuth = true, reqBody = {}) {
        if (withAuth && this.token === undefined) {
            throw new Error(`Tried to request ${path}, but didn't have an auth token saved`);
        }
        let headers = {};
        if (withAuth) {
            headers["Authorization"] = `Bearer ${this.token}`;
        }
        console.log(Object.assign({ path }, reqBody));
        const { body, statusCode } = await (0, undici_1.request)(path, {
            method,
            body: JSON.stringify(reqBody),
            headers,
        });
        let response = null;
        try {
            response = await body.json();
        }
        catch (error) {
            throw new Error(`Failed to parse body on path (${path} - ${method}). Given the status code: ${statusCode}`);
        }
        if (statusCode !== 200) {
            throw new Error(`Non 200 status given for path: ${path}. Status code: ${statusCode}, body: ${JSON.stringify(response)}`);
        }
        console.log({ response, path, method });
        return response;
    }
    async authenticate() {
        const authPath = `${this.api}/oauth2/token`;
        const reqBody = {
            grant_type: "password",
            client_id: "sugar",
            username: USERNAME,
            password: PASSWORD,
            platform: "custom-crm-connector",
        };
        const result = await this.getBody(authPath, "POST", false, reqBody);
        if (result &&
            result.access_token &&
            typeof result.access_token === "string") {
            const token = result.access_token;
            this.token = token;
        }
        else {
            throw new Error(`Failed to authenticate, response given: ${JSON.stringify(result)}`);
        }
    }
    async getContactsByEmail(email) {
        const contactsPath = `${this.api}/Contacts?filter=[{"email": "${email}" }]`;
        const result = await this.getBody(contactsPath, "GET", true);
        if (result && result.records && Array.isArray(result.records)) {
            return result.records
                .map((record) => {
                if (record &&
                    record.id &&
                    typeof record.id === "string" &&
                    record.first_name &&
                    typeof record.first_name === "string" &&
                    record.last_name &&
                    typeof record.last_name === "string" &&
                    record.sign_up_form_location_c &&
                    typeof record.sign_up_form_location_c === "string" &&
                    record.email1 &&
                    typeof record.email1 === "string" &&
                    record.receives_newsletter_c &&
                    typeof record.receives_newsletter_c === "boolean") {
                    return {
                        id: record.id,
                        lastName: record.last_name,
                        firstName: record.first_name,
                        location: record.sign_up_form_location_c,
                        email: record.email1,
                        receivesNewsletter: record.receives_newsletter_c,
                    };
                }
            })
                .filter((x) => x !== null);
        }
        throw new Error(`Got invalid response from ContactsByEmail: ${JSON.stringify(result)}`);
    }
    async updateContact(contact) {
        const optInPath = `${this.api}/Contacts/${contact.id}`;
        const result = await this.getBody(optInPath, "PUT", true, {
            first_name: contact.firstName,
            last_name: contact.lastName,
            email1: contact.email,
            receives_newsletter_c: contact.receivesNewsletter,
            sign_up_form_location_c: contact.location,
        });
        if (result.id && result.id === contact.id) {
            return;
        }
        throw new Error(`Failed to correctly opt them into mailing: ${contact.id}`);
    }
    async createNewContact(newContact) {
        const createPath = `${this.api}/Contacts`;
        const result = await this.getBody(createPath, "POST", true, {
            email1: newContact.email,
            first_name: newContact.firstName,
            last_name: newContact.lastName,
            receives_newsletter_c: newContact.receivesNewsletter,
        });
        if (result &&
            result.id &&
            typeof result.id === "string" &&
            result.first_name &&
            typeof result.first_name === "string" &&
            result.last_name &&
            typeof result.last_name === "string" &&
            result.sign_up_form_location_c &&
            typeof result.sign_up_form_location_c === "string" &&
            result.email1 &&
            typeof result.email1 === "string" &&
            result.receives_newsletter_c &&
            typeof result.receives_newsletter_c === "boolean") {
            return {
                id: result.id,
                lastName: result.last_name,
                firstName: result.first_name,
                location: result.sign_up_form_location_c,
                receivesNewsletter: result.receives_newsletter_c,
                email: result.email1,
            };
        }
        throw new Error(`Failed to create a new contact: ${newContact.email}`);
    }
}
exports.SugarService = SugarService;
