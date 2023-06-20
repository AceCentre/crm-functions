"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SugarService = void 0;
const undici_1 = require("undici");
class SugarService {
    constructor({ username, password }, logger) {
        this.hostname = "https://ace.acrm.accessacloud.com";
        this.apiPath = "/rest/v10";
        this.api = `${this.hostname}${this.apiPath}`;
        this.username = username;
        this.password = password;
        this.logger = logger;
    }
    async getBody(path, method, withAuth = true, reqBody = {}) {
        if (withAuth && this.token === undefined) {
            throw new Error(`Tried to request ${path}, but didn't have an auth token saved`);
        }
        let headers = {};
        if (withAuth) {
            headers["Authorization"] = `Bearer ${this.token}`;
        }
        this.logger.info("Sending Request: ", Object.assign({ path }, reqBody));
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
        this.logger.info("Response: ", { response, path, method });
        return response;
    }
    async authenticate() {
        const authPath = `${this.api}/oauth2/token`;
        const reqBody = {
            grant_type: "password",
            client_id: "sugar",
            username: this.username,
            password: this.password,
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
    async createEventAttendance(event, contact) {
        const createEventAttendancePath = `${this.api}/cours_EventAttendance`;
        const result = await this.getBody(createEventAttendancePath, "POST", true, {
            name: `${contact.email} - ${event.name}`,
            cours_eventattendance_contacts: {
                add: [contact.id],
            },
            cours_event_cours_eventattendance: {
                add: [event.id],
            },
        });
        if (result &&
            result.id !== undefined &&
            typeof result.id === "string" &&
            result.name !== undefined &&
            typeof result.name === "string") {
            return { id: result.id, name: result.name };
        }
        throw new Error("Did not create event attendance");
    }
    async getEventAttendances(contact, event) {
        const contactsPath = `${this.api}/cours_EventAttendance?filter=[{"cours_event_cours_eventattendancecours_event_ida":"${event.id}","cours_eventattendance_contactscontacts_ida":"${contact.id}"}]`;
        const result = await this.getBody(contactsPath, "GET", true);
        if (result && result.records && Array.isArray(result.records)) {
            return result.records
                .map((record) => {
                if (record &&
                    record.id !== undefined &&
                    typeof record.id === "string" &&
                    record.name !== undefined &&
                    typeof record.name === "string") {
                    return {
                        id: record.id,
                        name: record.name,
                    };
                }
                else {
                    return null;
                }
            })
                .filter((x) => x !== null);
        }
        throw new Error(`Got invalid response from getEventAttendances: ${JSON.stringify(result)}`);
    }
    async getAllEvents() {
        const allEventsPath = `${this.api}/cours_Event?max_num=999999`;
        const result = await this.getBody(allEventsPath, "GET", true);
        if (result && result.records && Array.isArray(result.records)) {
            return result.records
                .map((record) => {
                if (record &&
                    record.id !== undefined &&
                    typeof record.id === "string" &&
                    record.webpage_c !== undefined &&
                    typeof record.webpage_c === "string" &&
                    record.name !== undefined &&
                    typeof record.name === "string") {
                    return {
                        id: record.id,
                        webpage: record.webpage_c,
                        name: record.name,
                    };
                }
                else {
                    return null;
                }
            })
                .filter((x) => x !== null);
        }
        throw new Error(`Got invalid response from getAllEvents: ${JSON.stringify(result)}`);
    }
    async getContactsByEmail(email) {
        const contactsPath = `${this.api}/Contacts?filter=[{"email": "${email}" }]`;
        const result = await this.getBody(contactsPath, "GET", true);
        if (result && result.records && Array.isArray(result.records)) {
            return result.records
                .map((record) => {
                if (record &&
                    record.id !== undefined &&
                    typeof record.id === "string" &&
                    record.first_name !== undefined &&
                    typeof record.first_name === "string" &&
                    record.last_name !== undefined &&
                    typeof record.last_name === "string" &&
                    record.sign_up_form_location_c !== undefined &&
                    typeof record.sign_up_form_location_c === "string" &&
                    record.email1 !== undefined &&
                    typeof record.email1 === "string" &&
                    record.receives_newsletter_c !== undefined &&
                    typeof record.receives_newsletter_c === "boolean" &&
                    record.tag !== undefined &&
                    Array.isArray(record.tag)) {
                    return {
                        id: record.id,
                        lastName: record.last_name,
                        firstName: record.first_name,
                        location: record.sign_up_form_location_c,
                        email: record.email1,
                        receivesNewsletter: record.receives_newsletter_c,
                        tags: record.tag.map((x) => ({ name: x.name })),
                    };
                }
                else {
                    return null;
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
            tag: contact.tags,
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
            sign_up_form_location_c: newContact.location,
            tags: newContact.tags,
        });
        if (result &&
            result.id !== undefined &&
            typeof result.id === "string" &&
            result.first_name !== undefined &&
            typeof result.first_name === "string" &&
            result.last_name !== undefined &&
            typeof result.last_name === "string" &&
            result.sign_up_form_location_c !== undefined &&
            typeof result.sign_up_form_location_c === "string" &&
            result.email1 !== undefined &&
            typeof result.email1 === "string" &&
            result.receives_newsletter_c !== undefined &&
            typeof result.receives_newsletter_c === "boolean" &&
            result.tags !== undefined &&
            Array.isArray(result.tags)) {
            return {
                id: result.id,
                lastName: result.last_name,
                firstName: result.first_name,
                location: result.sign_up_form_location_c,
                receivesNewsletter: result.receives_newsletter_c,
                email: result.email1,
                tags: result.tags,
            };
        }
        throw new Error(`Failed to create a new contact: ${newContact.email}`);
    }
}
exports.SugarService = SugarService;
//# sourceMappingURL=sugar-service.js.map