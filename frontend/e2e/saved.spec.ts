import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

function newYorkToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

const todayIso = newYorkToday();

const savedEvent = {
  id: "e-saved-1",
  guid: "e-saved-1",
  title: "Sunset Kayaking",
  location: "Hudson River Park",
  locationId: null,
  coordinates: [],
  positionAccuracy: "not-listed",
  borough: "Manhattan",
  category: "Sports",
  categories: ["Sports"],
  startDate: todayIso,
  date: "Today",
  time: "6:00 PM",
  costType: "Free",
  registration: "Registration not listed",
  registrationStatus: "not_listed",
  accessibility: "Accessibility information not listed",
  imageAlt: "Sports event at Hudson River Park",
  officialUrl: "https://www.nycgovparks.org/events/e-saved-1",
  lifecycleStatus: "current",
  description: "Paddle at golden hour.",
  startDateTime: `${todayIso}T18:00:00-04:00`,
  endDateTime: `${todayIso}T19:00:00-04:00`,
  endDate: todayIso,
};

test.describe("Saved tab with List/Calendar views", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/profile/saved**", (route) =>
      route.fulfill({
        json: { events: [savedEvent], page: 1, pageSize: 100, total: 1 },
      }),
    );
    await page.route("**/api/profile/matches**", (route) =>
      route.fulfill({
        json: { events: [], page: 1, pageSize: 100, total: 0 },
      }),
    );
    await page.route("**/api/events?*", (route) =>
      route.fulfill({
        json: { events: [], page: 1, pageSize: 12, total: 0, totalPages: 0 },
      }),
    );
    await page.route("**/api/freshness", (route) =>
      route.fulfill({
        json: {
          lastSuccessfulSync: "2026-08-16T12:00:00Z",
          snapshotRowCount: 1,
          isStale: false,
        },
      }),
    );
    await page.goto("/saved");
  });

  test("list view shows the Saved Event with calendar export options", async ({
    page,
  }) => {
    const list = page.getByTestId("saved-list");
    await expect(list).toBeVisible();
    const card = list.getByTestId("event-card");
    await expect(card).toHaveAttribute("data-event-guid", "e-saved-1");

    const heart = list.getByTestId("save-heart");
    await expect(heart).toHaveAttribute("aria-pressed", "true");

    const exportMenu = page.getByTestId("add-to-calendar").first();
    await exportMenu.locator("summary").click();
    const google = exportMenu.getByRole("link", { name: /Google Calendar/ });
    await expect(google).toHaveAttribute(
      "href",
      /calendar\.google\.com\/calendar\/render\?action=TEMPLATE/,
    );
    const apple = exportMenu.getByRole("link", { name: /Apple Calendar/ });
    await expect(apple).toHaveAttribute("download", "eventmatch-e-saved-1.ics");
    await expect(apple).toHaveAttribute("href", /^data:text\/calendar/);
  });

  test("calendar view places the Event on its date and survives back/forward", async ({
    page,
  }) => {
    await page
      .getByTestId("saved-view-toggle")
      .getByRole("button", { name: "Calendar", exact: true })
      .click();
    await expect(page.getByTestId("saved-calendar")).toBeVisible();
    expect(new URL(page.url()).searchParams.get("view")).toBe("calendar");

    const day = page.getByRole("button", { name: /1 saved event$/ });
    await day.click();
    await expect(page.getByTestId("saved-day-list")).toBeVisible();
    expect(new URL(page.url()).searchParams.get("day")).toBe(todayIso);

    await page.reload();
    await expect(page.getByTestId("saved-day-list")).toBeVisible();

    await page.goBack();
    await page.goBack();
    await expect(page.getByTestId("saved-list")).toBeVisible();
  });

  test("month navigation moves forward, backward, and back to today", async ({
    page,
  }) => {
    await page
      .getByTestId("saved-view-toggle")
      .getByRole("button", { name: "Calendar", exact: true })
      .click();
    const calendar = page.getByTestId("saved-calendar");
    const monthTitle = calendar.getByRole("heading", { level: 2 });
    const startingMonth = await monthTitle.textContent();

    await calendar.getByRole("button", { name: "Next month" }).click();
    await expect(monthTitle).not.toHaveText(startingMonth ?? "");

    await calendar.getByRole("button", { name: "Today" }).click();
    await expect(monthTitle).toHaveText(startingMonth ?? "");
  });

  test("has no automatically detectable accessibility violations", async ({
    page,
  }) => {
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("Matches inside the Saved destination", () => {
  const matchEvent = {
    ...savedEvent,
    id: "e-match-1",
    guid: "e-match-1",
    title: "Beginner Birding",
  };

  test.beforeEach(async ({ page }) => {
    let matchesDismissed = false;
    let matchesPromoted = false;
    await page.route("**/api/profile/saved**", (route) =>
      route.fulfill({
        json: { events: [savedEvent], page: 1, pageSize: 100, total: 1 },
      }),
    );
    await page.route("**/api/profile/matches?*", (route) =>
      route.fulfill({
        json:
          matchesDismissed || matchesPromoted
            ? { events: [], page: 1, pageSize: 100, total: 0 }
            : { events: [matchEvent], page: 1, pageSize: 100, total: 1 },
      }),
    );
    await page.route("**/api/profile/matches/e-match-1", (route) => {
      if (route.request().method() === "PUT") {
        matchesPromoted = true;
        return route.fulfill({
          json: {
            profile_id: "p1",
            event_guid: "e-match-1",
            matched: false,
            saved: true,
          },
        });
      }
      matchesDismissed = true;
      return route.fulfill({ status: 204, body: "" });
    });
    await page.goto("/saved");
  });

  test("a Match stays separate from Saved and can be promoted", async ({
    page,
  }) => {
    const matches = page.getByTestId("matches-section");
    await expect(matches).toBeVisible();
    const matchesList = matches.getByTestId("matches-list");
    await expect(matchesList.getByText("Beginner Birding")).toBeVisible();
    await expect(
      page.getByTestId("saved-list").getByText("Beginner Birding"),
    ).toHaveCount(0);

    await matches.getByRole("button", { name: "Add to Saved" }).click();
    await expect(matches.getByTestId("matches-empty")).toBeVisible();
  });

  test("a Match can be dismissed", async ({ page }) => {
    const matches = page.getByTestId("matches-section");
    await matches
      .getByRole("button", { name: "Dismiss Beginner Birding" })
      .click();
    await expect(matches.getByTestId("matches-empty")).toBeVisible();
  });
});
