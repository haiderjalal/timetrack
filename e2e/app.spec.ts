import { expect, test } from "@playwright/test";

// The signed-in app (onboarding, /o/[orgSlug]) needs a real Supabase session,
// which these tests can't create. The onboarding form's validation is covered
// by OnboardingForm.test.tsx, and tenant isolation by supabase/tests (pgTAP).

test.describe("app routes for signed-out visitors", () => {
  test("the post-sign-in resolver asks who you are first", async ({
    request,
  }) => {
    const response = await request.get("/dashboard", { maxRedirects: 0 });

    expect(response.status()).toBe(307);
    expect(response.headers()["location"]).toBe(
      `/login?next=${encodeURIComponent("/dashboard")}`,
    );
  });

  test("a deep link comes back with its query after sign-in", async ({
    page,
  }) => {
    const path = "/o/acme/dashboard?view=week";
    await page.goto(path);

    await expect(page).toHaveURL(`/login?next=${encodeURIComponent(path)}`);
    await expect(page.locator('input[name="next"]')).toHaveValue(path);
  });

  test("a forged session cookie does not open the app", async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: "sb-forged-auth-token",
        value: "not-a-real-session",
        url: "http://localhost:3000",
      },
    ]);

    for (const path of ["/onboarding", "/o/acme/dashboard"]) {
      await page.goto(path);
      await expect(page).toHaveURL(`/login?next=${encodeURIComponent(path)}`);
    }
  });
});
