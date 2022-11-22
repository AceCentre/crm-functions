export class SugarService {
  constructor() {}

  async authenticate(): Promise<void> {
    return;
  }

  async getContactsByEmail(email: string): Promise<Contact[]> {
    return [];
  }

  async optInToMailing(contact: Contact): Promise<void> {}

  async createNewContact(email: string): Promise<Contact> {
    return { id: "123" };
  }
}

export type Contact = {
  id: string;
};
