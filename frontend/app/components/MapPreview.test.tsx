import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ParkEvent } from "@/app/data/events";
import MapPreview from "./MapPreview";

const leaflet = vi.hoisted(() => {
  const handlers = new Map<string, () => void>();
  const mapInstance = {
    getCenter: vi.fn(() => ({ lat: 40.6602, lng: -73.969 })),
    getZoom: vi.fn(() => 15),
    invalidateSize: vi.fn(),
    remove: vi.fn(),
    setView: vi.fn(),
  };
  return {
    handlers,
    map: vi.fn(() => mapInstance),
    mapInstance,
    addTiles: vi.fn(),
  };
});

vi.mock("leaflet", () => ({
  map: leaflet.map,
  tileLayer: () => ({
    once: (name: string, handler: () => void) => {
      leaflet.handlers.set(name, handler);
    },
    addTo: leaflet.addTiles,
  }),
  circleMarker: () => ({ addTo: vi.fn() }),
}));

const event: ParkEvent = {
  id: "event-1",
  guid: "event-1",
  title: "Park Walk",
  location: "Prospect Park",
  locationId: "B073",
  coordinates: [{ latitude: 40.6602, longitude: -73.969 }],
  positionAccuracy: "exact",
  borough: "Brooklyn",
  category: "Nature",
  categories: ["Nature"],
  startDate: "2026-08-16",
  date: "Aug 16, 2026",
  time: "10:00 AM",
  costType: "Free",
  registration: "Registration not listed",
  registrationStatus: "not_listed",
  accessibility: "Accessibility information not listed",
  imageAlt: "Not listed",
  officialUrl: null,
};

let intersectionCallback: IntersectionObserverCallback;
let resizeCallback: ResizeObserverCallback;
const resizeDisconnect = vi.fn();

beforeEach(() => {
  leaflet.handlers.clear();
  leaflet.map.mockClear();
  leaflet.mapInstance.invalidateSize.mockClear();
  leaflet.mapInstance.remove.mockClear();
  leaflet.mapInstance.setView.mockClear();
  leaflet.addTiles.mockClear();
  resizeDisconnect.mockClear();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback) {
        intersectionCallback = callback;
      }
      observe() {}
      disconnect() {}
      unobserve() {}
      takeRecords() {
        return [];
      }
      root = null;
      rootMargin = "240px 0px";
      thresholds = [0];
    },
  );
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: ResizeObserverCallback) {
        resizeCallback = callback;
      }
      observe() {}
      disconnect = resizeDisconnect;
      unobserve() {}
    },
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function enterViewport(): void {
  act(() => {
    intersectionCallback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
  });
}

describe("MapPreview offline lifecycle", () => {
  it("does not initialize Leaflet until the preview is near the viewport", async () => {
    render(<MapPreview event={event} variant="compact" />);
    expect(screen.getByTestId("map-preview").dataset.mapStatus).toBe("waiting");
    expect(leaflet.map).not.toHaveBeenCalled();

    enterViewport();
    await waitFor(() => expect(leaflet.map).toHaveBeenCalledOnce());
    expect(leaflet.addTiles).toHaveBeenCalledOnce();
  });

  it("invalidates the retained map after compact-to-expanded frame changes", async () => {
    const { rerender, unmount } = render(
      <MapPreview event={event} variant="compact" />,
    );
    enterViewport();
    await waitFor(() => expect(leaflet.map).toHaveBeenCalledOnce());
    act(() => leaflet.handlers.get("load")?.());
    leaflet.mapInstance.invalidateSize.mockClear();

    rerender(<MapPreview event={event} variant="expanded" />);
    await waitFor(() =>
      expect(leaflet.mapInstance.invalidateSize).toHaveBeenCalledWith(false),
    );
    expect(leaflet.map).toHaveBeenCalledOnce();
    expect(leaflet.mapInstance.setView).toHaveBeenCalledOnce();
    expect(leaflet.mapInstance.getCenter()).toEqual({
      lat: 40.6602,
      lng: -73.969,
    });
    expect(leaflet.mapInstance.getZoom()).toBe(15);

    act(() => resizeCallback([], {} as ResizeObserver));
    expect(leaflet.mapInstance.invalidateSize).toHaveBeenCalledWith(false);
    unmount();
    expect(resizeDisconnect).toHaveBeenCalledOnce();
  });

  it("replaces a failed tile layer with one stable fallback and does not retry", async () => {
    render(<MapPreview event={event} variant="expanded" />);
    enterViewport();
    await waitFor(() => expect(leaflet.handlers.has("tileerror")).toBe(true));
    act(() => leaflet.handlers.get("tileerror")?.());

    expect(
      screen.getByText("Map tiles could not load.", { exact: false }),
    ).toBeTruthy();
    expect(screen.getByTestId("map-preview").dataset.mapStatus).toBe("error");
    expect(leaflet.map).toHaveBeenCalledOnce();
    expect(leaflet.addTiles).toHaveBeenCalledOnce();
  });
});
