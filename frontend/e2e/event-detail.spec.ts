import { expect, test } from "./fixtures";
import type { Locator, Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import eventDetail from "../../contracts/golden/event-detail.json";
import eventList from "../../contracts/golden/events-list.json";
import { apiToUiEvent } from "../app/data/events";

const listEvent = apiToUiEvent(eventList.events[0]);
type AuditedPage = Page & { __detailErrors?: string[] };
const SCREENSHOT_MAX_DIFF_PIXEL_RATIO = 0.05;

async function installRoutes(page: Page): Promise<void> {
  await page.route("**/api/events?*", async (route) => {
    await route.fulfill({
      json: {
        events: [listEvent],
        page: 1,
        pageSize: 12,
        total: 1,
        totalPages: 1,
      },
    });
  });
  await page.route("**/api/events/*", async (route) => {
    await route.fulfill({ json: eventDetail });
  });
  await page.route("**/api/profile/saved**", (route) =>
    route.fulfill({
      json: { events: [], page: 1, pageSize: 100, total: 0 },
    }),
  );
  await page.route("**/api/freshness", async (route) => {
    await route.fulfill({
      json: {
        lastSuccessfulSync: "2026-08-16T12:00:00Z",
        snapshotRowCount: 1,
        isStale: false,
      },
    });
  });
}

async function expectTargetInViewport(locator: Locator): Promise<void> {
  await locator.evaluate((element) =>
    element.scrollIntoView({ block: "center", behavior: "auto" }),
  );
  expect(
    await locator.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return (
        box.width >= 44 &&
        box.height >= 44 &&
        box.left >= 0 &&
        box.top >= 0 &&
        box.right <= window.innerWidth &&
        box.bottom <= window.innerHeight
      );
    }),
  ).toBe(true);
}

test.describe("Issue #14 event detail", () => {
  test.beforeEach(async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    (page as AuditedPage).__detailErrors = errors;
    await page.emulateMedia({ colorScheme: "light" });
    await installRoutes(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    const expectedErrors = testInfo.title.includes("missing detail")
      ? [
          "Failed to load resource: the server responded with a status of 404 (Not Found)",
        ]
      : [];
    expect(
      (page as AuditedPage).__detailErrors,
      "console and page errors",
    ).toEqual(expectedErrors);
  });

  test("detail journey makes no Static Maps thumbnail request", async ({
    page,
  }) => {
    const thumbnailRequests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).pathname === "/api/maps/thumbnail") {
        thumbnailRequests.push(request.url());
      }
    });

    await page.goto(`/events/${encodeURIComponent(eventDetail.guid)}`, {
      waitUntil: "networkidle",
    });
    await expect(
      page.getByRole("heading", { level: 1, name: eventDetail.title.value }),
    ).toBeVisible();
    await expect(page.getByTestId("map-thumbnail")).toHaveCount(0);
    await expect(page.getByTestId("map-thumbnail-fallback")).toHaveCount(0);
    expect(thumbnailRequests).toEqual([]);
  });

  test("opens a grounded detail, exposes provenance, and returns to filters", async ({
    page,
  }, testInfo) => {
    const filters =
      "borough=Manhattan&category=Fitness&date=next14&registration=not_listed";
    await page.goto(`/?${filters}`);
    await page
      .getByRole("link", { name: `View details for ${listEvent.title}` })
      .click();

    await expect(page).toHaveURL(new RegExp(`/events/.+\\?${filters}`));
    await expect(
      page.getByRole("heading", { level: 1, name: eventDetail.title.value }),
    ).toBeVisible();
    await expect(page.getByText(eventDetail.description.value)).toBeVisible();
    await expect(
      page.getByText("Accessibility details are not provided"),
    ).toBeVisible();
    await expect(
      page.getByText("Cost information is not listed"),
    ).toBeVisible();
    await expect(page.getByText("Inaccessible", { exact: true })).toHaveCount(
      0,
    );
    await expect(page.getByText("Free", { exact: true })).toHaveCount(0);
    await expect(
      page.locator('[data-provenance="Stated"]').first(),
    ).toBeVisible();
    await expect(
      page.locator('[data-provenance="Derived"]').first(),
    ).toBeVisible();
    await expect(
      page.locator('[data-provenance="Not listed"]').first(),
    ).toBeVisible();
    await expect(page).toHaveScreenshot("event-detail-light.png", {
      animations: "disabled",
      maxDiffPixelRatio: SCREENSHOT_MAX_DIFF_PIXEL_RATIO,
    });

    const source = page.getByRole("link", {
      name: /Open official NYC Parks listing/,
    });
    await expect(source).toHaveAttribute(
      "href",
      eventDetail.official_event_url.value,
    );
    await expectTargetInViewport(source);

    if (testInfo.project.name === "mobile") {
      const [sourceBox, navBox] = await Promise.all([
        source.boundingBox(),
        page.getByTestId("bottom-nav").boundingBox(),
      ]);
      expect(sourceBox).not.toBeNull();
      expect(navBox).not.toBeNull();
      expect(sourceBox!.y + sourceBox!.height).toBeLessThanOrEqual(
        navBox!.y - 8,
      );
    }

    if (testInfo.project.name === "desktop") {
      const [summaryBox, aboutBox] = await Promise.all([
        page.getByTestId("event-summary").boundingBox(),
        page.getByRole("heading", { name: "About this event" }).boundingBox(),
      ]);
      expect(summaryBox).not.toBeNull();
      expect(aboutBox).not.toBeNull();
      const storyGap = aboutBox!.y - (summaryBox!.y + summaryBox!.height);
      expect(storyGap).toBeGreaterThanOrEqual(32);
      expect(storyGap).toBeLessThanOrEqual(96);
    }

    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await testInfo.attach(`${testInfo.project.name}-event-detail`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });

    const back = page.getByRole("link", { name: "Back to filtered events" });
    await expectTargetInViewport(back);
    await back.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new RegExp(`/?\\?${filters}#main-content$`));
    await expect(page.getByTestId("event-card")).toHaveCount(1);
  });

  test("renders a complete accessible dark theme", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(`/events/${encodeURIComponent(eventDetail.guid)}`);

    await expect(
      page.getByRole("heading", { level: 1, name: eventDetail.title.value }),
    ).toBeVisible();
    await expect(page).toHaveScreenshot("event-detail-dark.png", {
      animations: "disabled",
      maxDiffPixelRatio: SCREENSHOT_MAX_DIFF_PIXEL_RATIO,
    });
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });

  test("fails closed for a missing detail without losing the return path", async ({
    page,
  }) => {
    await page.unroute("**/api/events/*");
    await page.route("**/api/events/*", (route) =>
      route.fulfill({ status: 404, json: { error: "Event not found" } }),
    );
    await page.goto("/events/missing?borough=Queens");

    await expect(
      page.getByRole("heading", { level: 1, name: "Event not found" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Back to filtered events" }),
    ).toHaveAttribute("href", "/?borough=Queens#main-content");
  });
});
