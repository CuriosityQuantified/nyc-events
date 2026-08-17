import { expect, test } from "./fixtures";
import type { Locator } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import eventList from "../../contracts/golden/events-list.json";
import { apiToUiEvent } from "../app/data/events";

const firstPage = eventList.events.map(apiToUiEvent);
const nextEvent = {
  ...firstPage[1],
  id: "next-page-guid",
  guid: "next-page-guid",
  title: "Next page event",
};

type AuditedPage = Record<string, string[]>;

async function expectInViewport(locator: Locator) {
  const intersects = await locator.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return (
      box.width > 0 &&
      box.height > 0 &&
      box.right > 0 &&
      box.bottom > 0 &&
      box.left < window.innerWidth &&
      box.top < window.innerHeight
    );
  });
  expect(intersects).toBe(true);
}

test.describe("EventMatch NYC Walking Skeleton", () => {
  test.beforeEach(async ({ page }) => {
    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    page.on("pageerror", (err) => {
      consoleErrors.push(err.message);
    });

    await page.route("**/api/events?*", async (route) => {
      const requestedPage = Number(
        new URL(route.request().url()).searchParams.get("page"),
      );
      const events =
        requestedPage === 1 ? firstPage : [firstPage[0], nextEvent];
      await route.fulfill({
        json: {
          events,
          page: requestedPage,
          pageSize: 12,
          total: 3,
          totalPages: 2,
        },
      });
    });
    await page.route("https://tile.openstreetmap.org/**", (route) =>
      route.fulfill({
        body: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          "base64",
        ),
        contentType: "image/png",
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
          snapshotRowCount: 3,
          isStale: false,
        },
      }),
    );

    await page.goto("/");

    // Store errors for assertions after every journey.
    (page as unknown as AuditedPage).__consoleErrors = consoleErrors;
  });

  test.afterEach(async ({ page }) => {
    const errors = (page as unknown as AuditedPage).__consoleErrors ?? [];
    expect(errors, "console and page errors").toEqual([]);
  });

  test("page loads without uncaught exceptions", async ({ page }) => {
    const errors = (page as unknown as AuditedPage).__consoleErrors;
    expect(errors).toEqual([]);
  });

  test("has no automatically detectable accessibility violations", async ({
    page,
  }) => {
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("exact EventMatch NYC brand and canonical origin are rendered", async ({
    page,
  }) => {
    const header = page.getByTestId("header");
    await expect(header).toBeVisible();

    // The brand renders exactly once per viewport: the sidebar owns it on
    // desktop, the header owns it on phone. Hidden elements expose no
    // accessible role, so each viewport reads only its own brand.
    const isDesktop = (page.viewportSize()?.width ?? 0) >= 1024;
    if (isDesktop) {
      const sidebar = page.getByTestId("desktop-sidebar");
      await expect(sidebar).toBeVisible();
      await expect(sidebar.getByRole("heading", { level: 1 })).toHaveText(
        "EventMatch NYC",
      );
      await expect(page.getByTestId("header-brand")).toBeHidden();
    } else {
      await expect(header.getByRole("heading", { level: 1 })).toHaveText(
        "EventMatch NYC",
      );
      await expect(page.getByTestId("desktop-sidebar")).toBeHidden();
    }

    await expect(page).toHaveTitle("EventMatch NYC");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://eventmatch.nyc",
    );
  });

  test("current API events are rendered in source order", async ({ page }) => {
    const cards = page.getByTestId("event-card");
    await expect(cards).toHaveCount(2);
    await expect(cards.nth(0)).toHaveAttribute(
      "data-event-guid",
      firstPage[0].guid,
    );
    await expect(cards.nth(1)).toHaveAttribute(
      "data-event-guid",
      firstPage[1].guid,
    );
  });

  test("load more preserves position and removes duplicate guids", async ({
    page,
  }) => {
    const button = page.getByTestId("load-more");
    await button.scrollIntoViewIfNeeded();
    const anchor = page.getByTestId("event-card").nth(1);
    const before = await anchor.evaluate(
      (element) => element.getBoundingClientRect().top,
    );
    await button.click();

    const cards = page.getByTestId("event-card");
    await expect(cards).toHaveCount(3);
    const guids = await cards.evaluateAll((items) =>
      items.map((item) => item.getAttribute("data-event-guid")),
    );
    expect(new Set(guids).size).toBe(3);
    await expect
      .poll(() =>
        anchor.evaluate((element) => element.getBoundingClientRect().top),
      )
      .toBeCloseTo(before, 0);
  });

  test("load-more failure keeps results and retries the failed page", async ({
    page,
  }) => {
    await expect(page.getByTestId("event-card")).toHaveCount(2);
    await page.unroute("**/api/events?*");
    let pageTwoAttempts = 0;
    await page.route("**/api/events?*", async (route) => {
      const requestedPage = Number(
        new URL(route.request().url()).searchParams.get("page"),
      );
      if (requestedPage === 2 && pageTwoAttempts++ === 0) {
        await route.fulfill({ status: 503 });
        return;
      }
      await route.fulfill({
        json: {
          events: requestedPage === 1 ? firstPage : [firstPage[0], nextEvent],
          page: requestedPage,
          pageSize: 12,
          total: 3,
          totalPages: 2,
        },
      });
    });

    const button = page.getByTestId("load-more");
    await button.scrollIntoViewIfNeeded();
    const anchor = page.getByTestId("event-card").nth(1);
    const before = await anchor.evaluate(
      (element) => element.getBoundingClientRect().top,
    );
    await button.click();
    await expect(page.getByTestId("event-card")).toHaveCount(2);
    await expect(
      page.getByRole("button", { name: "Try Loading More Again" }),
    ).toBeVisible();
    await expect
      .poll(() =>
        anchor.evaluate((element) => element.getBoundingClientRect().top),
      )
      .toBeCloseTo(before, 0);

    const auditedPage = page as unknown as AuditedPage;
    auditedPage.__consoleErrors = (auditedPage.__consoleErrors ?? []).filter(
      (error) => !error.includes("503 (Service Unavailable)"),
    );
    const retryButton = page.getByRole("button", {
      name: "Try Loading More Again",
    });
    await retryButton.evaluate((element) =>
      element.scrollIntoView({ block: "center" }),
    );
    const retryAnchorPosition = await anchor.evaluate(
      (element) => element.getBoundingClientRect().top,
    );
    const retryBox = await retryButton.boundingBox();
    expect(retryBox).not.toBeNull();
    await page.mouse.click(
      retryBox!.x + retryBox!.width / 2,
      retryBox!.y + retryBox!.height / 2,
    );
    await expect(page.getByTestId("event-card")).toHaveCount(3);
    await expect
      .poll(() =>
        anchor.evaluate((element) => element.getBoundingClientRect().top),
      )
      .toBeCloseTo(retryAnchorPosition, 0);
  });

  test("freshness failure does not suppress valid events", async ({ page }) => {
    await page.unroute("**/api/freshness");
    await page.route("**/api/freshness", (route) =>
      route.fulfill({ status: 503 }),
    );
    await page.reload();

    await expect(page.getByTestId("event-card")).toHaveCount(2);
    await expect(page.getByTestId("freshness-banner")).toHaveAttribute(
      "data-state",
      "unavailable",
    );
    const auditedPage = page as unknown as AuditedPage;
    auditedPage.__consoleErrors = (auditedPage.__consoleErrors ?? []).filter(
      (error) => !error.includes("503 (Service Unavailable)"),
    );
  });

  test("empty, stale, and retryable error states are explicit", async ({
    page,
  }) => {
    await page.unroute("**/api/events?*");
    await page.route("**/api/events?*", (route) =>
      route.fulfill({
        json: { events: [], page: 1, pageSize: 12, total: 0, totalPages: 0 },
      }),
    );
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "No Current Events" }),
    ).toBeVisible();

    await page.unroute("**/api/freshness");
    await page.route("**/api/freshness", (route) =>
      route.fulfill({
        json: {
          lastSuccessfulSync: "2026-08-15T12:00:00Z",
          snapshotRowCount: 2,
          isStale: true,
        },
      }),
    );
    await page.unroute("**/api/events?*");
    await page.route("**/api/events?*", (route) =>
      route.fulfill({
        json: {
          events: firstPage,
          page: 1,
          pageSize: 12,
          total: 2,
          totalPages: 1,
        },
      }),
    );
    await page.reload();
    await expect(page.getByTestId("freshness-banner")).toHaveAttribute(
      "data-state",
      "stale",
    );

    await page.unroute("**/api/events?*");
    await page.route("**/api/events?*", (route) =>
      route.fulfill({ status: 503 }),
    );
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Events Are Unavailable" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Try Again" })).toBeVisible();
    const auditedPage = page as unknown as AuditedPage;
    auditedPage.__consoleErrors = (auditedPage.__consoleErrors ?? []).filter(
      (error) => !error.includes("503 (Service Unavailable)"),
    );
  });

  test("all filter groups are visible", async ({ page }) => {
    const chips = page.getByTestId("filter-chips");
    await expect(chips).toBeVisible();
    for (const group of ["Borough", "Category", "Date range", "Registration"]) {
      await expect(chips.getByRole("group", { name: group })).toBeVisible();
    }
  });

  test("list/map toggle exists and works", async ({ page }) => {
    const toggle = page.getByTestId("list-map-toggle");
    await expect(toggle).toBeVisible();

    // The map is the surface Explore is built on, so it is always present;
    // the toggle decides whether the results list covers it.
    const eventList = page.getByTestId("event-list");
    const eventMap = page.getByTestId("event-map");
    await expect(eventList).toBeVisible();
    await expect(eventMap).toBeVisible();
    await expect(eventMap).toHaveAttribute("data-map-status", "ready");

    // Map view hands the screen back to the map.
    const mapButton = toggle.getByRole("button", { name: "Map" });
    await mapButton.click();
    await expect(eventList).not.toBeVisible();
    await expect(eventMap).toBeVisible();
    await expect(
      page.getByRole("complementary", { name: "Events at selected location" }),
    ).toBeVisible();

    // Click List button to switch back
    const listButton = toggle.getByRole("button", { name: "List" });
    await listButton.click();
    await expect(eventList).toBeVisible();
    await expect(eventMap).toBeVisible();
  });

  test("list/map toggle works with the keyboard", async ({ page }) => {
    const toggle = page.getByTestId("list-map-toggle");
    const mapButton = toggle.getByRole("button", { name: "Map" });
    const listButton = toggle.getByRole("button", { name: "List" });

    await mapButton.focus();
    await page.keyboard.press("Enter");
    await expect(mapButton).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("event-map")).toBeVisible();

    await listButton.focus();
    await page.keyboard.press("Space");
    await expect(listButton).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("event-list")).toBeVisible();
    await expect(page.getByTestId("event-map")).toBeVisible();
  });

  test("key shell controls intersect the viewport and screenshot cleanly", async ({
    page,
  }, testInfo) => {
    const header = page.getByTestId("header");
    const toggle = page.getByTestId("list-map-toggle");
    await toggle.scrollIntoViewIfNeeded();

    await expectInViewport(header);
    await expectInViewport(toggle);

    await testInfo.attach(`${testInfo.project.name}-list-viewport`, {
      body: await page.screenshot({ fullPage: false }),
      contentType: "image/png",
    });

    await toggle.getByRole("button", { name: "Map" }).click();
    const map = page.getByTestId("event-map");
    await map.scrollIntoViewIfNeeded();
    await expectInViewport(map);
    await testInfo.attach(`${testInfo.project.name}-map-viewport`, {
      body: await page.screenshot({ fullPage: false }),
      contentType: "image/png",
    });
  });

  test("no horizontal overflow at current viewport", async ({ page }) => {
    const body = page.locator("body");
    const bodyBox = await body.boundingBox();
    const viewport = page.viewportSize();

    expect(bodyBox).not.toBeNull();
    expect(viewport).not.toBeNull();

    if (bodyBox && viewport) {
      // Body should not be wider than the viewport
      expect(bodyBox.width).toBeLessThanOrEqual(viewport.width + 1);
    }

    // Also check documentElement scrollWidth vs clientWidth
    const overflow = await page.evaluate(() => {
      return (
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth
      );
    });
    expect(overflow).toBe(false);
  });

  test("focus is visible on interactive elements", async ({ page }) => {
    // The first keyboard stop provides a visible bypass for repeated navigation.
    await page.keyboard.press("Tab");

    const skipLink = page.getByRole("link", { name: "Skip to event results" });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeInViewport();

    const outlineStyle = await skipLink.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return computed.outlineStyle;
    });
    expect(outlineStyle).not.toBe("none");

    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
  });
});

