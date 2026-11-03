import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("interactive clock demo", () => {
  test("clocks in, runs the day and clocks out", async ({ page }) => {
    await page.goto("/");
    const demo = page.getByRole("region", { name: "Try it · Today" });
    const ring = demo.getByRole("progressbar", { name: "Hours worked today" });

    await expect(ring).toHaveAttribute(
      "aria-valuetext",
      "7 hours 30 minutes of 8 hours",
    );

    await demo.getByRole("button", { name: "Clock in" }).click();
    await expect(demo.getByText(/Clocked in since 17:17/)).toBeVisible();

    // One second of real time is one demo minute.
    await expect(ring).not.toHaveAttribute(
      "aria-valuetext",
      "7 hours 30 minutes of 8 hours",
      { timeout: 5_000 },
    );

    await demo.getByRole("button", { name: "Clock out" }).click();
    await expect(demo.getByRole("button", { name: "Clock in" })).toBeVisible();
    await expect(demo.getByRole("listitem").last()).toContainText("17:17 →");
  });
});

test.describe("product tour", () => {
  test("switches views by click and by keyboard", async ({ page }) => {
    await page.goto("/");
    const tour = page.getByRole("tablist", { name: "Product tour" });
    const members = tour.getByRole("tab", { name: "For members" });
    const admins = tour.getByRole("tab", { name: "For owners & admins" });

    await expect(page.getByRole("tabpanel")).toContainText("Your week");

    await admins.click();
    await expect(admins).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel")).toContainText("Live attendance");

    await admins.press("ArrowLeft");
    await expect(members).toBeFocused();
    await expect(page.getByRole("tabpanel")).toContainText("Your week");
  });
});

test.describe("motion preferences", () => {
  test("plays entrance animations by default", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");

    const animations = await page.evaluate(
      () => document.getAnimations().length,
    );
    expect(animations).toBeGreaterThan(0);
  });

  test("runs no animations when the visitor prefers reduced motion", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const animations = await page.evaluate(() =>
      document
        .getAnimations()
        .map((animation) =>
          animation instanceof CSSAnimation ? animation.animationName : "js",
        ),
    );
    expect(animations).toEqual([]);

    // Entrance content is fully visible, not stuck at an animation's first frame.
    const opacities = await page
      .locator(".animate-enter, .reveal")
      .evaluateAll((elements) =>
        elements.map((element) => getComputedStyle(element).opacity),
      );
    expect(opacities.every((opacity) => opacity === "1")).toBe(true);
  });
});

test.describe("brand", () => {
  test("shares a branded preview image", async ({ page, request }) => {
    await page.goto("/");
    const imageUrl = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");
    expect(imageUrl).toBeTruthy();

    const response = await request.get(new URL(imageUrl ?? "").pathname);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");
  });

  test("sign-in page is accessible in dark mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.goto("/login");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
