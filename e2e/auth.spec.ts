import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import type { Page } from "@playwright/test";

const isSupabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

// Next.js renders its own role="alert" route announcer outside <main>,
// so look for our message inside the page content.
function pageAlert(page: Page) {
  return page.getByRole("main").getByRole("alert");
}

function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

test.describe("sign-in page", () => {
  test("offers Google sign-in without errors", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/login");

    await expect(page).toHaveTitle(/Sign in · TimeTrack/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Sign in to TimeTrack" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Continue with Google" }),
    ).toBeEnabled();
    expect(errors).toEqual([]);
  });

  test("has no accessibility violations", async ({ page }) => {
    // Settled page: the brand panel's ring fill shouldn't be mid-animation.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/login?error=callback");
    await expect(pageAlert(page)).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("never returns people to another site after sign-in", async ({
    page,
  }) => {
    for (const next of ["//evil.example", "https://evil.example", "/\\evil"]) {
      await page.goto(`/login?next=${encodeURIComponent(next)}`);
      await expect(page.locator('input[name="next"]')).toHaveValue("/account");
    }

    await page.goto(`/login?next=${encodeURIComponent("/o/acme/reports")}`);
    await expect(page.locator('input[name="next"]')).toHaveValue(
      "/o/acme/reports",
    );
  });

  test("ignores unknown error codes", async ({ page }) => {
    await page.goto("/login?error=toString");

    await expect(
      page.getByRole("heading", { name: "Sign in to TimeTrack" }),
    ).toBeVisible();
    await expect(pageAlert(page)).toHaveCount(0);
  });
});

test.describe("protected pages", () => {
  for (const path of ["/account", "/o/acme/dashboard"]) {
    test(`send signed-out visitors from ${path} to sign-in`, async ({
      page,
    }) => {
      await page.goto(path);

      await expect(page).toHaveURL(`/login?next=${encodeURIComponent(path)}`);
      await expect(
        page.getByRole("heading", { name: "Sign in to TimeTrack" }),
      ).toBeVisible();
    });
  }
});

test.describe("OAuth callback", () => {
  test("explains a cancelled Google sign-in", async ({ page }) => {
    await page.goto("/auth/callback?error=access_denied");

    await expect(page).toHaveURL(/\/login\?.*error=cancelled/);
    await expect(pageAlert(page)).toContainText("cancelled");
  });

  test("rejects a callback without a code", async ({ page }) => {
    const response = await page.request.get("/auth/callback", {
      maxRedirects: 0,
    });

    expect(response.status()).toBe(307);
    expect(response.headers()["location"]).toContain("error=callback");
    expect(response.headers()["cache-control"]).toContain("no-store");
  });
});

test("Continue with Google hands off to Google with httpOnly cookies", async ({
  page,
  context,
}, testInfo) => {
  test.skip(!isSupabaseConfigured, "Needs Supabase keys in .env.local");
  test.skip(
    testInfo.project.name !== "desktop",
    "One real OAuth hop is enough",
  );

  await page.goto(`/login?next=${encodeURIComponent("/o/acme/dashboard")}`);
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await page.waitForURL(/accounts\.google\.com/, { timeout: 20_000 });

  const cookies = await context.cookies("http://localhost:3000/auth/callback");
  const returnPath = cookies.find((cookie) => cookie.name === "tt_next");
  const verifier = cookies.find((cookie) =>
    cookie.name.endsWith("-auth-token-code-verifier"),
  );

  expect(returnPath).toMatchObject({
    value: encodeURIComponent("/o/acme/dashboard"),
    httpOnly: true,
    path: "/auth/callback",
  });
  expect(verifier?.httpOnly).toBe(true);
});
