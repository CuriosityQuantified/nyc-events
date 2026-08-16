import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
import eventList from "../../contracts/golden/events-list.json";
import { apiToUiEvent, type ParkEvent } from "../app/data/events";

const source = eventList.events.map(apiToUiEvent);
const shared: ParkEvent = {
  ...source[0],
  id: "shared-location",
  guid: "shared-location",
  title: "Tai Chi Practice Session",
};
const multiple: ParkEvent = {
  ...source[1],
  id: "multiple-location",
  guid: "multiple-location",
  title: "Two-Park Nature Walk",
  coordinates: [
    ...source[1].coordinates,
    { latitude: 40.650001, longitude: -73.949999 },
  ],
};
const invalid: ParkEvent = {
  ...source[1],
  id: "invalid-location",
  guid: "invalid-location",
  title: "Location Pending Event",
  locationId: null,
  coordinates: [{ latitude: 0, longitude: 0 }],
  positionAccuracy: "not-listed",
};
const events = [source[0], shared, source[1], multiple, invalid];

type AuditedPage = Page & { __mapErrors?: string[] };

async function installRoutes(page: Page): Promise<void> {
  await page.route("**/api/events?*", async (route) => {
    const params = new URL(route.request().url()).searchParams;
    const filtered = params.get("borough")
      ? events.filter((event) => event.borough === params.get("borough"))
      : events;
    await route.fulfill({
      json: {
        events: filtered,
        page: Number(params.get("page") ?? "1"),
        pageSize: Number(params.get("page_size") ?? "12"),
        total: filtered.length,
        totalPages: filtered.length ? 1 : 0,
      },
    });
  });
  await page.route("**/api/freshness", (route) =>
    route.fulfill({
      json: {
        lastSuccessfulSync: "2026-08-16T12:00:00Z",
        snapshotRowCount: events.length,
        isStale: false,
      },
    }),
  );
}

async function installFakeGoogle(page: Page): Promise<void> {
  await page.addInitScript(() => {
    class FakeMap {
      element: HTMLElement;
      listeners = new Map<string, () => void>();

      constructor(element: HTMLElement) {
        this.element = element;
        queueMicrotask(() => this.listeners.get("idle")?.());
      }

      setCenter() {}

      addListener(name: string, callback: () => void) {
        this.listeners.set(name, callback);
        return { remove: () => this.listeners.delete(name) };
      }
    }

    class FakeAdvancedMarkerElement {
      private content: HTMLElement;
      private currentMap: FakeMap | null = null;

      constructor(options: { map: FakeMap; content: HTMLElement }) {
        this.content = options.content;
        this.map = options.map;
      }

      set map(value: FakeMap | null) {
        this.currentMap = value;
        if (value) value.element.append(this.content);
        else this.content.remove();
      }

      get map() {
        return this.currentMap;
      }
    }

    (window as unknown as Record<string, unknown>).google = {
      maps: {
        Map: FakeMap,
        marker: { AdvancedMarkerElement: FakeAdvancedMarkerElement },
      },
    };
  });
}

function mapSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect width="640" height="360" fill="#dce9ed"/><path d="M20 290L610 40" stroke="#fff" stroke-width="22"/><path d="M120 40L500 340" stroke="#fff" stroke-width="16"/><circle cx="330" cy="180" r="18" fill="#16825d" stroke="#fff" stroke-width="5"/><text x="584" y="348" font-size="12">Google</text></svg>`;
}

test.describe("Issue #26 maps", () => {
  test.beforeEach(async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    (page as AuditedPage).__mapErrors = errors;
    await installRoutes(page);
  });

  test.afterEach(async ({ page }) => {
    expect(
      (page as AuditedPage).__mapErrors,
      "console and page errors",
    ).toEqual([]);
  });

  test("renders protected responsive thumbnails, textual facts, and stable fallback", async ({
    page,
  }, testInfo) => {
    let releaseImages: (() => void) | undefined;
    const imageGate = new Promise<void>((resolve) => {
      releaseImages = resolve;
    });
    const thumbnailRequests: string[] = [];
    await page.route("**/api/maps/thumbnail?*", async (route) => {
      thumbnailRequests.push(route.request().url());
      await imageGate;
      await route.fulfill({ contentType: "image/svg+xml", body: mapSvg() });
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    const cards = page.getByTestId("event-card");
    await expect(cards).toHaveCount(events.length);
    const secondCard = cards.nth(1);
    const before = await secondCard.evaluate(
      (element) => element.getBoundingClientRect().top,
    );
    releaseImages?.();

    const thumbnails = page.getByTestId("map-thumbnail");
    await expect(thumbnails).toHaveCount(4);
    await expect(page.getByTestId("map-thumbnail-fallback")).toHaveCount(1);
    await expect(thumbnails.first().getByRole("img")).toHaveJSProperty(
      "complete",
      true,
    );
    const after = await secondCard.evaluate(
      (element) => element.getBoundingClientRect().top,
    );
    expect(after).toBeCloseTo(before, 0);

    for (let index = 0; index < 4; index += 1) {
      await thumbnails.nth(index).scrollIntoViewIfNeeded();
    }
    await expect(thumbnails.getByRole("img")).toHaveCount(4);

    const firstThumbnail = thumbnails.first();
    const box = await firstThumbnail.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width / box!.height).toBeCloseTo(16 / 9, 1);
    const image = firstThumbnail.getByRole("img");
    await expect(image).toHaveAttribute("width", "640");
    await expect(image).toHaveAttribute("height", "360");
    await expect(image).toHaveAttribute("loading", "lazy");
    await expect(image).toHaveAttribute("alt", /Google map showing/);
    const imageUrl = new URL((await image.getAttribute("src"))!, page.url());
    expect(imageUrl.origin).toBe(new URL(page.url()).origin);
    expect(imageUrl.href).not.toContain("key=");
    expect(imageUrl.href).not.toContain("maps.googleapis.com");

    const handoff = firstThumbnail.getByRole("link");
    await expect(handoff).toHaveAttribute("target", "_blank");
    await expect(handoff).toHaveAttribute("rel", /noopener/);
    await expect(handoff).toHaveAttribute(
      "href",
      /^https:\/\/www\.google\.com\/maps\/dir\//,
    );
    await expect(cards.first()).toContainText("Neighborhood: Not listed");
    await expect(cards.first()).toContainText("Address: Not listed");

    await firstThumbnail.scrollIntoViewIfNeeded();
    expect(
      await firstThumbnail.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        const hit = document.elementFromPoint(
          bounds.right - 6,
          bounds.bottom - 6,
        );
        return Boolean(hit?.closest("figure") === element);
      }),
    ).toBe(true);
    expect(thumbnailRequests).toHaveLength(4);
    expect(
      thumbnailRequests.every(
        (url) => new URL(url).origin === new URL(page.url()).origin,
      ),
    ).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await testInfo.attach(`${testInfo.project.name}-static-maps`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });

  test("groups stable locations and supports keyboard marker selection at both viewports", async ({
    page,
  }, testInfo) => {
    await installFakeGoogle(page);
    await page.route("**/api/maps/thumbnail?*", (route) =>
      route.fulfill({ contentType: "image/svg+xml", body: mapSvg() }),
    );
    await page.goto("/?view=map");

    const map = page.getByTestId("event-map");
    await expect(map).toHaveAttribute("data-map-status", "ready");
    const markers = page.getByTestId("map-marker");
    await expect(markers).toHaveCount(3);
    const sharedMarker = page.getByRole("button", {
      name: /Soldiers' and Sailors' Monument.*2 events/,
    });
    const targetBox = await sharedMarker.boundingBox();
    expect(targetBox).not.toBeNull();
    expect(targetBox!.width).toBeGreaterThanOrEqual(44);
    expect(targetBox!.height).toBeGreaterThanOrEqual(44);
    expect(await sharedMarker.getAttribute("data-diameter")).toBe("22");

    await sharedMarker.focus();
    await page.keyboard.press("Enter");
    const panel = page.getByRole("complementary", {
      name: "Events at selected location",
    });
    await expect(panel).toContainText(source[0].title);
    await expect(panel).toContainText(shared.title);
    await expect(panel.locator("ul").first()).not.toContainText(invalid.title);
    await expect(panel).toContainText(invalid.title);
    await expect(panel.getByText("2 events", { exact: true })).toBeVisible();
    await expect(
      page.getByText("1 events are available in the list only"),
    ).toBeVisible();

    const params = new URL(page.url()).searchParams;
    expect(params.get("view")).toBe("map");
    const toggle = page.getByTestId("list-map-toggle");
    await toggle.getByRole("button", { name: "List", exact: true }).click();
    expect(new URL(page.url()).searchParams.get("view")).toBeNull();
    await page.goBack();
    await expect(
      toggle.getByRole("button", { name: "Map", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(map).toBeVisible();

    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await testInfo.attach(`${testInfo.project.name}-location-map`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });

  test("fails closed without Google and keeps every filtered event reachable", async ({
    page,
  }) => {
    await page.goto("/?borough=Manhattan&view=map");
    const map = page.getByTestId("event-map");
    await expect(map).toHaveAttribute("data-map-status", "error");
    await expect(map.getByRole("alert")).toContainText("Map Could Not Load");
    await expect(
      page
        .getByTestId("list-map-toggle")
        .getByRole("button", { name: "List", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: source[0].title }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: shared.title })).toBeVisible();
    expect(new URL(page.url()).searchParams.get("borough")).toBe("Manhattan");
  });
});
