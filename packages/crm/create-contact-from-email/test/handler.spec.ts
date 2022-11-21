import { main } from "../index";

test("Forever passing test", () => {
  expect(true).toEqual(true);
});

test("Returns a 404 when no method is given", () => {
  const result = main({});

  expect(result).toEqual({ statusCode: 404 });
});
