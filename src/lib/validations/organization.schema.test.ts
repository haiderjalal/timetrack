import { describe, expect, it } from "vitest";

import { getDefaultSchedule } from "@/features/schedules/constants/defaultSchedule";

import { createOrganizationSchema } from "./organization.schema";
import {
  parseGraceMinutes,
  parseRequiredHours,
  scheduleSchema,
} from "./schedule.schema";

import type { CreateOrganizationInput } from "./organization.schema";

function validInput(
  overrides: Partial<CreateOrganizationInput> = {},
): CreateOrganizationInput {
  return {
    name: "Acme Inc",
    slug: "acme",
    timezone: "Asia/Karachi",
    schedule: getDefaultSchedule(),
    ...overrides,
  };
}

function errorPaths(input: unknown): string[] {
  const result = createOrganizationSchema.safeParse(input);
  return result.success
    ? []
    : result.error.issues.map((issue) => issue.path.join("."));
}

describe("createOrganizationSchema", () => {
  it("accepts the onboarding defaults", () => {
    expect(createOrganizationSchema.safeParse(validInput()).success).toBe(true);
  });

  it("trims the name", () => {
    const result = createOrganizationSchema.parse(
      validInput({ name: "  Acme  " }),
    );
    expect(result.name).toBe("Acme");
  });

  it.each(["", " A ", "x".repeat(81)])("rejects the name %j", (name) => {
    expect(errorPaths(validInput({ name }))).toEqual(["name"]);
  });

  it.each(["acme", "acme-inc", "a1b", "x".repeat(40)])(
    "accepts the slug %s",
    (slug) => {
      expect(errorPaths(validInput({ slug }))).toEqual([]);
    },
  );

  it.each([
    "ab",
    "Acme",
    "-acme",
    "acme-",
    "acme_inc",
    "acme inc",
    "x".repeat(41),
  ])("rejects the slug %j", (slug) => {
    expect(errorPaths(validInput({ slug }))).toEqual(["slug"]);
  });

  it("rejects an unknown timezone", () => {
    expect(errorPaths(validInput({ timezone: "Mars/Olympus" }))).toEqual([
      "timezone",
    ]);
  });
});

describe("scheduleSchema", () => {
  it("checks times and hours on working days only", () => {
    const schedule = getDefaultSchedule();
    const monday = schedule.days[0];
    const saturday = schedule.days[5];
    if (!monday || !saturday) throw new Error("expected seven days");

    monday.startTime = "";
    monday.requiredHours = "25";
    saturday.startTime = "";
    saturday.requiredHours = "";

    const result = scheduleSchema.safeParse(schedule);
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join("."))).toEqual([
      "days.0.startTime",
      "days.0.requiredHours",
    ]);
  });

  it("needs each weekday exactly once", () => {
    const schedule = getDefaultSchedule();
    const sunday = schedule.days[6];
    if (!sunday) throw new Error("expected seven days");
    sunday.weekday = 1;

    expect(scheduleSchema.safeParse(schedule).success).toBe(false);
  });

  it("rejects a grace period over 120 minutes", () => {
    expect(
      scheduleSchema.safeParse({ ...getDefaultSchedule(), graceMinutes: "121" })
        .success,
    ).toBe(false);
  });
});

describe("parseRequiredHours", () => {
  it.each([
    ["8", 8],
    ["7.5", 7.5],
    [" 0 ", 0],
    ["24", 24],
  ])("reads %j as %d", (value, expected) => {
    expect(parseRequiredHours(value)).toBe(expected);
  });

  it.each(["", "abc", "-1", "24.5"])("rejects %j", (value) => {
    expect(parseRequiredHours(value)).toBeNull();
  });
});

describe("parseGraceMinutes", () => {
  it("reads whole minutes from 0 to 120", () => {
    expect(parseGraceMinutes("0")).toBe(0);
    expect(parseGraceMinutes("120")).toBe(120);
  });

  it.each(["", "7.5", "-5", "121"])("rejects %j", (value) => {
    expect(parseGraceMinutes(value)).toBeNull();
  });
});
