import { slugify } from "../slugify";

describe("slugify", () => {
  test("returns the same string when its already slugged", () => {
    const result = slugify("already-slugged");
    expect(result).toBe("already-slugged");
  });

  test("lowercases the string", () => {
    const result = slugify("UPPER-CASE");
    expect(result).toBe("upper-case");
  });

  test("removes spaces", () => {
    const result = slugify("this has spaces");
    expect(result).toBe("this-has-spaces");
  });
});
