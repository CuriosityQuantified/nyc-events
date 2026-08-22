import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "profile-auth.spec.ts",
  fullyParallel: false,
  forbidOnly: true,
  reporter: "list",
  outputDir: "test-results/profile-auth",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "auth-mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: "auth-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: {
    command: "vite --config vite.auth.config.mts",
    url: "http://127.0.0.1:3100/e2e/harness/",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
