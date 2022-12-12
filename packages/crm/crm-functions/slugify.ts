export const slugify = (input: string): string =>
  input
    .toLowerCase()
    .split(" ")
    .map((x) => x.trim())
    .join("-");
