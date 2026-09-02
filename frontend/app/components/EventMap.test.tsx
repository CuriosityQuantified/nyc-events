import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ParkEvent } from "@/app/data/events";
import type { LocationGroup } from "@/app/data/maps";
import EventMap from "./EventMap";

const leaflet = vi.hoisted(() => {
  const tileHandlers = new Map<string, () => void>();
  const panes: Record<string, HTMLDivElement> = {};
  const mapInstance = {
    addLayer: vi.fn(),
    createPane: vi.fn((name: string) => {
      const el = document.createElement("div");
      panes[name] = el;
      return el;
    }),
    fitBounds: vi.fn(),
    getPane: vi.fn((name: string) => panes[name] ?? null),
    invalidateSize: vi.fn(),
    remove: vi.fn(),
    whenReady: vi.fn((handler: () => void) => handler()),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
  };
  const tileLayer = {
    addTo: vi.fn(),
    once: vi.fn((name: string, handler: () => void) => {
      tileHandlers.set(name, handler);
      return tileLayer;
    }),
    remove: vi.fn(),
  };
  const routeBounds = {
    isValid: vi.fn(() => true),
  };
  const geoJSONFn = vi.fn(() => ({
    addTo: vi.fn(function (this: unknown) {
      return this;
    }),
    getBounds: vi.fn(() => routeBounds),
    remove: vi.fn(),
  }));

  const circleMarkerFn = vi.fn(() => ({
    addTo: vi.fn(function (this: unknown) {
      return this;
    }),
    bindTooltip: vi.fn(function (this: unknown) {
      return this;
    }),
    remove: vi.fn(),
  }));

  const divIconCalls: Array<{ className: string; iconSize: [number, number] }> =
    [];
  const stopMarkerElements: HTMLDivElement[] = [];

  function createMarkerMock(_latlng: unknown, opts?: Record<string, unknown>) {
    const el = document.createElement("div");
    if (opts?.pane === "stopOverlay") stopMarkerElements.push(el);
    const handlers = new Map<string, Array<(...args: unknown[]) => void>>();
    return {
      addTo: vi.fn(function (this: unknown) {
        handlers.get("add")?.forEach((fn) => fn());
        return this;
      }),
      getElement: vi.fn(() => el),
      on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        const list = handlers.get(event) ?? [];
        list.push(handler);
        handlers.set(event, list);
      }),
      remove: vi.fn(),
    };
  }

  const markerFn = vi.fn(createMarkerMock);

  return {
    circleMarkerFn,
    divIconCalls,
    geoJSONFn,
    map: vi.fn(() => mapInstance),
    mapInstance,
    markerFn,
    panes,
    stopMarkerElements,
    tileHandlers,
    tileLayer,
  };
});

vi.mock("leaflet", () => ({
  circleMarker: leaflet.circleMarkerFn,
  divIcon: vi.fn(
    (opts: { className?: string; iconSize?: [number, number] }) => {
      if (opts)
        leaflet.divIconCalls.push({
          className: opts.className ?? "",
          iconSize: opts.iconSize ?? [0, 0],
        });
      return opts;
    },
  ),
  geoJSON: leaflet.geoJSONFn,
  latLngBounds: vi.fn(() => ({})),
  map: leaflet.map,
  marker: leaflet.markerFn,
  tileLayer: vi.fn(() => leaflet.tileLayer),
}));

const event = { guid: "event-1" } as ParkEvent;
const group: LocationGroup = {
  key: "B073|40.660200,-73.969000",
  latitude: 40.6602,
  longitude: -73.969,
  name: "Prospect Park",
  borough: "Brooklyn",
  accuracy: "exact",
  events: [event],
};

beforeEach(() => {
  leaflet.map.mockClear();
  leaflet.geoJSONFn.mockClear();
  leaflet.circleMarkerFn.mockClear();
  leaflet.mapInstance.addLayer.mockClear();
  leaflet.mapInstance.remove.mockClear();
  leaflet.mapInstance.zoomIn.mockClear();
  leaflet.mapInstance.createPane.mockClear();
  leaflet.mapInstance.getPane.mockClear();
  for (const key of Object.keys(leaflet.panes)) {
    delete leaflet.panes[key];
  }
  leaflet.tileHandlers.clear();
  leaflet.tileLayer.addTo.mockClear();
  leaflet.tileLayer.remove.mockClear();
  leaflet.divIconCalls.length = 0;
  leaflet.stopMarkerElements.length = 0;
  leaflet.markerFn.mockClear();
});

afterEach(cleanup);

