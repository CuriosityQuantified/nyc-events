import { expect, test } from "./fixtures";
import eventList from "../../contracts/golden/events-list.json";
import eventDetail from "../../contracts/golden/event-detail.json";
import { apiToUiEvent } from "../app/data/events";

test("an open Saved page refreshes Saved events and Matches", async ({
  page,
}) => {
  await page.clock.install();
  let revision = "2026-09-16T01:00:00Z";
  let suffix = "before update";
  await page.route("**/api/freshness", (route) =>
    route.fulfill({
      json: {
        lastSuccessfulSync: revision,
        isStale: false,
        snapshotRowCount: 2,
      },
    }),
  );
  for (const kind of ["saved", "matches"]) {
    await page.route(`**/api/profile/${kind}**`, (route) =>
      route.fulfill({
        json: {
          events: [
            {
              ...apiToUiEvent(eventList.events[0]),
              id: kind,
              guid: kind,
              title: `${kind} ${suffix}`,
            },
          ],
          total: 1,
        },
      }),
    );
  }
  await page.goto("/saved");
  await expect(page.getByTestId("saved-list")).toContainText(
    "saved before update",
  );
  await expect(page.getByTestId("matches-list")).toContainText(
    "matches before update",
  );
  suffix = "after update";
  revision = "2026-09-16T01:05:00Z";
  await page.clock.runFor(61_000);
  await expect(page.getByTestId("saved-list")).toContainText(
    "saved after update",
  );
  await expect(page.getByTestId("matches-list")).toContainText(
    "matches after update",
  );
});

test("an open explorer refreshes changed data and retains it during an outage", async ({
  page,
}) => {
  await page.clock.install();
  let revision = "2026-09-16T01:00:00Z";
  let title = "Original park event";
  let unavailable = false;
  let eventRequests = 0;
  await page.route("**/api/profile/saved**", (route) =>
    route.fulfill({ json: { events: [], total: 0 } }),
  );
  await page.route("**/api/profile/interests**", (route) =>
    route.fulfill({ json: { interests: [] } }),
  );
  await page.route("**/api/freshness", (route) =>
    route.fulfill({
      json: {
        lastSuccessfulSync: revision,
        lastSuccessfulCheck: "2026-09-16T01:05:00Z",
        sourceUpdatedAt: "2026-09-15T08:00:00Z",
        isStale: false,
        snapshotRowCount: 1,
      },
    }),
  );
  await page.route("**/api/events?*", (route) => {
    eventRequests += 1;
    return route.fulfill(
      unavailable
        ? { status: 503, json: { error: "unavailable" } }
        : {
            json: {
              events: [{ ...apiToUiEvent(eventList.events[0]), title }],
              page: 1,
              pageSize: 12,
              total: 1,
              totalPages: 1,
            },
          },
    );
  });
  await page.goto("/?borough=Manhattan");
  const card = page.getByTestId("event-card").first();
  await expect(card).toContainText(title);
  await expect(page.getByTestId("freshness-banner")).toContainText(
    "NYC Parks source updated",
  );
  const initialRequests = eventRequests;
  await page.clock.runFor(61_000);
  expect(eventRequests).toBe(initialRequests);

  title = "Changed park event";
  revision = "2026-09-16T01:10:00Z";
  await page.clock.runFor(61_000);
  await expect(card).toContainText(title);
  expect(page.url()).toContain("borough=Manhattan");

  unavailable = true;
  revision = "2026-09-16T01:15:00Z";
  await page.clock.runFor(61_000);
  await expect(card).toContainText("Changed park event");
  await expect(page.getByTestId("freshness-banner")).toHaveAttribute(
    "data-state",
    "unavailable",
  );
  unavailable = false;
  title = "Recovered park event";
  await page.clock.runFor(61_000);
  await expect(card).toContainText(title);
});

test("an open detail page receives source changes without navigation", async ({
  page,
}) => {
  await page.clock.install();
  let revision = "2026-09-16T01:00:00Z";
  let title = "Original detail title";
  await page.route("**/api/profile/saved**", (route) =>
    route.fulfill({ json: { events: [], total: 0 } }),
  );
  await page.route("**/api/freshness", (route) =>
    route.fulfill({
      json: {
        lastSuccessfulSync: revision,
        isStale: false,
        snapshotRowCount: 1,
      },
    }),
  );
  await page.route("**/api/events/*", (route) =>
    route.fulfill({
      json: {
        ...eventDetail,
        title: { ...eventDetail.title, value: title },
      },
    }),
  );
  await page.goto(`/events/${encodeURIComponent(eventDetail.guid)}`);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  title = "Updated detail title";
  revision = "2026-09-16T01:10:00Z";
  await page.clock.runFor(61_000);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
});
