import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ParkEvent } from "@/app/data/events";
import type { LocationGroup } from "@/app/data/maps";
import EventMap from "./EventMap";

const leaflet = vi.hoisted(() => {
  const tileHandlers = new Map<string, () => void>();
  const mapInstance = {
    fitBounds: vi.fn(),
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
  return {
    map: vi.fn(() => mapInstance),
    mapInstance,
    tileHandlers,
    tileLayer,
  };
});

vi.mock("leaflet", () => ({
  divIcon: vi.fn(() => ({})),
  latLngBounds: vi.fn(() => ({})),
  map: leaflet.map,
  marker: vi.fn(() => ({
    addTo: vi.fn(function (this: unknown) {
      return this;
    }),
    getElement: vi.fn(() => null),
    on: vi.fn(),
    remove: vi.fn(),
  })),
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
  leaflet.mapInstance.remove.mockClear();
  leaflet.mapInstance.zoomIn.mockClear();
  leaflet.tileHandlers.clear();
  leaflet.tileLayer.addTo.mockClear();
  leaflet.tileLayer.remove.mockClear();
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
});
