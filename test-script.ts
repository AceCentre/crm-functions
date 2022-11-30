import { SugarService } from "./packages/crm/create-contact-from-email/sugar-service";

(async () => {
  const crm = new SugarService();

  await crm.authenticate();
  const contacts = await crm.getContactsByEmail(
    "sugar-crm-test-connect@gavinhenderson.co.uk"
  );

  for (const contact of contacts) {
    await crm.optInToMailing(contact);
  }

  const result = await crm.createNewContact(
    `script-${Math.floor(Math.random() * 999999)}@gavinhenderson.co.uk`
  );

  console.log(result);

  console.log(contacts);
})();
