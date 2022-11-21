import { main } from "../index";

describe("Check suite is working", () => {
  test("Forever passing test", () => {
    expect(true).toEqual(true);
  });
});

describe("Validate Request", () => {
  test("Returns a 404 when no method is given", () => {
    const result = main({ __ow_path: "" });

    expect(result).toEqual({
      statusCode: 404,
      body: { reason: "Endpoint only accepts POST requests" },
    });
  });

  test("Returns a 404 when a get is sent", () => {
    const result = main({ __ow_path: "", __ow_method: "get" });

    expect(result).toEqual({
      statusCode: 404,
      body: { reason: "Endpoint only accepts POST requests" },
    });
  });

  test("Returns a 404 when a made up method is sent", () => {
    const result = main({ __ow_path: "", __ow_method: "not real" });

    expect(result).toEqual({
      statusCode: 404,
      body: { reason: "Endpoint only accepts POST requests" },
    });
  });

  test("Returns a 404 when no path is given", () => {
    const result = main({ __ow_method: "post" });

    expect(result).toEqual({
      statusCode: 404,
      body: { reason: "Endpoint only accepts requests to /" },
    });
  });

  test("Returns a 404 when another path is given", () => {
    const result = main({ __ow_method: "post", __ow_path: "/this-is-a-path" });

    expect(result).toEqual({
      statusCode: 404,
      body: { reason: "Endpoint only accepts requests to /" },
    });
  });

  test("Returns a bad request if no email is given", () => {
    const result = main({ __ow_method: "post", __ow_path: "" });

    expect(result).toEqual({
      statusCode: 400,
      body: { reason: "No email provided" },
    });
  });
});
