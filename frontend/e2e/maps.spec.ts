import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
import eventList from "../../contracts/golden/events-list.json";
import { apiToUiEvent, type ParkEvent } from "../app/data/events";

const source = eventList.events.map(apiToUiEvent);
const shared: ParkEvent = {
  ...source[0],
  id: "shared-location",
  guid: "shared-location",
  title: "Tai Chi Practice Session",
};
const multiple: ParkEvent = {
  ...source[1],
  id: "multiple-location",
  guid: "multiple-location",
  title: "Two-Park Nature Walk",
  coordinates: [
    ...source[1].coordinates,
    { latitude: 40.650001, longitude: -73.949999 },
  ],
};
const invalid: ParkEvent = {
  ...source[1],
  id: "invalid-location",
  guid: "invalid-location",
  title: "Location Pending Event",
  locationId: null,
  coordinates: [{ latitude: 0, longitude: 0 }],
  positionAccuracy: "not-listed",
};
const unlocatable: ParkEvent = {
  ...source[1],
  id: "unlocatable",
  guid: "unlocatable",
  title: "Location Unknown Event",
  location: "Location not listed",
  locationId: null,
  coordinates: [],
  positionAccuracy: "not-listed",
};
const events = [source[0], shared, source[1], multiple, invalid, unlocatable];

type AuditedPage = Page & { __mapErrors?: string[] };

const TILE_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

async function installRoutes(page: Page): Promise<void> {
  await page.route("https://tile.openstreetmap.org/**", (route) =>
    route.fulfill({ body: TILE_PNG, contentType: "image/png" }),
  );
  await page.route("**/api/events?*", async (route) => {
    const params = new URL(route.request().url()).searchParams;
    const filtered = params.get("borough")
      ? events.filter((event) => event.borough === params.get("borough"))
      : events;
    await route.fulfill({
      json: {
        events: filtered,
        page: Number(params.get("page") ?? "1"),
        pageSize: Number(params.get("page_size") ?? "12"),
        total: filtered.length,
        totalPages: filtered.length ? 1 : 0,
      },
    });
  });
  await page.route("**/api/profile/saved**", (route) =>
    route.fulfill({
      json: { events: [], page: 1, pageSize: 100, total: 0 },
    }),
  );
  await page.route("**/api/freshness", (route) =>
    route.fulfill({
      json: {
        lastSuccessfulSync: "2026-08-16T12:00:00Z",
        snapshotRowCount: events.length,
        isStale: false,
      },
    }),
  );
}

test.describe("Issue #26 maps", () => {
  test.beforeEach(async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    (page as AuditedPage).__mapErrors = errors;
    await installRoutes(page);
  });

  test.afterEach(async ({ page }) => {
    expect(
      (page as AuditedPage).__mapErrors,
      "console and page errors",
    ).toEqual([]);
  });

  test("ordinary Explore journeys make no Static Maps requests", async ({
    page,
  }) => {
    const thumbnailRequests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).pathname === "/api/maps/thumbnail") {
        thumbnailRequests.push(request.url());
      }
    });

    await page.goto("/", { waitUntil: "networkidle" });
    const cards = page.getByTestId("event-card");
    await expect(cards).toHaveCount(events.length);
    await expect(cards.first()).toContainText("Address: Not listed");
    await expect(page.getByTestId("map-thumbnail")).toHaveCount(0);
    await expect(page.getByTestId("map-thumbnail-fallback")).toHaveCount(0);
    expect(thumbnailRequests).toEqual([]);
  });

  test("groups stable locations and supports keyboard marker selection at both viewports", async ({
    page,
  }, testInfo) => {
    const thumbnailRequests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).pathname === "/api/maps/thumbnail") {
        thumbnailRequests.push(request.url());
      }
    });
    await page.goto("/?view=map");

    const map = page.getByTestId("event-map");
    await expect(map).toHaveAttribute("data-map-status", "ready");
    const coordinateMap = page.getByTestId("coordinate-map");
    await expect(coordinateMap).toHaveAttribute("data-fit-bounds", "true");
    await coordinateMap.scrollIntoViewIfNeeded();
    const markers = page.getByTestId("map-marker");
    await expect(markers).toHaveCount(2);
    for (const marker of await markers.all()) {
      expect(
        await marker.evaluate((element) => {
          const bounds = element.getBoundingClientRect();
          return (
            bounds.width >= 44 &&
            bounds.height >= 44 &&
            bounds.left >= 0 &&
            bounds.top >= 0 &&
            bounds.right <= window.innerWidth &&
            bounds.bottom <= window.innerHeight
          );
        }),
      ).toBe(true);
    }
    const sharedMarker = page.getByRole("button", {
      name: /Soldiers' and Sailors' Monument.*2 events/,
    });
    const targetBox = await sharedMarker.boundingBox();
    expect(targetBox).not.toBeNull();
    expect(targetBox!.width).toBeGreaterThanOrEqual(44);
    expect(targetBox!.height).toBeGreaterThanOrEqual(44);
    expect(await sharedMarker.getAttribute("data-diameter")).toBe("22");

    const panel = page.getByRole("complementary", {
      name: "Events at selected location",
    });
    const distinctMarker = markers.nth(1);
    await distinctMarker.focus();
    await page.keyboard.press("Space");
    await expect(panel).toContainText(source[1].title);
    await expect(panel).toContainText(multiple.title);
    await expect(panel).toContainText(invalid.title);
    await expect(panel.getByText("3 events", { exact: true })).toBeVisible();
    await expect(panel).not.toContainText(source[0].title);

    await sharedMarker.focus();
    await page.keyboard.press("Enter");
    await expect(panel).toContainText(source[0].title);
    await expect(panel).toContainText(shared.title);
    await expect(panel.locator("ul").first()).not.toContainText(invalid.title);
    await expect(panel).toContainText(unlocatable.title);
    await expect(panel.getByText("2 events", { exact: true })).toBeVisible();
    await expect(
      page.getByText("1 events are available in the list only"),
    ).toBeVisible();

    const params = new URL(page.url()).searchParams;
    expect(params.get("view")).toBe("map");
    const toggle = page.getByTestId("list-map-toggle");
    await toggle.getByRole("button", { name: "List", exact: true }).click();
    expect(new URL(page.url()).searchParams.get("view")).toBeNull();
    await page.goBack();
    await expect(
      toggle.getByRole("button", { name: "Map", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(map).toBeVisible();
    expect(thumbnailRequests).toEqual([]);

    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await testInfo.attach(`${testInfo.project.name}-location-map`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });

  test("works without credentials and keeps every filtered event reachable", async ({
    page,
  }) => {
    await page.goto("/?borough=Manhattan&view=map");
    const map = page.getByTestId("event-map");
    await expect(map).toHaveAttribute("data-map-status", "ready");
    await expect(page.getByTestId("coordinate-map")).toBeVisible();
    await expect(
      page
        .getByTestId("list-map-toggle")
        .getByRole("button", { name: "List", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: source[0].title }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: shared.title })).toBeVisible();
    expect(new URL(page.url()).searchParams.get("borough")).toBe("Manhattan");
  });
});
