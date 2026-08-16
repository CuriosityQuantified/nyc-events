import { expect, test } from "./fixtures";
import type { Locator, Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import eventList from "../../contracts/golden/events-list.json";
import { apiToUiEvent } from "../app/data/events";

const fixtureEvent = apiToUiEvent(eventList.events[0]);
type FilterKey = "borough" | "category" | "date" | "registration";

type AuditedPage = Page & { __errors?: string[] };

async function installContractRoutes(page: Page): Promise<void> {
  await page.route("**/api/events?*", async (route) => {
    const params = new URL(route.request().url()).searchParams;
    const hasZeroResultCombination = params.get("category") === "Art";
    await route.fulfill({
      json: {
        events: hasZeroResultCombination ? [] : [fixtureEvent],
        page: Number(params.get("page") ?? "1"),
        pageSize: 12,
        total: hasZeroResultCombination ? 0 : 1,
        totalPages: hasZeroResultCombination ? 0 : 1,
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
        snapshotRowCount: 1,
        isStale: false,
      },
    }),
  );
}

async function expectFilterQuery(
  page: Page,
  expected: Partial<Record<FilterKey, string | null>>,
): Promise<void> {
  await expect
    .poll(() => {
      const params = new URL(page.url()).searchParams;
      return Object.fromEntries(
        Object.entries(expected).map(([key]) => [key, params.get(key)]),
      );
    })
    .toEqual(expected);
}

async function expectInViewport(locator: Locator): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
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

async function expectVisibleInScroller(locator: Locator): Promise<void> {
  expect(
    await locator.evaluate((element) => {
      const list = element.closest("ul");
      if (!list) return false;
      const listBox = list.getBoundingClientRect();
      const elementBox = element.getBoundingClientRect();
      return (
        elementBox.left >= listBox.left && elementBox.right <= listBox.right
      );
    }),
  ).toBe(true);
}

test.describe("Issue #12 shareable filter state", () => {
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

  test("combines filters, survives reload and Event return, and supports history", async ({
    page,
  }, testInfo) => {
    await page.goto("/");
    await expect(page.getByTestId("event-card")).toHaveCount(1);

    await page.getByRole("button", { name: "Add Borough: Queens" }).click();
    const nature = page.getByRole("button", { name: "Add Category: Nature" });
    await nature.focus();
    await page.keyboard.press("Enter");
    const today = page.getByRole("button", { name: "Add Date range: Today" });
    await today.focus();
    await page.keyboard.press("Space");
    await page
      .getByRole("button", { name: "Add Registration: Required" })
      .click();

    const combined = {
      borough: "Queens",
      category: "Nature",
      date: "today",
      registration: "required",
    };
    await expectFilterQuery(page, combined);
    for (const [group, label] of [
      ["Borough", "Queens"],
      ["Category", "Nature"],
      ["Date range", "Today"],
      ["Registration", "Required"],
    ] as const) {
      const chip = page.getByRole("button", {
        name: `Remove ${group}: ${label}`,
      });
      await expect(chip).toHaveAttribute("aria-pressed", "true");
      await expectInViewport(chip);
    }

    await page.reload();
    await expectFilterQuery(page, combined);
    await expect(
      page.getByRole("button", { name: "Remove Category: Nature" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Add Category: Art" }).click();
    await expectFilterQuery(page, { ...combined, category: "Art" });
    await page.goBack();
    await expectFilterQuery(page, combined);
    await expect(
      page.getByRole("button", { name: "Remove Category: Nature" }),
    ).toBeVisible();
    await page.goForward();
    await expectFilterQuery(page, { ...combined, category: "Art" });
    await page.goBack();
    await expectFilterQuery(page, combined);

    await page.evaluate(() =>
      window.history.pushState(null, "", "/events/example"),
    );
    await page.goBack();
    await expectFilterQuery(page, combined);
    await expect(page.getByTestId("event-card")).toHaveCount(1);
    for (const [group, label] of [
      ["Borough", "Queens"],
      ["Category", "Nature"],
      ["Date range", "Today"],
      ["Registration", "Required"],
    ] as const) {
      await expectVisibleInScroller(
        page.getByRole("button", { name: `Remove ${group}: ${label}` }),
      );
    }

    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await testInfo.attach(`${testInfo.project.name}-filters-viewport`, {
      body: await page.screenshot({ fullPage: false }),
      contentType: "image/png",
    });
    await testInfo.attach(`${testInfo.project.name}-filters-full-page`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });

  test("names every active filter in a recoverable zero-result state", async ({
    page,
  }) => {
    await page.goto(
      "/?borough=Queens&category=Art&date=weekend&registration=required",
    );

    const empty = page.getByTestId("filter-empty-state");
    await expect(empty).toContainText("0 events match this combined view");
    for (const description of [
      "Borough: Queens",
      "Category: Art",
      "Date: This weekend",
      "Registration: Required",
    ]) {
      await expect(empty).toContainText(description);
    }

    await empty.getByRole("button", { name: "Clear all filters" }).click();
    await expectFilterQuery(page, {
      borough: null,
      category: null,
      date: null,
      registration: null,
    });
    await expect(page.getByTestId("event-card")).toHaveCount(1);
  });
});
