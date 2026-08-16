import { expect, test as base } from "@playwright/test";

const STATIC_MAP_FIXTURE = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400"><rect width="640" height="400" fill="#dce9ed"/><path d="M20 320L610 40" stroke="#fff" stroke-width="22"/><path d="M120 40L500 380" stroke="#fff" stroke-width="16"/><circle cx="330" cy="200" r="18" fill="#16825d" stroke="#fff" stroke-width="5"/><text x="584" y="388" font-size="12">Google</text></svg>`;

export const test = base.extend<{ staticMapFixture: void }>({
  staticMapFixture: [
    async ({ page }, use) => {
      await page.route("**/api/maps/thumbnail?*", (route) =>
        route.fulfill({
          status: 200,
          contentType: "image/svg+xml",
          body: STATIC_MAP_FIXTURE,
        }),
      );
      await use();
    },
    { auto: true },
  ],
});

export { expect };
