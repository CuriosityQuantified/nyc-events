import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import eventList from "../../contracts/golden/events-list.json";
import { apiToUiEvent, type ParkEvent } from "../app/data/events";

const base = apiToUiEvent(eventList.events[0]);

const queensEvent: ParkEvent = {
  ...base,
  id: "queens-1",
  guid: "queens-1",
  title: "Queens Kayak Morning",
  borough: "Queens",
  startDate: "2026-08-20",
  date: "Aug 20, 2026",
};
const manhattanEvent: ParkEvent = {
  ...base,
  id: "manhattan-1",
  guid: "manhattan-1",
  title: "Manhattan Sunset Run",
  borough: "Manhattan",
  startDate: "2026-08-25",
  date: "Aug 25, 2026",
};
const allEvents = [queensEvent, manhattanEvent];

function eventsFor(params: URLSearchParams): ParkEvent[] {
  let filtered = allEvents;
  const borough = params.get("borough");
  if (borough) {
    filtered = filtered.filter((event) => event.borough === borough);
  }
  const from = params.get("date_from");
  if (from) filtered = filtered.filter((e) => (e.startDate ?? "") >= from);
  const to = params.get("date_to");
  if (to) filtered = filtered.filter((e) => (e.startDate ?? "") <= to);
  return filtered;
}

