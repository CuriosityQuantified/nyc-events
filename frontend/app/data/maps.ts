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

function locationNameKey(event: ParkEvent): string | null {
  const name = event.location.trim().toLowerCase();
  if (!name || name === "location not listed") return null;
  return `name:${name}|${event.borough.trim().toLowerCase()}`;
}

/**
 * One marker per place. Events sharing a location name (within a borough)
 * form a single group even when their stored coordinates differ or are
 * missing — an event with only a park name joins the park's marker, placed
 * at the centroid of every coordinate its events brought. Events without a
 * usable name fall back to one group per exact coordinate. Events with
 * neither stay off the map (the caller lists them separately).
 */
export function groupEventsByLocation(events: ParkEvent[]): LocationGroup[] {
  type Draft = {
    key: string;
    name: string;
    borough: string;
    coordinates: Map<string, Coordinate>;
    events: ParkEvent[];
    guids: Set<string>;
    allExact: boolean;
  };
  const drafts = new Map<string, Draft>();

  function draftFor(key: string, event: ParkEvent): Draft {
    const existing = drafts.get(key);
    if (existing) return existing;
    const created: Draft = {
      key,
      name: event.location,
      borough: event.borough,
      coordinates: new Map(),
      events: [],
      guids: new Set(),
      allExact: true,
    };
    drafts.set(key, created);
    return created;
  }

  for (const event of events) {
    const coordinates = validEventCoordinates(event);
    const nameKey = locationNameKey(event);
    if (!nameKey && coordinates.length === 0) continue;
    const key = nameKey ?? locationKey(event.locationId, coordinates[0]);
    const draft = draftFor(key, event);
    for (const coordinate of nameKey ? coordinates : coordinates.slice(0, 1)) {
      draft.coordinates.set(normalizeCoordinate(coordinate), coordinate);
    }
    if (!draft.guids.has(event.guid)) {
      draft.guids.add(event.guid);
      draft.events.push(event);
    }
    if (event.positionAccuracy !== "exact") draft.allExact = false;
  }

  const groups: LocationGroup[] = [];
  for (const draft of drafts.values()) {
    const coordinates = [...draft.coordinates.values()];
    if (coordinates.length === 0) continue;
    const latitude =
      coordinates.reduce((sum, c) => sum + c.latitude, 0) / coordinates.length;
    const longitude =
      coordinates.reduce((sum, c) => sum + c.longitude, 0) / coordinates.length;
    groups.push({
      key: draft.key,
      latitude,
      longitude,
      name: draft.name,
      borough: draft.borough,
      accuracy:
        coordinates.length === 1 && draft.allExact ? "exact" : "approximate",
      events: draft.events,
    });
  }
  return groups;
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
