export const ALLOWED_METHODS = ["add-to-newsletter", "add-to-course"] as const;
export type Method = (typeof ALLOWED_METHODS)[number];

export type HandlerInput = {
  __ow_method?: string;
  __ow_path?: string;
  method?: Method;
  email?: string;
  firstName?: string;
  lastName?: string;
  location?: string;
  tags?: Array<{ name: string }>;
  eventSlug?: string;
};

export type UpdateContact = {
  id: string;
  location?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  receivesNewsletter?: boolean;
  tags?: Array<{ name: string }>;
};

export type NewContact = {
  location?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  receivesNewsletter?: boolean;
  tags?: Array<{ name: string }>;
};

export type Contact = {
  id: string;
  location: string;
  firstName: string;
  lastName: string;
  email: string;
  receivesNewsletter: boolean;
  tags: Array<{ name: string }>;
};

export type HandlerResult = {
  statusCode: number;
  body: string;
};

export type SugarEvent = {
  id: string;
  webpage: string;
  name: string;
};

export type EventAttendance = {
  id: string;
  name: string;
};
