import { describe, expect, it } from "vitest";
import eventList from "../../../contracts/golden/events-list.json";
import { apiToUiEvent, parseEventsResponse, type ParkEvent } from "./events";
import {
  groupEventsByLocation,
  isValidCoordinate,
  locationKey,
  markerDiameter,
  normalizeCoordinate,
  osmMarkerUrl,
  OSM_ATTRIBUTION,
  OSM_ATTRIBUTION_URL,
  OSM_MAX_ZOOM,
  OSM_MIN_ZOOM,
  OSM_TILE_URL,
  previewZoom,
  validEventCoordinates,
} from "./maps";

const base = apiToUiEvent(parseEventsResponse(eventList).events[0]);

function event(overrides: Partial<ParkEvent>): ParkEvent {
  return { ...base, ...overrides };
}

describe("Issue #26 location identity and marker rules", () => {
  it("accepts bounded finite coordinates and rejects null island", () => {
    expect(isValidCoordinate({ latitude: 40.7, longitude: -73.9 })).toBe(true);
    for (const value of [
      { latitude: 0, longitude: 0 },
      { latitude: 91, longitude: 0 },
      { latitude: 0, longitude: -181 },
      { latitude: Number.NaN, longitude: 1 },
      null,
    ]) {
      expect(isValidCoordinate(value)).toBe(false);
    }
  });

  it("normalizes to six places and uses source id plus coordinates", () => {
    const coordinate = { latitude: 40.71234567, longitude: -73.91234567 };
    expect(normalizeCoordinate(coordinate)).toBe("40.712346,-73.912346");
    expect(locationKey(" Q123 ", coordinate)).toBe("Q123|40.712346,-73.912346");
    expect(locationKey(null, coordinate)).toBe("40.712346,-73.912346");
  });

  it("uses stable source identity and coordinates, never display spelling", () => {
    const coordinate = { latitude: 40.75, longitude: -73.98 };
    const groups = groupEventsByLocation([
      event({
        guid: "a",
        location: "Central Park",
        locationId: "M010",
        coordinates: [coordinate],
      }),
      event({
        guid: "b",
        location: "central park ",
        locationId: "M010",
        coordinates: [coordinate],
      }),
      event({
        guid: "c",
        location: "Central Park",
        locationId: "M011",
        coordinates: [coordinate],
      }),
      event({
        guid: "d",
        location: "Central Park",
        locationId: "M010",
        coordinates: [{ latitude: 40.751, longitude: -73.98 }],
      }),
    ]);

    expect(groups).toHaveLength(3);
    const central = groups.find(
      (group) => group.key === "M010|40.750000,-73.980000",
    );
    expect(central?.events.map((item) => item.guid)).toEqual(["a", "b"]);
    expect(central?.latitude).toBe(40.75);
  });

  it("keeps coordinate-less and null-island events out of map groups", () => {
    const groups = groupEventsByLocation([
      event({
        guid: "no-coords",
        location: "Central Park",
        coordinates: [{ latitude: 0, longitude: 0 }],
        positionAccuracy: "not-listed",
      }),
      event({
        guid: "nothing",
        location: "Location not listed",
        coordinates: [],
      }),
    ]);

    expect(groups).toEqual([]);
  });

  it("places a multi-location event once at each unique location", () => {
    const one = { latitude: 40.7, longitude: -73.9 };
    const two = { latitude: 40.8, longitude: -73.8 };
    const source = event({
      guid: "multi",
      coordinates: [one, one, two, { latitude: 0, longitude: 0 }],
    });

    expect(validEventCoordinates(source)).toEqual([one, two]);
    const groups = groupEventsByLocation([source]);
    expect(groups).toHaveLength(2);
    expect(groups.map((group) => [group.latitude, group.longitude])).toEqual([
      [one.latitude, one.longitude],
      [two.latitude, two.longitude],
    ]);
    expect(groups.every((group) => group.events[0].guid === "multi")).toBe(
      true,
    );
  });

  it("uses the strict bounded marker formula", () => {
    expect(markerDiameter(1)).toBe(16);
    expect(markerDiameter(2)).toBe(22);
    expect(markerDiameter(4)).toBe(28);
    expect(markerDiameter(16)).toBe(40);
    expect(markerDiameter(64)).toBe(48);
    expect(markerDiameter(4096)).toBe(48);
    expect(() => markerDiameter(0)).toThrow(/positive integer/);
  });

  it("centralizes a fixed HTTPS tile policy and exact OSM marker URL", () => {
    expect(OSM_TILE_URL).toBe("https://tile.openstreetmap.org/{z}/{x}/{y}.png");
    expect(OSM_TILE_URL).not.toContain("?");
    expect(OSM_ATTRIBUTION).toBe("© OpenStreetMap contributors");
    expect(OSM_ATTRIBUTION_URL).toBe("https://www.openstreetmap.org/copyright");
    expect(OSM_MIN_ZOOM).toBeLessThan(OSM_MAX_ZOOM);
    expect(previewZoom(-99)).toBe(OSM_MIN_ZOOM);
    expect(previewZoom(999)).toBe(OSM_MAX_ZOOM);
    expect(previewZoom(Number.NaN)).toBeGreaterThanOrEqual(OSM_MIN_ZOOM);

    const url = new URL(
      osmMarkerUrl({ latitude: 40.71234567, longitude: -73.91234567 }, 15),
    );
    expect(url.origin).toBe("https://www.openstreetmap.org");
    expect(url.searchParams.get("mlat")).toBe("40.712346");
    expect(url.searchParams.get("mlon")).toBe("-73.912346");
    expect(url.hash).toBe("#map=15/40.712346/-73.912346");
    expect(() => osmMarkerUrl({ latitude: 0, longitude: 0 }, 15)).toThrow(
      /valid coordinate/,
    );
  });
});
