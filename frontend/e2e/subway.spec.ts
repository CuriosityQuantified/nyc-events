import AxeBuilder from "@axe-core/playwright";
import { expect, OSM_TILE_PNG, test } from "./fixtures";
import type { Page } from "@playwright/test";
import type { ParkEvent } from "@/app/data/events";

const subwayFilteredEvent: ParkEvent = {
  id: "subway-event-1",
  guid: "subway-event-1",
  title: "Tai Chi in Riverside Park",
  location: "Riverside Park",
  locationId: "M072",
  coordinates: [{ latitude: 40.792, longitude: -73.979 }],
  positionAccuracy: "exact",
  borough: "Manhattan",
  category: "Fitness",
  categories: ["Fitness"],
  startDate: "2026-08-22",
  date: "Aug 22, 2026",
  time: "8:00 AM",
  costType: "Not listed",
  registration: "Registration not listed",
  registrationStatus: "not_listed",
  accessibility:
    "Accessibility information is not mentioned in the official listing",
  imageAlt: "Fitness event at Riverside Park",
  officialUrl: "https://www.nycgovparks.org/events/test",
  lifecycleStatus: null,
  description: "Morning tai chi class.",
  startDateTime: "2026-08-22T08:00:00-04:00",
  endDateTime: "2026-08-22T09:30:00-04:00",
  endDate: "2026-08-22",
  subwayProximity: {
    lineId: "1",
    nearestStop: { id: "121", name: "86 St" },
    straightLineDistanceMiles: 0.22,
  },
};

const unfilteredEvent: ParkEvent = {
  ...subwayFilteredEvent,
  id: "unfiltered-event-1",
  guid: "unfiltered-event-1",
  title: "Morning Yoga in Central Park",
  subwayProximity: null,
};

function makeResponse(
  events: unknown[],
  options?: { transitSource?: boolean },
) {
  return {
    events,
    page: 1,
    pageSize: 12,
    total: events.length,
    totalPages: events.length > 0 ? 1 : 0,
    ...(options?.transitSource
      ? {
          transitSource: {
            id: "mta-nyct-subway-gtfs",
            attribution: "Metropolitan Transportation Authority (MTA)",
            sourceUrl: "https://rrgtfsfeeds.s3.amazonaws.com/gtfs_subway.zip",
            lastUpdated: "2026-08-07T12:10:36+00:00",
          },
        }
      : {}),
  };
}

type AuditedPage = Page & { __errors?: string[] };

async function installContractRoutes(page: Page): Promise<void> {
  await page.route("https://tile.openstreetmap.org/**", (route) =>
    route.fulfill({ body: OSM_TILE_PNG, contentType: "image/png" }),
  );
  await page.route("**/api/events?*", async (route) => {
    const params = new URL(route.request().url()).searchParams;
    const subwayLine = params.get("subway_line");
    if (subwayLine) {
      await route.fulfill({
        json: makeResponse([subwayFilteredEvent], { transitSource: true }),
      });
    } else {
      await route.fulfill({
        json: makeResponse([unfilteredEvent]),
      });
    }
  });
  await page.route("**/api/profile/saved**", (route) =>
    route.fulfill({
      json: { events: [], page: 1, pageSize: 100, total: 0 },
    }),
  );
  await page.route("**/api/freshness", (route) =>
    route.fulfill({
      json: {
        lastSuccessfulSync: "2026-08-22T12:00:00Z",
        snapshotRowCount: 1,
        isStale: false,
      },
    }),
  );
}

