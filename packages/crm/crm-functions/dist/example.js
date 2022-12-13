"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const sugar_service_1 = require("./sugar-service");
dotenv.config();
(async () => {
    const crm = new sugar_service_1.SugarService({
        username: process.env.USERNAME,
        password: process.env.PASSWORD,
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
