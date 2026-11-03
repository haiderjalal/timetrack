import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("landing page", () => {
  test("explains the product and leads to sign-in", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/TimeTrack/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Clock in with one tap",
    );
    await expect(
      page.getByRole("link", { name: /get started with google/i }),
    ).toHaveAttribute("href", "/login");
  });

  test("has no accessibility violations", async ({ page }) => {
    await page.goto("/");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no accessibility violations in dark mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test("fits the screen without sideways scrolling", async ({ page }) => {
    await page.goto("/");

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("sends security headers", async ({ request }) => {
    const response = await request.get("/");
    const headers = response.headers();

    expect(headers["content-security-policy"]).toContain(
      "frame-ancestors 'none'",
    );
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-powered-by"]).toBeUndefined();
  });
});

test("unknown pages show a friendly 404", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist");

  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { level: 1, name: "Page not found" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to home" })).toBeVisible();
});

test("health endpoint reports a live, uncached status", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(await response.json()).toMatchObject({
    success: true,
    data: { status: "ok" },
  });
});