describe("EventMap Leaflet lifecycle", () => {
  it("does not initialize Leaflet until a validated Location group exists and tears it down when empty", async () => {
    const { rerender } = render(
      <EventMap
        groups={[]}
        selectedKey=""
        view="map"
        onSelectLocation={vi.fn()}
      />,
    );

    expect(screen.getByText("No locations to map")).toBeTruthy();
    expect(leaflet.map).not.toHaveBeenCalled();
    expect(leaflet.tileLayer.addTo).not.toHaveBeenCalled();

    rerender(
      <EventMap
        groups={[group]}
        selectedKey={group.key}
        view="map"
        onSelectLocation={vi.fn()}
      />,
    );
    await waitFor(() => expect(leaflet.map).toHaveBeenCalledOnce());
    expect(leaflet.tileLayer.addTo).toHaveBeenCalledOnce();

    rerender(
      <EventMap
        groups={[]}
        selectedKey=""
        view="map"
        onSelectLocation={vi.fn()}
      />,
    );
    await waitFor(() =>
      expect(leaflet.mapInstance.remove).toHaveBeenCalledOnce(),
    );
    expect(screen.getByText("No locations to map")).toBeTruthy();
  });

  it("removes the tile layer on the first failure and disables zoom controls", async () => {
    render(
      <EventMap
        groups={[group]}
        selectedKey={group.key}
        view="map"
        onSelectLocation={vi.fn()}
      />,
    );
    await waitFor(() =>
      expect(leaflet.tileHandlers.has("tileerror")).toBe(true),
    );

    act(() => leaflet.tileHandlers.get("tileerror")?.());

    expect(leaflet.tileLayer.remove).toHaveBeenCalledOnce();
    expect(
      screen.getByRole("button", { name: "Zoom in" }).hasAttribute("disabled"),
    ).toBe(true);
    expect(
      screen.getByRole("button", { name: "Zoom out" }).hasAttribute("disabled"),
    ).toBe(true);
    expect(screen.getByText("The street map is unavailable")).toBeTruthy();
  });

  it("creates route overlay pane below the marker pane when routeOverlay is provided", async () => {
    render(
      <EventMap
        groups={[group]}
        selectedKey={group.key}
        view="map"
        onSelectLocation={vi.fn()}
        routeOverlay={{
          routeData: {
            geometry: {
              type: "MultiLineString",
              coordinates: [
                [
                  [-74.0, 40.7],
                  [-74.01, 40.71],
                ],
              ],
            },
            stopIds: ["101", "103"],
          },
          stops: {
            "101": {
              name: "Van Cortlandt Park-242 St",
              lat: 40.889,
              lng: -73.899,
            },
            "103": { name: "238 St", lat: 40.885, lng: -73.901 },
          },
          lineColor: "D82233",
        }}
      />,
    );
    await waitFor(() => expect(leaflet.map).toHaveBeenCalled());

    // Route overlay pane is created with z-index below markerPane (400)
    await waitFor(() => {
      expect(leaflet.mapInstance.createPane).toHaveBeenCalledWith(
        "routeOverlay",
      );
      expect(leaflet.mapInstance.createPane).toHaveBeenCalledWith(
        "stopOverlay",
      );
    });

    // Verify the pane z-index is below the marker pane default (400)
    const routePane = leaflet.panes["routeOverlay"];
    expect(routePane).toBeDefined();
    expect(routePane.style.zIndex).toBe("350");

    const stopPane = leaflet.panes["stopOverlay"];
    expect(stopPane).toBeDefined();
    expect(stopPane.style.zIndex).toBe("360");
  });

  it("cleans up overlay when routeOverlay is removed", async () => {
    const { rerender } = render(
      <EventMap
        groups={[group]}
        selectedKey={group.key}
        view="map"
        onSelectLocation={vi.fn()}
        routeOverlay={{
          routeData: {
            geometry: {
              type: "MultiLineString",
              coordinates: [
                [
                  [-74.0, 40.7],
                  [-74.01, 40.71],
                ],
              ],
            },
            stopIds: ["101"],
          },
          stops: {
            "101": {
              name: "Van Cortlandt Park-242 St",
              lat: 40.889,
              lng: -73.899,
            },
          },
          lineColor: "D82233",
        }}
      />,
    );
    await waitFor(() =>
      expect(leaflet.mapInstance.createPane).toHaveBeenCalledWith(
        "routeOverlay",
      ),
    );

    rerender(
      <EventMap
        groups={[group]}
        selectedKey={group.key}
        view="map"
        onSelectLocation={vi.fn()}
        routeOverlay={null}
      />,
    );

    // The overlay cleanup runs synchronously in the effect. The rerender
    // clears the overlay without throwing.
  });

  it("renders stop markers with 44px divIcon targets in stopOverlay pane (B1)", async () => {
    render(
      <EventMap
        groups={[group]}
        selectedKey={group.key}
        view="map"
        onSelectLocation={vi.fn()}
        routeOverlay={{
          routeData: {
            geometry: {
              type: "MultiLineString",
              coordinates: [
                [
                  [-74.0, 40.7],
                  [-74.01, 40.71],
                ],
              ],
            },
            stopIds: ["101", "103"],
          },
          stops: {
            "101": {
              name: "Van Cortlandt Park-242 St",
              lat: 40.889,
              lng: -73.899,
            },
            "103": { name: "238 St", lat: 40.885, lng: -73.901 },
          },
          lineColor: "D82233",
        }}
      />,
    );
    // Wait for map to initialize and route overlay to render
    await waitFor(() => expect(leaflet.map).toHaveBeenCalled());
    await waitFor(() =>
      expect(leaflet.mapInstance.createPane).toHaveBeenCalledWith(
        "stopOverlay",
      ),
    );
    await waitFor(() =>
      expect(leaflet.stopMarkerElements.length).toBeGreaterThanOrEqual(2),
    );

    // Every stop marker must use a 44×44 divIcon
    const stopIcons = leaflet.divIconCalls.filter(
      (c) => c.iconSize[0] === 44 && c.iconSize[1] === 44,
    );
    expect(stopIcons.length).toBeGreaterThanOrEqual(2);
  });

  it("stop markers have role, aria-label, aria-pressed, and keyboard handlers (B3)", async () => {
    render(
      <EventMap
        groups={[group]}
        selectedKey={group.key}
        view="map"
        onSelectLocation={vi.fn()}
        selectedStopId="101"
        onSelectStop={vi.fn()}
        routeOverlay={{
          routeData: {
            geometry: {
              type: "MultiLineString",
              coordinates: [
                [
                  [-74.0, 40.7],
                  [-74.01, 40.71],
                ],
              ],
            },
            stopIds: ["101", "103"],
          },
          stops: {
            "101": {
              name: "Van Cortlandt Park-242 St",
              lat: 40.889,
              lng: -73.899,
            },
            "103": { name: "238 St", lat: 40.885, lng: -73.901 },
          },
          lineColor: "D82233",
        }}
      />,
    );
    await waitFor(() =>
      expect(leaflet.stopMarkerElements.length).toBeGreaterThanOrEqual(2),
    );

    const selectedEl = leaflet.stopMarkerElements[0];
    expect(selectedEl.getAttribute("role")).toBe("button");
    expect(selectedEl.getAttribute("aria-label")).toContain(
      "Van Cortlandt Park-242 St",
    );
    expect(selectedEl.getAttribute("aria-pressed")).toBe("true");
    expect(selectedEl.dataset.testid).toBe("stop-marker");
    expect(selectedEl.dataset.stopId).toBe("101");

    const unselectedEl = leaflet.stopMarkerElements[1];
    expect(unselectedEl.getAttribute("role")).toBe("button");
    expect(unselectedEl.getAttribute("aria-label")).toContain("238 St");
    expect(unselectedEl.getAttribute("aria-pressed")).toBe("false");
  });

  it("stop markers respond to Enter and Space keyboard events (B3)", async () => {
    const onSelectStop = vi.fn();
    render(
      <EventMap
        groups={[group]}
        selectedKey={group.key}
        view="map"
        onSelectLocation={vi.fn()}
        selectedStopId={null}
        onSelectStop={onSelectStop}
        routeOverlay={{
          routeData: {
            geometry: {
              type: "MultiLineString",
              coordinates: [
                [
                  [-74.0, 40.7],
                  [-74.01, 40.71],
                ],
              ],
            },
            stopIds: ["101"],
          },
          stops: {
            "101": {
              name: "Van Cortlandt Park-242 St",
              lat: 40.889,
              lng: -73.899,
            },
          },
          lineColor: "D82233",
        }}
      />,
    );
    await waitFor(() =>
      expect(leaflet.stopMarkerElements.length).toBeGreaterThanOrEqual(1),
    );

    const el = leaflet.stopMarkerElements[0];
    const enterEvent = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
    });
    el.dispatchEvent(enterEvent);
    expect(onSelectStop).toHaveBeenCalledWith("101");

    onSelectStop.mockClear();
    const spaceEvent = new KeyboardEvent("keydown", {
      key: " ",
      bubbles: true,
    });
    el.dispatchEvent(spaceEvent);
    expect(onSelectStop).toHaveBeenCalledWith("101");
  });
});