async function installRoutes(page: Page, options: { delayMs?: number } = {}) {
  await page.route("**/api/events?*", async (route) => {
    const params = new URL(route.request().url()).searchParams;
    const filtered = eventsFor(params);
    // Only delay filtered requests so the initial load stays fast.
    if (
      options.delayMs &&
      [...params.keys()].some((k) => k !== "page" && k !== "page_size")
    ) {
      await new Promise((resolve) => setTimeout(resolve, options.delayMs));
    }
    await route.fulfill({
      json: {
        events: filtered,
        page: Number(params.get("page") ?? "1"),
        pageSize: 12,
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
        snapshotRowCount: allEvents.length,
        isStale: false,
      },
    }),
  );
}

async function documentY(page: Page, selector: string): Promise<number> {
  return page
    .locator(selector)
    .first()
    .evaluate((element) => {
      return element.getBoundingClientRect().top + window.scrollY;
    });
}

test.describe("Explore layout stability and interactions", () => {
  test("desktop keeps the results column in place when filters change", async ({
    page,
  }) => {
    test.skip(
      test.info().project.name !== "desktop",
      "grid layout is desktop-only",
    );
    await installRoutes(page);
    await page.goto("/");
    await expect(page.getByTestId("event-card")).toHaveCount(2);

    const results = page.locator('section[aria-label="Filtered events"]');
    const before = await results.boundingBox();
    expect(before).not.toBeNull();
    // The results column must sit beside the filters column, not under it.
    expect(before!.x).toBeGreaterThan(300);

    await page.getByRole("button", { name: "Add Borough: Queens" }).click();
    await expect(page.getByTestId("event-card")).toHaveCount(1);

    // Follow controls appear inside the filters column without displacing
    // or resizing the results column.
    const follow = page.getByTestId("follow-facets");
    await expect(follow).toBeVisible();
    const followBox = await follow.boundingBox();
    const after = await results.boundingBox();
    expect(after!.x).toBe(before!.x);
    expect(after!.width).toBe(before!.width);
    expect(followBox!.x + followBox!.width).toBeLessThanOrEqual(after!.x + 1);
  });

  test("filtering updates in place without swapping to a loading screen", async ({
    page,
  }) => {
    await installRoutes(page, { delayMs: 400 });
    await page.goto("/");
    await expect(page.getByTestId("event-card")).toHaveCount(2);

    const headerSelector = 'section[aria-label="Filtered events"] h2';
    const headerBefore = await documentY(page, headerSelector);

    await page.getByRole("button", { name: "Add Borough: Queens" }).click();

    // While the filtered request is in flight the existing results stay
    // mounted with an inline status instead of a full loading panel.
    await expect(page.getByText("Updating results…")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Loading Current Events…" }),
    ).toHaveCount(0);
    await expect(page.getByTestId("event-list")).toBeVisible();

    await expect(page.getByTestId("event-card")).toHaveCount(1);
    await expect(page.getByTestId("event-card")).toContainText(
      "Queens Kayak Morning",
    );
    const headerAfter = await documentY(page, headerSelector);
    expect(headerAfter).toBe(headerBefore);
  });

  test("exact-date filters bound results, persist in the URL, and clear presets", async ({
    page,
  }) => {
    await installRoutes(page);
    await page.goto("/");
    await expect(page.getByTestId("event-card")).toHaveCount(2);

    const dateFilter = page.getByTestId("exact-date-filter");
    await dateFilter.getByLabel("From").fill("2026-08-21");
    await expect
      .poll(() => new URL(page.url()).searchParams.get("date_from"))
      .toBe("2026-08-21");
    await expect(page.getByTestId("event-card")).toHaveCount(1);
    await expect(page.getByTestId("event-card")).toContainText(
      "Manhattan Sunset Run",
    );

    await dateFilter.getByLabel("To").fill("2026-08-26");
    await expect
      .poll(() => new URL(page.url()).searchParams.get("date_to"))
      .toBe("2026-08-26");

    await page.reload();
    await expect(dateFilter.getByLabel("From")).toHaveValue("2026-08-21");
    await expect(dateFilter.getByLabel("To")).toHaveValue("2026-08-26");
    await expect(page.getByTestId("event-card")).toHaveCount(1);

    // A preset date range replaces exact dates rather than intersecting.
    await page.getByRole("button", { name: "Add Date range: Today" }).click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("date_from"))
      .toBeNull();
    await expect(dateFilter.getByLabel("From")).toHaveValue("");

    // And entering an exact date clears the preset again.
    await dateFilter.getByLabel("From").fill("2026-08-01");
    await expect
      .poll(() => new URL(page.url()).searchParams.get("date"))
      .toBeNull();
  });

  test("following an active filter facet confirms without moving the results", async ({
    page,
  }) => {
    await installRoutes(page);
    let followedBody: unknown = null;
    await page.route("**/api/profile/interests", async (route) => {
      followedBody = route.request().postDataJSON();
      await route.fulfill({
        json: {
          id: "11111111-2222-3333-4444-555555555555",
          facetType: "borough",
          facetValue: "Queens",
          alertEnabled: true,
          origin: "manual",
        },
      });
    });
    await page.goto("/?borough=Queens");
    await expect(page.getByTestId("event-card")).toHaveCount(1);

    const results = page.locator('section[aria-label="Filtered events"]');
    const before = await results.boundingBox();

    const follow = page.getByRole("button", { name: "Follow Queens" });
    await expect(follow).toBeVisible();
    await follow.click();
    await expect(
      page.getByRole("button", { name: /Following Queens/ }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(followedBody).toEqual({
      facet_type: "borough",
      facet_value: "Queens",
      alert_enabled: true,
    });

    const after = await results.boundingBox();
    expect(after!.x).toBe(before!.x);
    expect(after!.width).toBe(before!.width);
  });

  test("a multi-filter combination can be followed as one Interest", async ({
    page,
  }) => {
    await installRoutes(page);
    let compositeBody: unknown = null;
    await page.route("**/api/profile/interests", async (route) => {
      compositeBody = route.request().postDataJSON();
      await route.fulfill({
        json: {
          id: "22222222-3333-4444-5555-666666666666",
          facetType: "composite",
          facetValue: "Queens + Family",
          facets: [
            { facetType: "borough", facetValue: "Queens" },
            { facetType: "category", facetValue: "Best for Kids" },
          ],
          alertEnabled: true,
          origin: "manual",
        },
      });
    });
    await page.goto("/?borough=Queens&category=Best%20for%20Kids");

    const combined = page.getByRole("button", {
      name: "Follow Queens + Family (combined)",
    });
    await expect(combined).toBeVisible();
    await combined.click();
    await expect(
      page.getByRole("button", { name: /Following Queens \+ Family/ }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(compositeBody).toEqual({
      facets: [
        { facet_type: "borough", facet_value: "Queens" },
        { facet_type: "category", facet_value: "Best for Kids" },
      ],
      alert_enabled: true,
    });

    // The individual follow buttons remain available beside the combination.
    await expect(
      page.getByRole("button", { name: "Follow Queens", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Follow Family", exact: true }),
    ).toBeVisible();
  });

  test("hearting an event keeps the card in place and toggles state", async ({
    page,
  }) => {
    await installRoutes(page);
    await page.route("**/api/profile/saved/queens-1", (route) => {
      if (route.request().method() === "PUT") {
        return route.fulfill({
          json: { profile_id: "p1", event_guid: "queens-1", saved: true },
        });
      }
      return route.fulfill({ status: 204, body: "" });
    });
    await page.goto("/");
    const card = page.locator('[data-event-guid="queens-1"]');
    const heart = card.getByTestId("save-heart");
    await card.scrollIntoViewIfNeeded();
    const cardBefore = await documentY(page, '[data-event-guid="queens-1"]');

    await heart.click();
    await expect(heart).toHaveAttribute("aria-pressed", "true");
    const cardAfter = await documentY(page, '[data-event-guid="queens-1"]');
    expect(cardAfter).toBe(cardBefore);

    await heart.click();
    await expect(heart).toHaveAttribute("aria-pressed", "false");
  });
});
