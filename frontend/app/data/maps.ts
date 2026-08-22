import type { ParkEvent } from "./events";

export const OSM_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIBUTION = "© OpenStreetMap contributors";
export const OSM_ATTRIBUTION_URL = "https://www.openstreetmap.org/copyright";
export const OSM_MIN_ZOOM = 9;
export const OSM_MAX_ZOOM = 18;
export const OSM_PREVIEW_ZOOM = 15;

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

export function validCoordinates(values: readonly unknown[]): Coordinate[] {
  const unique = new Map<string, Coordinate>();
  for (const coordinate of values) {
    if (!isValidCoordinate(coordinate)) continue;
    unique.set(normalizeCoordinate(coordinate), coordinate);
  }
  return [...unique.values()];
}

export function validEventCoordinates(event: ParkEvent): Coordinate[] {
  return validCoordinates(event.coordinates);
}

export function locationKey(
  locationId: string | null,
  coordinate: Coordinate,
): string {
  const normalized = normalizeCoordinate(coordinate);
  return locationId?.trim() ? `${locationId.trim()}|${normalized}` : normalized;
}

/**
 * A Location is the source Location ID plus one normalized coordinate. Display
 * spelling never changes identity. A multi-Location Event enters each unique
 * group once, while its source guid remains the Event identity.
 */
export function groupEventsByLocation(events: ParkEvent[]): LocationGroup[] {
  const groups = new Map<string, LocationGroup>();
  const guids = new Map<string, Set<string>>();

  for (const event of events) {
    for (const coordinate of validEventCoordinates(event)) {
      const key = locationKey(event.locationId, coordinate);
      let group = groups.get(key);
      if (!group) {
        group = {
          key,
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          name: event.location,
          borough: event.borough,
          accuracy: event.positionAccuracy,
          events: [],
        };
        groups.set(key, group);
        guids.set(key, new Set());
      }
      const seen = guids.get(key)!;
      if (!seen.has(event.guid)) {
        seen.add(event.guid);
        group.events.push(event);
      }
      if (event.positionAccuracy !== "exact") group.accuracy = "approximate";
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

export function previewZoom(value: number = OSM_PREVIEW_ZOOM): number {
  if (!Number.isFinite(value)) return OSM_PREVIEW_ZOOM;
  return Math.min(OSM_MAX_ZOOM, Math.max(OSM_MIN_ZOOM, Math.round(value)));
}

export function osmMarkerUrl(
  coordinate: Coordinate,
  zoom: number = OSM_PREVIEW_ZOOM,
): string {
  if (!isValidCoordinate(coordinate)) {
    throw new RangeError("OpenStreetMap marker requires a valid coordinate");
  }
  const normalized = normalizeCoordinate(coordinate);
  const [latitude, longitude] = normalized.split(",");
  const url = new URL("https://www.openstreetmap.org/");
  url.searchParams.set("mlat", latitude);
  url.searchParams.set("mlon", longitude);
  url.hash = `map=${previewZoom(zoom)}/${latitude}/${longitude}`;
  return url.toString();
}
