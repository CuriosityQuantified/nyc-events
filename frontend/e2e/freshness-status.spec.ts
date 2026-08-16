import { expect, test } from "./fixtures";
import type { Locator, Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import eventDetail from "../../contracts/golden/event-detail.json";
import eventList from "../../contracts/golden/events-list.json";
import { apiToUiEvent } from "../app/data/events";

const COVERAGE_LABEL =
  "Upcoming events currently present in NYC Parks’ rolling 14-day feed";
const sourceEvents = eventList.events.map(apiToUiEvent);
const lifecycleEvents = [
  { ...sourceEvents[0], lifecycleStatus: "cancelled" as const },
  { ...sourceEvents[1], lifecycleStatus: "expired" as const },
  {
    ...sourceEvents[0],
    id: "removed-event",
    guid: "removed-event",
    title: "Event absent from latest feed",
    lifecycleStatus: "removed" as const,
  },
];

type AuditedPage = Page & { __issue17Errors?: string[] };

async function installRoutes(page: Page, isStale = false): Promise<void> {
  await page.route("**/api/events?*", (route) =>
    route.fulfill({
      json: {
        events: lifecycleEvents,
        page: 1,
        pageSize: 12,
        total: lifecycleEvents.length,
        totalPages: 1,
      },
    }),
  );
  await page.route("**/api/events/*", (route) =>
    route.fulfill({
      json: {
        ...eventDetail,
        lifecycle_status: {
          value: "cancelled",
          provenance: "Stated",
          raw: "Cancelled",
        },
      },
    }),
  );
  await page.route("**/api/profile/saved**", (route) =>
    route.fulfill({
      json: { events: [], page: 1, pageSize: 100, total: 0 },
    }),
  );
  await page.route("**/api/freshness", (route) =>
    route.fulfill({
      json: {
        lastSuccessfulSync: "2026-08-16T12:00:00Z",
        snapshotRowCount: lifecycleEvents.length,
        isStale,
      },
    }),
  );
}

async function expectInsideViewport(locator: Locator): Promise<void> {
  expect(
    await locator.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return (
        box.width > 0 &&
        box.height > 0 &&
        box.left >= 0 &&
        box.top >= 0 &&
        box.right <= window.innerWidth &&
        box.bottom <= window.innerHeight
      );
    }),
  ).toBe(true);
}

test.describe("Issue #17 freshness and Event lifecycle states", () => {
  test.beforeEach(async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    (page as AuditedPage).__issue17Errors = errors;
    await page.emulateMedia({ colorScheme: "light" });
    await installRoutes(page);
  });

  test.afterEach(async ({ page }) => {
    expect(
      (page as AuditedPage).__issue17Errors,
      "console and page errors",
    ).toEqual([]);
  });

  test("keeps freshness global and distinguishes cancelled, expired, and removed Events", async ({
    page,
  }, testInfo) => {
    await page.goto("/");

    const banner = page.getByTestId("freshness-banner");
    await expect(banner).toHaveAttribute("data-state", "current");
    await expect(banner).toContainText("Official data updated");
    await expect(banner).toContainText(COVERAGE_LABEL);
    await expectInsideViewport(banner);

    const cards = page.getByTestId("event-card");
    await expect(cards).toHaveCount(3);
    await expect(cards.nth(0)).toContainText("Officially cancelled");
    await expect(cards.nth(1)).toContainText("Event ended");
    await expect(cards.nth(2)).toContainText("Not in latest feed");
    await expect(cards.nth(2)).not.toContainText("Officially cancelled");

    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await testInfo.attach(`${testInfo.project.name}-issue-17-list`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });

    const details = cards
      .nth(0)
      .getByRole("link", { name: /View details for/ });
    await details.scrollIntoViewIfNeeded();
    await details.focus();
    await page.keyboard.press("Enter");

    const notice = page.getByTestId("event-lifecycle-notice");
    await expect(notice).toContainText("Officially cancelled");
    await expect(notice).toContainText("NYC Parks marked this Event");
    const detailBanner = page.getByTestId("freshness-banner");
    await expect(detailBanner).toContainText(COVERAGE_LABEL);
    await expectInsideViewport(detailBanner);
    await notice.scrollIntoViewIfNeeded();
    await expectInsideViewport(notice);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await testInfo.attach(`${testInfo.project.name}-issue-17-detail`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });

  test("uses the exact stale-data warning on list and detail screens", async ({
    page,
  }) => {
    await installRoutes(page, true);
    await page.goto("/");

    const banner = page.getByTestId("freshness-banner");
    await expect(banner).toHaveAttribute("data-state", "stale");
    await expect(banner).toContainText(
      "Data may be stale — last successful sync was",
    );
    await expect(banner).toContainText(COVERAGE_LABEL);

    await page.goto(`/events/${encodeURIComponent(eventDetail.guid)}`);
    await expect(page.getByTestId("freshness-banner")).toHaveAttribute(
      "data-state",
      "stale",
    );
    await expect(page.getByTestId("freshness-banner")).toContainText(
      COVERAGE_LABEL,
    );
  });
});
