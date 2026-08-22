import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const interests = [
  {
    id: "5a6b7c8d-9e0f-4a1b-8c2d-3e4f5a6b7c8d",
    facetType: "composite",
    facetValue: "Brooklyn + Family",
    facets: [
      { facetType: "borough", facetValue: "Brooklyn" },
      { facetType: "category", facetValue: "Family" },
    ],
    alertEnabled: true,
    origin: "manual",
  },
  {
    id: "6b7d3d2e-0a52-4d7e-9c1f-2f3a4b5c6d7e",
    facetType: "borough",
    facetValue: "Brooklyn",
    facets: [{ facetType: "borough", facetValue: "Brooklyn" }],
    alertEnabled: true,
    origin: "manual",
  },
  {
    id: "7c8e4f3f-1b63-5e8f-ad20-304b5c6d7e8f",
    facetType: "category",
    facetValue: "Fitness",
    facets: [{ facetType: "category", facetValue: "Fitness" }],
    alertEnabled: false,
    origin: "manual",
  },
];

test.describe("Profile tab with Interests", () => {
  test.beforeEach(async ({ page }) => {
    let currentInterests = structuredClone(interests);
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    (page as unknown as { profileErrors: string[] }).profileErrors = errors;

    await page.route("**/api/profile/interests**", (route) => {
      if (route.request().method() === "DELETE") {
        return route.fulfill({ status: 204, body: "" });
      }
      if (route.request().method() === "PUT") {
        const body = route.request().postDataJSON() as {
          facet_type?: string;
          facet_value?: string;
          alert_enabled?: boolean;
          facets?: Array<{ facet_type: string; facet_value: string }>;
        };
        const original = currentInterests.find(
          (interest) =>
            interest.facetValue === body.facet_value ||
            interest.facets?.every((facet, index) =>
              body.facets
                ? body.facets[index]?.facet_value === facet.facetValue
                : false,
            ),
        );
        const updated = {
          ...(original ?? currentInterests[0]),
          alertEnabled: body.alert_enabled ?? true,
        };
        currentInterests = currentInterests.map((interest) =>
          interest.id === updated.id ? updated : interest,
        );
        return route.fulfill({ json: updated });
      }
      return route.fulfill({
        json: {
          interests: currentInterests,
          total: currentInterests.length,
        },
      });
    });
    await page.route("**/api/profile/saved**", (route) =>
      route.fulfill({
        json: { events: [], page: 1, pageSize: 100, total: 0 },
      }),
    );
    await page.goto("/profile");
  });

  test.afterEach(async ({ page }) => {
    expect(
      (page as unknown as { profileErrors?: string[] }).profileErrors ?? [],
      "console and page errors",
    ).toEqual([]);
  });

  test("lists followed Interests with alert state and unfollow", async ({
    page,
  }) => {
    const list = page.getByTestId("interests-list");
    await expect(list).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Unfollow Brooklyn", exact: true }),
    ).toBeVisible();
    await expect(list.getByText("Fitness")).toBeVisible();
    await expect(list.getByText("Brooklyn + Family")).toBeVisible();
    await expect(list.getByText("Combination")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Unfollow Brooklyn + Family" }),
    ).toBeVisible();
    await expect(list.getByText("· alerts on").first()).toBeVisible();
    await expect(list.getByText("· alerts off")).toBeVisible();

    await page
      .getByRole("button", { name: "Unfollow Brooklyn", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Unfollow Brooklyn", exact: true }),
    ).toHaveCount(0);
    await expect(list.getByText("Fitness")).toBeVisible();
  });

  test("profile is the active four-tab destination", async ({ page }) => {
    const isDesktop = (page.viewportSize()?.width ?? 0) >= 1024;
    const navigation = page.getByTestId(
      isDesktop ? "desktop-sidebar" : "bottom-nav",
    );
    await expect(navigation).toBeVisible();
    const labels = (await navigation.getByRole("button").allTextContents()).map(
      (label) => label.trim(),
    );
    expect(labels).toEqual(
      isDesktop
        ? ["Explore", "Saved Events", "Concierge", "Profile"]
        : ["Explore", "Saved", "Concierge", "Profile"],
    );
    await expect(
      navigation.getByRole("button", { name: "Profile", exact: true }),
    ).toHaveAttribute("aria-current", "page");
  });

  test("anonymous alert controls work by keyboard and remain in the viewport", async ({
    page,
  }, testInfo) => {
    const profile = page.getByRole("main");
    const switchControl = page.getByRole("switch", {
      name: "Alerts for Fitness",
    });
    await expect(profile).toBeVisible();
    await expect(switchControl).toHaveAttribute("aria-checked", "false");

    await switchControl.scrollIntoViewIfNeeded();
    await switchControl.focus();
    await expect(switchControl).toBeFocused();
    await page.keyboard.press("Space");
    await expect(switchControl).toHaveAttribute("aria-checked", "true");
    await page.keyboard.press("Enter");
    await expect(switchControl).toHaveAttribute("aria-checked", "false");

    const box = await switchControl.boundingBox();
    const viewport = page.viewportSize()!;
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);

    const bottomNav = page.getByTestId("bottom-nav");
    if (await bottomNav.isVisible()) {
      const navBox = await bottomNav.boundingBox();
      expect(navBox).not.toBeNull();
      const intersects =
        box!.x < navBox!.x + navBox!.width &&
        box!.x + box!.width > navBox!.x &&
        box!.y < navBox!.y + navBox!.height &&
        box!.y + box!.height > navBox!.y;
      expect(intersects).toBe(false);
    }

    await page.screenshot({
      path: testInfo.outputPath(`profile-${testInfo.project.name}.png`),
      fullPage: true,
    });
  });

  test("offers no account controls and asks for no Clerk code when Clerk is disabled", async ({
    page,
  }) => {
    const clerkRequests: string[] = [];
    page.on("request", (request) => {
      if (/clerk/i.test(request.url())) {
        clerkRequests.push(request.url());
      }
    });
    await page.reload();

    await expect(page.getByTestId("header-auth")).toHaveCount(0);
    await expect(page.getByTestId("account-panel")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Sign in" })).toHaveCount(0);
    await expect(
      page.getByText("Sign-in to keep your profile across devices is coming"),
    ).toBeVisible();
    expect(clerkRequests).toEqual([]);
  });

  test("the real claim route never accepts anonymous client state", async ({
    page,
  }) => {
    const token = await page.evaluate(() =>
      window.localStorage.getItem("eventmatch-device-token"),
    );
    expect(token).toBeTruthy();
    const response = await page.request.post("/api/profile/claim", {
      headers: { "X-Device-Token": token! },
    });
    expect([401, 503]).toContain(response.status());
  });

  test("has no automatically detectable accessibility violations", async ({
    page,
  }) => {
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
