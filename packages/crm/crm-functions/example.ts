import * as dotenv from "dotenv";
import { SugarService } from "./sugar-service";
dotenv.config();

(async () => {
  const crm = new SugarService({
    username: process.env.CRM_USERNAME,
    password: process.env.CRM_PASSWORD,
  });
  await crm.authenticate();

  const events = await crm.getAllEvents();
  const contacts = await crm.getContactsByEmail("cypress@gavinhenderson.co.uk");

  const event = events[0];
  const contact = contacts[0];

  const ea = await crm.getEventAttendances(contact, event);

  const newAttendance = await crm.createEventAttendance(event, contact);

  const again = await crm.getEventAttendances(contact, event);

  console.log({ event, contact, ea, newAttendance, again });
})();
