import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL;
const expectedRevision = process.env.EXPECTED_DEPLOY_REVISION;

if (!baseURL) {
  throw new Error(
    "PLAYWRIGHT_BASE_URL is required for production browser verification",
  );
}

if (!expectedRevision) {
  throw new Error(
    "EXPECTED_DEPLOY_REVISION is required for production browser verification",
  );
}

export default defineConfig({
  testDir: "./e2e",
  testMatch: ["shell.spec.ts", "production.spec.ts"],
  fullyParallel: true,
  forbidOnly: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-production-report", open: "never" }],
    ["junit", { outputFile: "test-results/production-junit.xml" }],
  ],
  outputDir: "test-results/production",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "mobile-production",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: "desktop-production",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});
