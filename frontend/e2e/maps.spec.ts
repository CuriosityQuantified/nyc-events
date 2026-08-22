import type { Locator, Page } from "@playwright/test";
import { expect, OSM_TILE_PNG, test } from "./fixtures";
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

type AuditedPage = Page & {
  __mapErrors?: string[];
  __tileRequests?: string[];
  __expectTileFailures?: boolean;
};

async function installRoutes(page: Page): Promise<void> {
  const tileRequests: string[] = [];
  (page as AuditedPage).__tileRequests = tileRequests;
  await page.route("https://tile.openstreetmap.org/**", (route) => {
    tileRequests.push(route.request().url());
    return route.fulfill({ body: OSM_TILE_PNG, contentType: "image/png" });
  });
  await page.route("https://www.openstreetmap.org/**", (route) =>
    route.fulfill({
      body: "<!doctype html><title>OpenStreetMap marker</title>",
      contentType: "text/html",
    }),
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
    route.fulfill({ json: { events: [], page: 1, pageSize: 100, total: 0 } }),
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

async function expectFrameGeometry(preview: Locator): Promise<void> {
  expect(
    await preview.evaluate((frame) => {
      const box = frame.getBoundingClientRect();
      const canvas = frame.querySelector<HTMLElement>(
        "[data-testid='map-preview-canvas']",
      );
      const attribution = [...frame.querySelectorAll("a")].find((link) =>
        link.textContent?.includes("OpenStreetMap contributors"),
      );
      const canvasBox = canvas?.getBoundingClientRect();
      const attributionBox = attribution?.getBoundingClientRect();
      return (
        box.width > 200 &&
        box.height >= 132 &&
        canvasBox !== undefined &&
        Math.abs(canvasBox.width - box.width) <= 2 &&
        Math.abs(canvasBox.height - box.height) <= 2 &&
        attributionBox !== undefined &&
        attributionBox.left >= box.left &&
        attributionBox.right <= box.right &&
        attributionBox.top >= box.top &&
        attributionBox.bottom <= box.bottom &&
        getComputedStyle(attribution!).visibility === "visible"
      );
    }),
  ).toBe(true);
}

async function expectLeafletTileCoverage(preview: Locator): Promise<void> {
  await expect
    .poll(() =>
      preview.evaluate((frame) => {
        const canvas = frame.querySelector<HTMLElement>(
          "[data-testid='map-preview-canvas']",
        );
        const pane = frame.querySelector<HTMLElement>(".leaflet-tile-pane");
        const tiles = [...frame.querySelectorAll<HTMLElement>(".leaflet-tile")];
        if (!canvas || !pane || tiles.length === 0) return false;
        const box = canvas.getBoundingClientRect();
        const tileBoxes = tiles.map((tile) => tile.getBoundingClientRect());
        const samples = [0.05, 0.25, 0.5, 0.75, 0.95];
        return samples.every((xRatio) =>
          samples.every((yRatio) => {
            const x = box.left + box.width * xRatio;
            const y = box.top + box.height * yRatio;
            return tileBoxes.some(
              (tile) =>
                x >= tile.left - 1 &&
                x <= tile.right + 1 &&
                y >= tile.top - 1 &&
                y <= tile.bottom + 1,
            );
          }),
        );
      }),
    )
    .toBe(true);
}

async function fulfillEvents(
  page: Page,
  suppliedEvents: ParkEvent[],
): Promise<void> {
  await page.route("**/api/events?*", (route) =>
    route.fulfill({
      json: {
        events: suppliedEvents,
        page: 1,
        pageSize: 12,
        total: suppliedEvents.length,
        totalPages: suppliedEvents.length ? 1 : 0,
      },
    }),
  );
}

test.describe("Issue #26 Leaflet maps", () => {
  test.beforeEach(async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        !(
          (page as AuditedPage).__expectTileFailures &&
          message.text() === "Failed to load resource: net::ERR_FAILED"
        )
      ) {
        errors.push(message.text());
      }
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

  test("renders lazy compact and expanded previews with safe independent OSM activation", async ({
    page,
  }) => {
    await page.goto("/");
    const cards = page.getByTestId("event-card");
    await expect(cards).toHaveCount(events.length);
    await expect(page.getByTestId("map-preview")).toHaveCount(4);
    await expect(page.getByTestId("map-preview-fallback")).toHaveCount(2);

    const first = page.getByTestId("map-preview").first();
    const initialBox = await first.boundingBox();
    await first.scrollIntoViewIfNeeded();
    await expect(first).toHaveAttribute("data-map-status", "ready");
    expect((await first.boundingBox())!.height).toBe(initialBox!.height);
    await expectFrameGeometry(first);
    await expect(
      first.getByRole("link", { name: "© OpenStreetMap contributors" }),
    ).toBeVisible();

    const last = page.getByTestId("map-preview").last();
    await expect(last).toHaveAttribute("data-map-status", "waiting");
    await last.scrollIntoViewIfNeeded();
    await expect(last).toHaveAttribute("data-map-status", "ready");
    await expectFrameGeometry(last);

    const firstCard = cards.first();
    const previewHeight = (await first.boundingBox())!.height;
    await firstCard.getByRole("button", { name: "Show larger map" }).click();
    await expect(first).toHaveAttribute("data-map-variant", "expanded");
    expect((await first.boundingBox())!.height).toBeGreaterThan(previewHeight);
    await expectLeafletTileCoverage(first);
    await expect(
      firstCard.getByRole("link", { name: /View details/ }),
    ).toBeVisible();

    const openMap = first.getByRole("link", { name: /Open .* marker/ });
    const expectedUrl = await openMap.getAttribute("href");
    const popupPromise = page.waitForEvent("popup");
    await openMap.click();
    const popup = await popupPromise;
    await popup.waitForLoadState("domcontentloaded");
    expect(popup.url()).toBe(expectedUrl);
    expect(await popup.evaluate(() => window.opener === null)).toBe(true);
    await popup.close();

    await expect(
      page.getByText("Venue or park:", { exact: false }).first(),
    ).toBeVisible();
    await expect(
      page.getByText("Borough:", { exact: false }).first(),
    ).toBeVisible();
    await expect(page.getByText("Address: Not listed").first()).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });

  test("aggregates exact Location identities and supports accessible keyboard selection", async ({
    page,
  }, testInfo) => {
    await page.goto("/?view=map");
    const map = page.getByTestId("event-map");
    await expect(map).toHaveAttribute("data-map-status", "ready");
    const coordinateMap = page.getByTestId("coordinate-map");
    const mapBox = await map.boundingBox();
    const canvasBox = await coordinateMap.boundingBox();
    expect(canvasBox).toEqual(mapBox);

    const markers = page.getByTestId("map-marker");
    await expect(markers).toHaveCount(3);
    for (const marker of await markers.all()) {
      const box = await marker.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }

    const sharedMarker = page.getByRole("button", {
      name: /Soldiers' and Sailors' Monument.*2 events/,
    });
    await expect(sharedMarker).toHaveAttribute("data-diameter", "22");
    const panel = page.getByRole("complementary", {
      name: "Events at selected location",
    });

    await markers.nth(1).focus();
    await page.keyboard.press("Enter");
    await expect(panel).toContainText(source[1].title);
    await expect(panel).toContainText(multiple.title);
    await expect(panel).not.toContainText(source[0].title);
    await expect(panel.getByText("2 events", { exact: true })).toBeVisible();

    await sharedMarker.focus();
    await page.keyboard.press(" ");
    await expect(panel).toContainText(source[0].title);
    await expect(panel).toContainText(shared.title);
    await expect(panel).toContainText(invalid.title);
    await expect(panel).toContainText(unlocatable.title);
    await expect(
      page.getByText("2 events are available in the list only"),
    ).toBeVisible();

    const toggle = page.getByTestId("list-map-toggle");
    await toggle.getByRole("button", { name: "List", exact: true }).click();
    expect(new URL(page.url()).searchParams.get("view")).toBeNull();
    await page.goBack();
    await expect(
      toggle.getByRole("button", { name: "Map", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      map.getByRole("link", { name: "© OpenStreetMap contributors" }),
    ).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await testInfo.attach(`${testInfo.project.name}-leaflet-location-map`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });

  test("does not initialize the interactive map or request tiles for invalid-only Events", async ({
    page,
  }) => {
    const outOfRange: ParkEvent = {
      ...invalid,
      id: "out-of-range-location",
      guid: "out-of-range-location",
      title: "Invalid Coordinate Event",
      coordinates: [{ latitude: 91, longitude: -74 }],
    };
    await fulfillEvents(page, [invalid, unlocatable, outOfRange]);

    await page.goto("/?view=map");
    await expect(page.getByTestId("event-map")).toHaveAttribute(
      "data-map-status",
      "error",
    );
    await expect(page.getByText("No locations to map")).toBeVisible();
    await expect(page.getByTestId("map-marker")).toHaveCount(0);
    expect((page as AuditedPage).__tileRequests).toEqual([]);
  });

  test("stops interactive tile requests and disables controls after the first terminal failure", async ({
    page,
  }) => {
    const failedRequests: string[] = [];
    (page as AuditedPage).__expectTileFailures = true;
    await page.unroute("https://tile.openstreetmap.org/**");
    await page.route("https://tile.openstreetmap.org/**", (route) => {
      failedRequests.push(route.request().url());
      return route.abort("failed");
    });

    await page.goto("/?view=map");
    const map = page.getByTestId("event-map");
    await expect(map).toHaveAttribute("data-map-status", "error");
    await expect(page.getByText("The street map is unavailable")).toBeVisible();
    const zoomIn = page.getByRole("button", { name: "Zoom in" });
    const zoomOut = page.getByRole("button", { name: "Zoom out" });
    await expect(zoomIn).toBeDisabled();
    await expect(zoomOut).toBeDisabled();

    await expect
      .poll(async () => {
        const before = failedRequests.length;
        await page.waitForTimeout(100);
        return failedRequests.length === before ? before : -1;
      })
      .toBeGreaterThan(0);
    const terminalCount = failedRequests.length;
    await zoomIn.dispatchEvent("click");
    await zoomOut.dispatchEvent("click");
    await page.waitForTimeout(200);
    expect(failedRequests).toHaveLength(terminalCount);
  });

  test("preserves filters and list access without credentials or live services", async ({
    page,
  }) => {
    await page.goto("/?borough=Manhattan&view=map");
    await expect(page.getByTestId("event-map")).toHaveAttribute(
      "data-map-status",
      "ready",
    );
    await expect(
      page.getByRole("link", { name: source[0].title }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: shared.title })).toBeVisible();
    expect(new URL(page.url()).searchParams.get("borough")).toBe("Manhattan");
    expect((page as AuditedPage).__tileRequests!.length).toBeGreaterThan(0);
    expect(
      (page as AuditedPage).__tileRequests!.every((url) =>
        url.startsWith("https://tile.openstreetmap.org/"),
      ),
    ).toBe(true);
  });
});