test.describe("Mobile viewport (390x844)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("bottom nav is visible on mobile", async ({ page }) => {
    await page.goto("/");
    const bottomNav = page.getByTestId("bottom-nav");
    await expect(bottomNav).toBeVisible();
  });

  test("the header carries the only brand on phone", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByTestId("header").getByRole("heading", { level: 1 }),
    ).toHaveText("EventMatch NYC");
    await expect(page.getByTestId("desktop-sidebar")).toBeHidden();
  });

  test("bottom nav buttons have at least 44px touch targets", async ({
    page,
  }) => {
    await page.goto("/");
    const buttons = page.getByTestId("bottom-nav").getByRole("button");
    const count = await buttons.count();
    expect(count).toBeGreaterThanOrEqual(4);

    for (let i = 0; i < count; i++) {
      const box = await buttons.nth(i).boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});

test.describe("Desktop viewport (1440x900)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("bottom nav is hidden on desktop", async ({ page }) => {
    await page.goto("/");
    const bottomNav = page.getByTestId("bottom-nav");
    await expect(bottomNav).not.toBeVisible();
  });

  test("desktop sidebar is visible", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.getByTestId("desktop-sidebar");
    await expect(sidebar).toBeVisible();
  });

  test("the sidebar carries the only brand on desktop", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByTestId("desktop-sidebar").getByRole("heading", { level: 1 }),
    ).toHaveText("EventMatch NYC");
    await expect(page.getByTestId("header-brand")).toBeHidden();
  });
});
