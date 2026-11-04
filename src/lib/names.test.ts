import { describe, expect, it } from "vitest";

import { getFirstName } from "./getFirstName";
import { getInitials } from "./getInitials";
import { slugify } from "./slugify";

describe("slugify", () => {
  it.each([
    ["Acme Inc", "acme-inc"],
    ["  Acme   Café & Co. ", "acme-cafe-co"],
    ["WK Traders (Pvt) Ltd", "wk-traders-pvt-ltd"],
    ["---", ""],
    ["a".repeat(39) + " b", "a".repeat(39)],
  ])("turns %j into %j", (name, expected) => {
    expect(slugify(name)).toBe(expected);
  });
});

describe("getInitials", () => {
  it.each([
    ["Haider Jalal", "HJ"],
    ["ayesha", "A"],
    ["Ayesha Khan Raza", "AK"],
    ["   ", "?"],
  ])("%j → %s", (name, expected) => {
    expect(getInitials(name)).toBe(expected);
  });
});

describe("getFirstName", () => {
  it("greets people by their first name", () => {
    expect(getFirstName("Haider Jalal")).toBe("Haider");
  });

  it("leaves the name out when Google only gave an email", () => {
    expect(getFirstName("haider@example.com")).toBeNull();
  });
});
