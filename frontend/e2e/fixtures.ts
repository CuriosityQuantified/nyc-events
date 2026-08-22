import { expect, test as base, type Page } from "@playwright/test";

export const OSM_TILE_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

/** All browser suites stay offline from the public OpenStreetMap tile service. */
export const test = base.extend<{ offlineOsmTiles: void }>({
  offlineOsmTiles: [
    async ({ page }: { page: Page }, use: () => Promise<void>) => {
      await page.route("https://tile.openstreetmap.org/**", (route) =>
        route.fulfill({ body: OSM_TILE_PNG, contentType: "image/png" }),
      );
      await use();
    },
    { auto: true },
  ],
});

export { expect };