test.describe("Issue #28 subway line selector and overlay", () => {
  test.beforeEach(async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    (page as AuditedPage).__errors = errors;
    await installContractRoutes(page);
  });

  test.afterEach(async ({ page }) => {
    expect((page as AuditedPage).__errors, "console and page errors").toEqual(
      [],
    );
  });

  test("line selector is keyboard accessible", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("event-card")).toHaveCount(1);

    const select = page.getByRole("combobox", { name: "Subway line filter" });
    await expect(select).toBeVisible();
    await select.focus();
    await expect(select).toBeFocused();

    // Tab away and back
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(select).toBeFocused();
  });

  test("selecting a line filters events and shows proximity info", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("event-card")).toHaveCount(1);

    // Select subway line 1
    await page
      .getByRole("combobox", { name: "Subway line filter" })
      .selectOption("1");

    // Wait for new event card with proximity
    await expect(page.getByTestId("nearest-station")).toBeVisible();
    await expect(page.getByTestId("nearest-station")).toContainText("86 St");
    await expect(page.getByTestId("straight-line-distance")).toContainText(
      "Straight-line distance: 0.22 mi",
    );

    // Verify the URL has subway_line param
    await expect
      .poll(() => new URL(page.url()).searchParams.get("subway_line"))
      .toBe("1");
  });

  test("clearing line selection removes proximity info", async ({ page }) => {
    await page.goto("/?subway_line=1");
    await expect(page.getByTestId("nearest-station")).toBeVisible();

    // Clear the selection
    await page
      .getByRole("combobox", { name: "Subway line filter" })
      .selectOption("");

    // Proximity info should disappear
    await expect(page.getByTestId("nearest-station")).toHaveCount(0);
    await expect(page.getByTestId("straight-line-distance")).toHaveCount(0);

    // URL should not have subway_line
    await expect
      .poll(() => new URL(page.url()).searchParams.get("subway_line"))
      .toBeNull();
  });

  test("line filter composes with other filters", async ({ page }) => {
    await page.goto("/");

    // Select subway line
    await page
      .getByRole("combobox", { name: "Subway line filter" })
      .selectOption("1");

    // Also select a borough filter
    await page.getByRole("button", { name: "Add Borough: Manhattan" }).click();

    // Both should be in the URL
    await expect
      .poll(() => {
        const params = new URL(page.url()).searchParams;
        return {
          subway_line: params.get("subway_line"),
          borough: params.get("borough"),
        };
      })
      .toEqual({ subway_line: "1", borough: "Manhattan" });
  });

  test("loads with subway_line preset in URL", async ({ page }) => {
    await page.goto("/?subway_line=1");

    const select = page.getByRole("combobox", { name: "Subway line filter" });
    await expect(select).toHaveValue("1");
    await expect(page.getByTestId("nearest-station")).toBeVisible();
  });

  test("renders the full overlay, synchronized results, accessible stop selection, and stable geometry", async ({
    page,
  }, testInfo) => {
    await page.goto("/?subway_line=1&view=map");

    const map = page.getByTestId("event-map");
    await expect(map).toHaveAttribute("data-map-status", "ready");
    await expect(page.locator(".leaflet-routeOverlay-pane path")).toHaveCount(
      1,
    );
    await expect(page.getByTestId("stop-marker")).toHaveCount(38);
    await expect(page.getByTestId("map-marker")).toHaveCount(1);
    await expect(
      page.getByRole("link", { name: /Metropolitan Transportation Authority/ }),
    ).toBeVisible();
    await expect(page.getByText(/updated Aug 7, 2026/)).toBeVisible();
    await expect(
      map.getByRole("link", { name: "© OpenStreetMap contributors" }),
    ).toBeVisible();

    const stop = page.getByRole("combobox", { name: "Nearby stop" });
    await stop.selectOption("121");
    await expect(page.getByText("1 Event nearest to this stop")).toBeVisible();
    await expect(
      page
        .getByTestId("subway-line-summary")
        .getByText(subwayFilteredEvent.title),
    ).toBeVisible();

    await page
      .getByTestId("list-map-toggle")
      .getByRole("button", { name: "List", exact: true })
      .click();
    await expect(page.getByTestId("event-card")).toHaveCount(1);
    await page
      .getByRole("button", { name: "Select event and nearest stop" })
      .click();
    await expect(stop).toHaveValue("121");

    expect(
      await page.evaluate(() => {
        const mapElement = document.querySelector<HTMLElement>(
          "[data-testid='event-map']",
        );
        if (!mapElement) return false;
        const box = mapElement.getBoundingClientRect();
        return (
          document.documentElement.scrollWidth <= window.innerWidth &&
          box.width > 0 &&
          box.height > 0 &&
          box.left >= 0 &&
          box.right <= window.innerWidth
        );
      }),
    ).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await testInfo.attach(`${testInfo.project.name}-issue-28-subway`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });

  test("keeps the route and stop controls available when no Events match", async ({
    page,
  }) => {
    await page.route("**/api/events?*", async (route) => {
      const params = new URL(route.request().url()).searchParams;
      await route.fulfill({
        json: params.get("subway_line")
          ? makeResponse([], { transitSource: true })
          : makeResponse([unfilteredEvent]),
      });
    });
    await page.goto("/?subway_line=1&view=map");

    await expect(page.getByTestId("filter-empty-state")).toContainText(
      "No events match these filters",
    );
    await expect(page.getByTestId("event-map")).toHaveAttribute(
      "data-map-status",
      "ready",
    );
    await expect(page.getByTestId("stop-marker")).toHaveCount(38);
    await expect(
      page.getByRole("combobox", { name: "Nearby stop" }),
    ).toBeVisible();
  });

  test("shows a failed proximity request without erasing usable Event data", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: unfilteredEvent.title }),
    ).toBeVisible();
    await page.route("**/api/events?*", async (route) => {
      const params = new URL(route.request().url()).searchParams;
      if (params.get("subway_line")) {
        await route.fulfill({ json: { error: "Unavailable" } });
      } else {
        await route.fulfill({ json: makeResponse([unfilteredEvent]) });
      }
    });

    await page
      .getByRole("combobox", { name: "Subway line filter" })
      .selectOption("1");
    await expect(
      page.getByRole("heading", { name: "Events Are Unavailable" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: unfilteredEvent.title }),
    ).toBeVisible();
  });
});
