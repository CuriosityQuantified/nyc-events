import { describe, expect, it } from "vitest";
import eventList from "../../../contracts/golden/events-list.json";
import { apiToUiEvent, parseEventsResponse, type ParkEvent } from "./events";
import {
  googleMapsDirectionsUrl,
  groupEventsByLocation,
  isValidCoordinate,
  locationKey,
  markerDiameter,
  normalizeCoordinate,
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

  it("merges events sharing a location name into one place marker", () => {
    const coordinate = { latitude: 40.75, longitude: -73.98 };
    const groups = groupEventsByLocation([
      event({ guid: "a", location: "Central Park", coordinates: [coordinate] }),
      event({
        guid: "b",
        location: "central park ",
        coordinates: [{ latitude: 40.751, longitude: -73.98 }],
      }),
      event({
        guid: "c",
        location: "Prospect Park",
        coordinates: [{ latitude: 40.66, longitude: -73.97 }],
      }),
    ]);

    expect(groups).toHaveLength(2);
    const central = groups.find((group) => group.name === "Central Park");
    expect(central?.events.map((item) => item.guid)).toEqual(["a", "b"]);
    expect(central?.latitude).toBeCloseTo(40.7505, 4);
    expect(central?.accuracy).toBe("approximate");
  });

  it("maps a coordinate-less event through its shared location name", () => {
    const coordinate = { latitude: 40.75, longitude: -73.98 };
    const groups = groupEventsByLocation([
      event({ guid: "a", location: "Central Park", coordinates: [coordinate] }),
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

    expect(groups).toHaveLength(1);
    expect(groups[0].events.map((item) => item.guid)).toEqual([
      "a",
      "no-coords",
    ]);
  });

  it("collapses a multi-coordinate event to one centroid marker", () => {
    const one = { latitude: 40.7, longitude: -73.9 };
    const two = { latitude: 40.8, longitude: -73.8 };
    const source = event({
      guid: "multi",
      coordinates: [one, one, two, { latitude: 0, longitude: 0 }],
    });

    expect(validEventCoordinates(source)).toEqual([one, two]);
    const groups = groupEventsByLocation([source]);
    expect(groups).toHaveLength(1);
    expect(groups[0].latitude).toBeCloseTo(40.75, 6);
    expect(groups[0].longitude).toBeCloseTo(-73.85, 6);
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

  it("builds a fixed Google Maps directions handoff", () => {
    const url = new URL(
      googleMapsDirectionsUrl({
        latitude: 40.71234567,
        longitude: -73.91234567,
      }),
    );
    expect(url.origin).toBe("https://www.google.com");
    expect(url.pathname).toBe("/maps/dir/");
    expect(url.searchParams.get("api")).toBe("1");
    expect(url.searchParams.get("destination")).toBe("40.712346,-73.912346");
  });
});
