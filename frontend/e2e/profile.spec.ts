import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const interests = [
  {
    id: "6b7d3d2e-0a52-4d7e-9c1f-2f3a4b5c6d7e",
    facetType: "borough",
    facetValue: "Brooklyn",
    alertEnabled: true,
    origin: "manual",
  },
  {
    id: "7c8e4f3f-1b63-5e8f-ad20-304b5c6d7e8f",
    facetType: "category",
    facetValue: "Fitness",
    alertEnabled: false,
    origin: "manual",
  },
];

test.describe("Profile tab with Interests", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/profile/interests**", (route) => {
      if (route.request().method() === "DELETE") {
        return route.fulfill({ status: 204, body: "" });
      }
      return route.fulfill({ json: { interests, total: interests.length } });
    });
    await page.route("**/api/profile/saved**", (route) =>
      route.fulfill({
        json: { events: [], page: 1, pageSize: 100, total: 0 },
      }),
    );
    await page.goto("/profile");
  });

  test("lists followed Interests with alert state and unfollow", async ({
    page,
  }) => {
    const list = page.getByTestId("interests-list");
    await expect(list).toBeVisible();
    await expect(list.getByText("Brooklyn")).toBeVisible();
    await expect(list.getByText("Fitness")).toBeVisible();
    await expect(list.getByText("· alerts on")).toBeVisible();
    await expect(list.getByText("· alerts off")).toBeVisible();

    await page.getByRole("button", { name: "Unfollow Brooklyn" }).click();
    await expect(list.getByText("Brooklyn")).toHaveCount(0);
    await expect(list.getByText("Fitness")).toBeVisible();
  });

  test("profile is the active four-tab destination", async ({ page }) => {
    // The bottom nav serves the phone viewport and the sidebar serves
    // desktop; hidden buttons expose no accessible text, so read both.
    const bottom = await page
      .getByTestId("bottom-nav")
      .getByRole("button")
      .allTextContents();
    const side = await page
      .getByTestId("desktop-sidebar")
      .getByRole("button")
      .allTextContents();
    const labels = [...bottom, ...side].join(" ");
    expect(labels).toContain("Explore");
    expect(labels).toContain("Saved");
    expect(labels).toContain("Concierge");
    expect(labels).toContain("Profile");
    expect(labels).not.toContain("Calendar");
  });

  test("has no automatically detectable accessibility violations", async ({
    page,
  }) => {
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
