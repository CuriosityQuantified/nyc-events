import type { ParkEvent } from "./events";

export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type LocationGroup = {
  key: string;
  latitude: number;
  longitude: number;
  name: string;
  borough: string;
  accuracy: ParkEvent["positionAccuracy"];
  events: ParkEvent[];
};

export function isValidCoordinate(value: unknown): value is Coordinate {
  if (!value || typeof value !== "object") return false;
  const coordinate = value as Partial<Coordinate>;
  return (
    Number.isFinite(coordinate.latitude) &&
    Number.isFinite(coordinate.longitude) &&
    coordinate.latitude! >= -90 &&
    coordinate.latitude! <= 90 &&
    coordinate.longitude! >= -180 &&
    coordinate.longitude! <= 180 &&
    !(coordinate.latitude === 0 && coordinate.longitude === 0)
  );
}

export function normalizeCoordinate(coordinate: Coordinate): string {
  return `${coordinate.latitude.toFixed(6)},${coordinate.longitude.toFixed(6)}`;
}

export function validEventCoordinates(event: ParkEvent): Coordinate[] {
  const unique = new Map<string, Coordinate>();
  for (const coordinate of event.coordinates) {
    if (!isValidCoordinate(coordinate)) continue;
    unique.set(normalizeCoordinate(coordinate), coordinate);
  }
  return [...unique.values()];
}

export function locationKey(
  locationId: string | null,
  coordinate: Coordinate,
): string {
  const normalized = normalizeCoordinate(coordinate);
  return locationId?.trim() ? `${locationId.trim()}|${normalized}` : normalized;
}

export function groupEventsByLocation(events: ParkEvent[]): LocationGroup[] {
  const groups = new Map<string, LocationGroup>();
  for (const event of events) {
    for (const coordinate of validEventCoordinates(event)) {
      const key = locationKey(event.locationId, coordinate);
      const group = groups.get(key);
      if (group) {
        if (!group.events.some((item) => item.guid === event.guid)) {
          group.events.push(event);
        }
        continue;
      }
      groups.set(key, {
        key,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        name: event.location,
        borough: event.borough,
        accuracy: event.positionAccuracy,
        events: [event],
      });
    }
  }
  return [...groups.values()];
}

export function markerDiameter(eventCount: number): number {
  if (!Number.isInteger(eventCount) || eventCount < 1) {
    throw new RangeError("Marker event count must be a positive integer");
  }
  return Math.min(48, 16 + 6 * Math.log2(eventCount));
}

export function googleMapsDirectionsUrl(coordinate: Coordinate): string {
  const destination = normalizeCoordinate(coordinate);
  const params = new URLSearchParams({ api: "1", destination });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function thumbnailPath(
  event: ParkEvent,
  variant: "compact" | "detail",
  coordinateIndex = 0,
): string | null {
  if (!validEventCoordinates(event)[coordinateIndex]) return null;
  const params = new URLSearchParams({
    guid: event.guid,
    variant,
    location: String(coordinateIndex),
  });
  return `/api/maps/thumbnail?${params.toString()}`;
}
