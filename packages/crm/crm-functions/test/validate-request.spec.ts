import { validateRequestParameters } from "../validate-request";

describe("validateRequestParameters", () => {
  test("Returns a 404 when no method is given", () => {
    const { valid, reason } = validateRequestParameters({ __ow_path: "" });

    expect(valid).toBeFalsy();
    expect(reason).toBe("Endpoint only accepts POST requests");
  });

  test("Returns a 404 when a get is sent", () => {
    const { valid, reason } = validateRequestParameters({
      __ow_path: "",
      __ow_method: "get",
    });

    expect(valid).toBeFalsy();
    expect(reason).toEqual("Endpoint only accepts POST requests");
  });

  test("Returns a 404 when a made up method is sent", () => {
    const { valid, reason } = validateRequestParameters({
      __ow_path: "",
      __ow_method: "not real",
    });

    expect(valid).toBeFalsy();
    expect(reason).toEqual("Endpoint only accepts POST requests");
  });

  test("Returns a 404 when no path is given", () => {
    const { valid, reason } = validateRequestParameters({
      __ow_method: "post",
    });

    expect(valid).toBeFalsy();
    expect(reason).toEqual("Endpoint only accepts requests to /");
  });

  test("Returns a 404 when another path is given", () => {
    const { valid, reason } = validateRequestParameters({
      __ow_method: "post",
      __ow_path: "/this-is-a-path",
    });

    expect(valid).toBeFalsy();
    expect(reason).toEqual("Endpoint only accepts requests to /");
  });

  test("Returns a 404 no method is given", () => {
    const { valid, reason } = validateRequestParameters({
      __ow_method: "post",
      __ow_path: "/",
    });

    expect(valid).toBeFalsy();
    expect(reason).toEqual("You did not provide a 'method'");
  });

  test("Returns a 404 a bad method is given", () => {
    // Stringify => Parse is get round type checker as we are passing bad data in on purpose
    const { valid, reason } = validateRequestParameters(
      JSON.parse(
        JSON.stringify({
          __ow_method: "post",
          __ow_path: "/",
          method: "non-existent",
        })
      )
    );

    expect(valid).toBeFalsy();
    expect(reason).toEqual(
      "You provided a non recognised method: non-existent"
    );
  });

  test("Returns a success when a valid input is given", () => {
    // Stringify => Parse is get round type checker as we are passing bad data in on purpose
    const { valid } = validateRequestParameters({
      __ow_method: "post",
      __ow_path: "/",
      method: "add-to-newsletter",
    });

    expect(valid).toBeTruthy();
  });
});
