import { test, expect } from "@playwright/test";
import type { Locator } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

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

test.describe("ParkMatch NYC Walking Skeleton", () => {
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

  test("has no automatically detectable accessibility violations", async ({ page }) => {
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("header with ParkMatch text is visible", async ({ page }) => {
    const header = page.getByTestId("header");
    await expect(header).toBeVisible();
    await expect(header).toContainText("ParkMatch");
  });

  test("all 8 event cards are rendered", async ({ page }) => {
    const cards = page.getByTestId("event-card");
    await expect(cards).toHaveCount(8);
  });

  test("filter chips are visible", async ({ page }) => {
    const chips = page.getByTestId("filter-chips");
    await expect(chips).toBeVisible();
    // Verify specific categories exist
    await expect(chips).toContainText("All");
    await expect(chips).toContainText("Fitness");
    await expect(chips).toContainText("Music");
  });

  test("date strip is visible", async ({ page }) => {
    const dateStrip = page.getByTestId("date-strip");
    await expect(dateStrip).toBeVisible();
  });

  test("list/map toggle exists and works", async ({ page }) => {
    const toggle = page.getByTestId("list-map-toggle");
    await expect(toggle).toBeVisible();

    // Initially list view is active, event cards visible
    const eventList = page.getByTestId("event-list");
    await expect(eventList).toBeVisible();

    // Click Map button
    const mapButton = toggle.getByRole("button", { name: "Map" });
    await mapButton.click();

    // Event list should be hidden, map placeholder visible
    await expect(eventList).not.toBeVisible();
    const mapPlaceholder = page.getByTestId("map-placeholder");
    await expect(mapPlaceholder).toBeVisible();

    // Click List button to switch back
    const listButton = toggle.getByRole("button", { name: "List" });
    await listButton.click();
    await expect(eventList).toBeVisible();
    await expect(mapPlaceholder).not.toBeVisible();
  });

  test("list/map toggle works with the keyboard", async ({ page }) => {
    const toggle = page.getByTestId("list-map-toggle");
    const mapButton = toggle.getByRole("button", { name: "Map" });
    const listButton = toggle.getByRole("button", { name: "List" });

    await mapButton.focus();
    await page.keyboard.press("Enter");
    await expect(mapButton).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("map-placeholder")).toBeVisible();

    await listButton.focus();
    await page.keyboard.press("Space");
    await expect(listButton).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("event-list")).toBeVisible();
  });

  test("key shell controls intersect the viewport and screenshot cleanly", async ({ page }, testInfo) => {
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
    const map = page.getByTestId("map-placeholder");
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
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflow).toBe(false);
  });

  test("focus is visible on interactive elements", async ({ page }) => {
    // Tab to the first interactive element and check focus visibility
    await page.keyboard.press("Tab");

    const focusedElement = page.locator(":focus-visible");
    const count = await focusedElement.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Check that outline is applied
    const outlineStyle = await focusedElement.first().evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return computed.outlineStyle;
    });
    // Should have a visible outline (not "none")
    expect(outlineStyle).not.toBe("none");
  });
});

test.describe("Mobile viewport (390x844)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("bottom nav is visible on mobile", async ({ page }) => {
    await page.goto("/");
    const bottomNav = page.getByTestId("bottom-nav");
    await expect(bottomNav).toBeVisible();
  });

  test("bottom nav buttons have at least 44px touch targets", async ({ page }) => {
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
});
