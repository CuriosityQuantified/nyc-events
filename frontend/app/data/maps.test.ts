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

  it("aggregates shared locations without merging conflicting identities", () => {
    const coordinate = { latitude: 40.75, longitude: -73.98 };
    const groups = groupEventsByLocation([
      event({ guid: "a", locationId: "M1", coordinates: [coordinate] }),
      event({ guid: "b", locationId: "M1", coordinates: [coordinate] }),
      event({ guid: "c", locationId: "M2", coordinates: [coordinate] }),
      event({
        guid: "d",
        locationId: "M1",
        coordinates: [{ latitude: 40.751, longitude: -73.98 }],
      }),
    ]);

    expect(groups).toHaveLength(3);
    expect(
      groups.find((group) => group.key.startsWith("M1|40.750000"))?.events,
    ).toHaveLength(2);
  });

  it("places multi-location events once at each unique valid location", () => {
    const one = { latitude: 40.7, longitude: -73.9 };
    const two = { latitude: 40.8, longitude: -73.8 };
    const source = event({
      guid: "multi",
      coordinates: [one, one, two, { latitude: 0, longitude: 0 }],
    });

    expect(validEventCoordinates(source)).toEqual([one, two]);
    expect(groupEventsByLocation([source])).toHaveLength(2);
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
