import { loadEnvConfig } from "@next/env";
import { defineConfig, devices } from "@playwright/test";

// Same env files Next.js reads (.env.local etc.), so tests know whether
// Supabase is configured. CI has no Supabase keys and skips those tests.
loadEnvConfig(process.cwd());

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  // Tests run against a production build, the same thing users get.
  webServer: {
    command: "npm run build && npm run start",
    url: BASE_URL,
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
});
