import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

import { buttonVariants } from "./button-variants";

const VARIANTS = [
  "default",
  "outline",
  "secondary",
  "ghost",
  "destructive",
  "link",
] as const;
const SIZES = [
  "default",
  "xs",
  "sm",
  "lg",
  "icon",
  "icon-xs",
  "icon-sm",
  "icon-lg",
] as const;

describe("buttonVariants", () => {
  // Links and client components use buttonVariants without `cn`, so any two
  // classes fighting over one property would leave the winner to CSS order.
  // `cn` removes conflicting classes; if it changes nothing, there are none.
  it.each(VARIANTS.flatMap((variant) => SIZES.map((size) => [variant, size])))(
    "has no conflicting classes for variant %s, size %s",
    (variant, size) => {
      const classes = buttonVariants({
        variant: variant as (typeof VARIANTS)[number],
        size: size as (typeof SIZES)[number],
      });

      expect(cn(classes)).toBe(classes);
    },
  );

  it("gives outline buttons a visible border", () => {
    const classes = buttonVariants({ variant: "outline" }).split(" ");

    expect(classes).toContain("border-border");
    expect(classes).not.toContain("border-transparent");
  });
});
