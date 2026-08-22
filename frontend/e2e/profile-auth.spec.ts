import { expect, test, type BrowserContext } from "@playwright/test";

const localInterest = {
  id: "11111111-1111-4111-8111-111111111111",
  facetType: "borough",
  facetValue: "Brooklyn",
  facets: [{ facetType: "borough", facetValue: "Brooklyn" }],
  alertEnabled: true,
  origin: "manual",
};
const mergedInterest = {
  id: "22222222-2222-4222-8222-222222222222",
  facetType: "category",
  facetValue: "Nature",
  facets: [{ facetType: "category", facetValue: "Nature" }],
  alertEnabled: true,
  origin: "manual",
};
const mergedEvent = {
  id: "33333333-3333-4333-8333-333333333333",
  guid: "merged-garden-workshop",
  title: "Merged Garden Workshop",
  location: "Prospect Park",
  locationId: null,
  coordinates: [],
  positionAccuracy: "not-listed",
  borough: "Brooklyn",
  category: "Nature",
  categories: ["Nature"],
  startDate: "2026-09-01",
  date: "Sep 1",
  time: "10:00 AM",
  costType: "Free",
  registration: "Not required",
  registrationStatus: "not_required",
  accessibility: "Not listed",
  imageAlt: "",
  officialUrl: null,
};

async function installProfileFixture(context: BrowserContext) {
  let canonicalToken: string | null = null;
  let claimed = false;
  let claimAttempts = 0;

  await context.route("**/api/profile/claim", async (route) => {
    claimAttempts += 1;
    canonicalToken = route.request().headers()["x-device-token"] ?? null;
    if (claimAttempts === 1) {
      await route.fulfill({ status: 503, json: { error: "fixture outage" } });
      return;
    }
    claimed = true;
    await route.fulfill({
      json: { profileId: "canonical-profile", claimed: true },
    });
  });

  await context.route("**/api/profile/interests**", async (route) => {
    const token = route.request().headers()["x-device-token"] ?? null;
    const hasCanonicalAccess = !claimed || token === canonicalToken;
    const list = hasCanonicalAccess
      ? claimed
        ? [localInterest, mergedInterest]
        : [localInterest]
      : [];
    if (claimed && !hasCanonicalAccess)
      await new Promise((done) => setTimeout(done, 200));
    await route.fulfill({ json: { interests: list, total: list.length } });
  });

  await context.route("**/api/profile/saved**", async (route) => {
    const token = route.request().headers()["x-device-token"] ?? null;
    const hasCanonicalAccess = claimed && token === canonicalToken;
    const events = hasCanonicalAccess ? [mergedEvent] : [];
    if (claimed && !hasCanonicalAccess)
      await new Promise((done) => setTimeout(done, 200));
    await route.fulfill({
      json: { events, page: 1, pageSize: 100, total: events.length },
    });
  });

  return { canonicalToken: () => canonicalToken };
}

const harnessPath = "/e2e/harness/";

test("configured account claim retries and refreshes real Profile behavior", async ({
  context,
  page,
}) => {
  const fixture = await installProfileFixture(context);
  await page.goto(harnessPath);

  await expect(page.getByRole("button", { name: "Sign up" })).toBeVisible();
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(
    page.getByRole("button", { name: "Account menu" }),
  ).toBeVisible();
  await expect(page.getByTestId("account-email")).toContainText(
    "component@example.invalid",
  );

  const tokenBeforeClaim = await page.evaluate(() =>
    window.localStorage.getItem("eventmatch-device-token"),
  );
  await page.getByRole("button", { name: "Claim this profile" }).click();
  await expect(
    page.getByText("This Profile could not be linked.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Try claiming again" }).click();

  await expect(
    page.getByText("were refreshed", { exact: false }),
  ).toBeVisible();
  await expect(page.getByTestId("interests-list")).toContainText("Nature");
  await expect(page.getByTestId("harness-saved-state")).toContainText(
    "Merged Garden Workshop",
  );
  expect(fixture.canonicalToken()).toBe(tokenBeforeClaim);
});

test("sign-out rotation clears Profile and Saved state in a second tab", async ({
  context,
  page: firstTab,
}) => {
  await installProfileFixture(context);
  await firstTab.goto(harnessPath);
  await expect(firstTab.getByRole("button", { name: "Sign in" })).toBeVisible();
  const secondTab = await context.newPage();
  await secondTab.goto(harnessPath);

  await firstTab.getByRole("button", { name: "Sign in" }).click();
  await firstTab.getByRole("button", { name: "Claim this profile" }).click();
  await firstTab.getByRole("button", { name: "Try claiming again" }).click();
  await expect(
    firstTab.getByText("were refreshed", { exact: false }),
  ).toBeVisible();

  await secondTab.reload();
  await expect(secondTab.getByTestId("interests-list")).toContainText("Nature");
  await expect(secondTab.getByTestId("harness-saved-state")).toContainText(
    "Merged Garden Workshop",
  );
  const original = await firstTab.evaluate(() =>
    window.localStorage.getItem("eventmatch-device-token"),
  );

  await firstTab.getByRole("button", { name: "Sign out" }).click();

  await expect(firstTab.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(
    secondTab.getByRole("button", { name: "Sign in" }),
  ).toBeVisible();
  await expect(secondTab.getByTestId("interests-list")).toHaveCount(0);
  await expect(secondTab.getByText("Nature", { exact: true })).toHaveCount(0);
  await expect(secondTab.getByTestId("harness-saved-state")).toHaveText(
    "No saved events",
  );
  await expect(secondTab.getByTestId("interests-empty")).toBeVisible();
  const replacement = await secondTab.evaluate(() =>
    window.localStorage.getItem("eventmatch-device-token"),
  );
  expect(replacement).not.toBe(original);
});

test("failed Clerk sign-out restores and verifies the previous device token", async ({
  context,
  page,
}) => {
  await installProfileFixture(context);
  await page.goto(harnessPath);
  await page.getByRole("button", { name: "Sign in" }).click();
  const original = await page.evaluate(() => {
    window.localStorage.setItem("eventmatch-component-signout-failure", "true");
    return window.localStorage.getItem("eventmatch-device-token");
  });

  await page.getByRole("button", { name: "Sign out" }).click();

  await expect(page.getByRole("alert")).toContainText("safely restored");
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  const restored = await page.evaluate(() =>
    window.localStorage.getItem("eventmatch-device-token"),
  );
  expect(restored).toBe(original);
});
