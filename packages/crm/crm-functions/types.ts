export const ALLOWED_METHODS = ["add-to-newsletter", "add-to-course"] as const;
export type Method = typeof ALLOWED_METHODS[number];

export type HandlerInput = {
  __ow_method?: string;
  __ow_path?: string;
  method?: Method;
  [key: string]: string;
};

export type UpdateContact = {
  id: string;
  location?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  receivesNewsletter?: boolean;
};

export type NewContact = {
  location?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  receivesNewsletter?: boolean;
};

export type Contact = {
  id: string;
  location: string;
  firstName: string;
  lastName: string;
  email: string;
  receivesNewsletter: boolean;
};

export type HandlerResult = {
  statusCode: number;
  body: string;
};
