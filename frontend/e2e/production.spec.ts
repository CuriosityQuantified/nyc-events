import { expect, test } from "@playwright/test";
import type { Locator } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const expectedRevision = process.env.EXPECTED_DEPLOY_REVISION;
const baseURL = process.env.PLAYWRIGHT_BASE_URL;

if (!expectedRevision || !baseURL) {
  throw new Error(
    "Production verification requires its origin and expected revision",
  );
}

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

test("public origin serves the exact deployed revision", async ({
  request,
}) => {
  expect(baseURL).toMatch(/^https:\/\//);
  const response = await request.get("/api/revision");
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(response.headers()["x-deployment-revision"]).toBe(expectedRevision);
  await expect(response.json()).resolves.toEqual({
    revision: expectedRevision,
  });
});

test("live Snapshot reaches the API proxy and rendered list", async ({
  page,
  request,
}, testInfo) => {
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  const thumbnailRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/maps/thumbnail") {
      thumbnailRequests.push(request.url());
    }
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  page.on("requestfailed", (failed) => {
    // Next.js cancels in-flight same-origin RSC prefetches when the view
    // changes (List → Map); those aborts are not transport failures. Real
    // HTTP errors on the same URLs are still caught by the >=400 response
    // listener below.
    const errorText = failed.failure()?.errorText ?? "unknown";
    const url = new URL(failed.url());
    const isCancelledSameOriginPrefetch =
      errorText === "net::ERR_ABORTED" &&
      url.origin === new URL(baseURL).origin &&
      url.searchParams.has("_rsc");
    if (isCancelledSameOriginPrefetch) return;
    failedRequests.push(`${failed.method()} ${failed.url()} (${errorText})`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      failedRequests.push(`${response.status()} ${response.url()}`);
    }
  });

  const apiResponse = await request.get("/api/events?page=1");
  expect(apiResponse.status()).toBe(200);
  const apiPage = await apiResponse.json();
  expect(apiPage.total).toBeGreaterThan(0);
  expect(apiPage.events.length).toBeGreaterThan(0);
  const guid = apiPage.events[0].guid;
  expect(guid).toBeTruthy();

  const freshnessResponse = await request.get("/api/freshness");
  expect(freshnessResponse.status()).toBe(200);
  const freshness = await freshnessResponse.json();
  expect(freshness.snapshotRowCount).toBeGreaterThan(0);
  expect(freshness.isStale).toBe(false);

  await page.goto("/", { waitUntil: "networkidle" });
  const firstCard = page.getByTestId("event-card").first();
  await expect(firstCard).toHaveAttribute("data-event-guid", guid);
  await expect(firstCard.getByRole("heading", { level: 2 })).toHaveText(
    apiPage.events[0].title,
  );
  expect(thumbnailRequests, "Static Maps thumbnails are deferred").toEqual([]);

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to event results" });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();

  await page
    .getByTestId("list-map-toggle")
    .getByRole("button", { name: "Map", exact: true })
    .click();
  const map = page.getByTestId("event-map");
  await expect(map).toHaveAttribute("data-map-status", "ready", {
    timeout: 20_000,
  });
  expect(new URL(page.url()).searchParams.get("view")).toBe("map");
  expect(thumbnailRequests, "map view must not request thumbnails").toEqual([]);

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);

  const header = page.getByTestId("header");
  const toggle = page.getByTestId("list-map-toggle");
  await expectInViewport(header);
  await toggle.scrollIntoViewIfNeeded();
  await expectInViewport(toggle);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);

  await testInfo.attach(`${testInfo.project.name}-live-events`, {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
  expect(consoleErrors, "console and page errors").toEqual([]);
  expect(failedRequests, "unexpected failed browser requests").toEqual([]);
});
