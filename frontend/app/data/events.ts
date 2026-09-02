import {
  applyEventFilters,
  hasActiveFilters,
  type FilterState,
} from "./filters";

export type ParkEvent = {
  id: string;
  guid: string;
  title: string;
  location: string;
  locationId: string | null;
  coordinates: Array<{ latitude: number; longitude: number }>;
  positionAccuracy: "exact" | "approximate" | "not-listed";
  borough: string;
  category: string;
  categories: string[];
  startDate: string | null;
  date: string;
  time: string;
  costType: "Free" | "Paid" | "Not listed";
  registration: string;
  registrationStatus: "required" | "not_required" | "closed" | "not_listed";
  accessibility: string;
  imageAlt: string;
  officialUrl: string | null;
  lifecycleStatus?: EventLifecycleStatus | null;
  description?: string | null;
  startDateTime?: string | null;
  endDateTime?: string | null;
  endDate?: string | null;
  subwayProximity?: {
    lineId: string;
    nearestStop: { id: string; name: string };
    straightLineDistanceMiles: number;
  } | null;
};

export type EventLifecycleStatus =
  | "current"
  | "new"
  | "changed"
  | "unchanged"
  | "cancelled"
  | "expired"
  | "removed";

export type TransitSource = {
  id: string;
  attribution: string;
  sourceUrl: string;
  lastUpdated: string;
};

export type EventPage = {
  events: ParkEvent[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  transitSource?: TransitSource | null;
};

export type Freshness = {
  lastSuccessfulSync: string | null;
  snapshotRowCount: number | null;
  isStale: boolean;
};

export function uniqueEventsByGuid(events: ParkEvent[]): ParkEvent[] {
  const unique = new Map<string, ParkEvent>();
  for (const event of events) {
    if (!unique.has(event.guid)) unique.set(event.guid, event);
  }
  return [...unique.values()];
}

export type Provenance = "Stated" | "Derived" | "Not listed";

export type ApiFact<T> = {
  value: T | null;
  provenance: string;
  raw: string | null;
};

export type ApiSubwayProximity = {
  line_id: string;
  nearest_stop: { id: string; name: string };
  straight_line_distance_miles: number;
};

export type ApiEvent = {
  guid: string;
  title: ApiFact<string>;
  description: ApiFact<string>;
  official_event_url: ApiFact<string>;
  location_id: ApiFact<string>;
  location_name: ApiFact<string>;
  borough: ApiFact<string>;
  start_datetime: ApiFact<string>;
  end_datetime: ApiFact<string>;
  start_date: ApiFact<string>;
  end_date: ApiFact<string>;
  categories: ApiFact<string[]>;
  coordinates: ApiFact<Array<{ latitude: number; longitude: number }>>;
  registration_status: ApiFact<string>;
  registration_description: ApiFact<string>;
  is_free_explicit: ApiFact<boolean>;
  accessibility_mentioned: ApiFact<boolean>;
  lifecycle_status?: ApiFact<string>;
  status?: ApiFact<string>;
  subway_proximity?: ApiSubwayProximity | null;
};

type ApiTransitSource = {
  id: string;
  attribution: string;
  source_url: string;
  last_updated: string;
};

type ApiEventsResponse = {
  events: ApiEvent[];
  page: number;
  page_size: number;
  total: number;
  applied_facets: Record<string, string[]>;
  transit_source?: ApiTransitSource | null;
};

type ApiFreshness = {
  last_successful_sync: ApiFact<string>;
  snapshot_row_count: ApiFact<number>;
  is_stale: ApiFact<boolean>;
};

export function apiBaseUrl(): string {
  const configured = process.env.API_BASE_URL?.replace(/\/$/, "");
  if (!configured) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("API_BASE_URL is required in production");
    }
    return "http://127.0.0.1:8000";
  }
  return configured;
}

function formatTime(value: string | null): string {
  if (!value) return "Time not listed";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Time not listed";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  }).format(parsed);
}

function formatDate(value: string | null): string {
  if (!value) return "Date not listed";
  const parsed = new Date(`${value.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return "Date not listed";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  }).format(parsed);
}

export function safeOfficialUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

const FACT_FIELDS = [
  "title",
  "description",
  "official_event_url",
  "location_id",
  "location_name",
  "start_date",
  "end_date",
  "start_datetime",
  "end_datetime",
  "categories",
  "coordinates",
  "borough",
  "registration_status",
  "registration_description",
  "is_free_explicit",
  "accessibility_mentioned",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFact(value: unknown): boolean {
  return (
    isRecord(value) &&
    ["Stated", "Derived", "Not listed"].includes(String(value.provenance)) &&
    "value" in value
  );
}

function parseSubwayProximity(value: unknown): ApiSubwayProximity {
  if (
    !isRecord(value) ||
    typeof value.line_id !== "string" ||
    value.line_id.length === 0 ||
    !isRecord(value.nearest_stop) ||
    typeof value.nearest_stop.id !== "string" ||
    value.nearest_stop.id.length === 0 ||
    typeof value.nearest_stop.name !== "string" ||
    value.nearest_stop.name.length === 0 ||
    typeof value.straight_line_distance_miles !== "number" ||
    !Number.isFinite(value.straight_line_distance_miles) ||
    value.straight_line_distance_miles < 0 ||
    value.straight_line_distance_miles >= 0.5
  ) {
    throw new TypeError(
      "Event subway_proximity does not match the API contract",
    );
  }
  return {
    line_id: value.line_id,
    nearest_stop: {
      id: value.nearest_stop.id,
      name: value.nearest_stop.name,
    },
    straight_line_distance_miles: value.straight_line_distance_miles,
  };
}

export function parseEventResponse(value: unknown): ApiEvent {
  if (!isRecord(value) || typeof value.guid !== "string" || !value.guid) {
    throw new TypeError("Event is missing its source guid");
  }
  for (const field of FACT_FIELDS) {
    if (!isFact(value[field])) {
      throw new TypeError(`Event field ${field} is not a contract Fact`);
    }
  }
  for (const field of ["lifecycle_status", "status"] as const) {
    if (field in value && !isFact(value[field])) {
      throw new TypeError(`Event field ${field} is not a contract Fact`);
    }
  }
  return {
    ...(value as ApiEvent),
    subway_proximity:
      value.subway_proximity == null
        ? null
        : parseSubwayProximity(value.subway_proximity),
  };
}

const EVENT_LIFECYCLE_STATUSES = new Set<EventLifecycleStatus>([
  "current",
  "new",
  "changed",
  "unchanged",
  "cancelled",
  "expired",
  "removed",
]);

export function eventLifecycleStatus(
  event: ApiEvent,
): EventLifecycleStatus | null {
  const value = event.lifecycle_status?.value ?? event.status?.value;
  return typeof value === "string" &&
    EVENT_LIFECYCLE_STATUSES.has(value as EventLifecycleStatus)
    ? (value as EventLifecycleStatus)
    : null;
}

function parseTransitSource(value: unknown): ApiTransitSource | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    typeof value.attribution !== "string" ||
    typeof value.source_url !== "string" ||
    typeof value.last_updated !== "string"
  ) {
    return null;
  }
  return {
    id: value.id,
    attribution: value.attribution,
    source_url: value.source_url,
    last_updated: value.last_updated,
  };
}

function apiToUiTransitSource(source: ApiTransitSource): TransitSource {
  return {
    id: source.id,
    attribution: source.attribution,
    sourceUrl: source.source_url,
    lastUpdated: source.last_updated,
  };
}

export function parseEventsResponse(value: unknown): ApiEventsResponse {
  if (
    !isRecord(value) ||
    !Array.isArray(value.events) ||
    !Number.isInteger(value.page) ||
    !Number.isInteger(value.page_size) ||
    !Number.isInteger(value.total) ||
    Number(value.page) < 1 ||
    Number(value.page_size) < 1 ||
    Number(value.total) < 0 ||
    !isRecord(value.applied_facets)
  ) {
    throw new TypeError("Events response does not match the API contract");
  }
  return {
    events: value.events.map(parseEventResponse),
    page: Number(value.page),
    page_size: Number(value.page_size),
    total: Number(value.total),
    applied_facets: value.applied_facets as Record<string, string[]>,
    transit_source: value.transit_source
      ? parseTransitSource(value.transit_source)
      : null,
  };
}

export function parseFreshnessResponse(value: unknown): ApiFreshness {
  if (
    !isRecord(value) ||
    !isFact(value.last_successful_sync) ||
    !isFact(value.snapshot_row_count) ||
    !isFact(value.is_stale)
  ) {
    throw new TypeError("Freshness response does not match the API contract");
  }
  return value as ApiFreshness;
}

export function apiToUiEvent(event: ApiEvent): ParkEvent {
  const categories = event.categories.value ?? [];
  const category = categories[0] ?? "Category not listed";
  const location = event.location_name.value ?? "Location not listed";
  const borough = event.borough.value ?? "Borough not listed";
  const explicitFree = event.is_free_explicit.value;
  const registrationStatus = event.registration_status.value;
  const registration =
    event.registration_description.value ??
    (registrationStatus === "required"
      ? "Registration required"
      : registrationStatus === "not_required"
        ? "Registration not required"
        : registrationStatus === "closed"
          ? "Registration closed"
          : "Registration not listed");
  const accessibility =
    event.accessibility_mentioned.value === true
      ? "Accessibility information is mentioned in the official listing"
      : event.accessibility_mentioned.value === false
        ? "Accessibility information is not mentioned in the official listing"
        : "Accessibility information not listed";

  return {
    id: event.guid,
    guid: event.guid,
    title: event.title.value ?? "Untitled event",
    location,
    locationId: event.location_id.value?.trim() || null,
    coordinates: Array.isArray(event.coordinates.value)
      ? event.coordinates.value
      : [],
    positionAccuracy:
      event.coordinates.value === null
        ? "not-listed"
        : event.coordinates.provenance === "Stated"
          ? "exact"
          : "approximate",
    borough,
    category,
    categories,
    startDate: event.start_date.value?.slice(0, 10) ?? null,
    date: formatDate(event.start_date.value),
    time: formatTime(event.start_datetime.value),
    costType:
      explicitFree === true
        ? "Free"
        : explicitFree === false
          ? "Paid"
          : "Not listed",
    registration,
    registrationStatus:
      registrationStatus === "required" ||
      registrationStatus === "not_required" ||
      registrationStatus === "closed"
        ? registrationStatus
        : "not_listed",
    accessibility,
    imageAlt: `${category} event at ${location}`,
    officialUrl: safeOfficialUrl(event.official_event_url.value),
    lifecycleStatus: eventLifecycleStatus(event),
    description: event.description.value,
    startDateTime: event.start_datetime.value,
    endDateTime: event.end_datetime.value,
    endDate: event.end_date.value?.slice(0, 10) ?? null,
    subwayProximity: event.subway_proximity
      ? {
          lineId: event.subway_proximity.line_id,
          nearestStop: event.subway_proximity.nearest_stop,
          straightLineDistanceMiles:
            event.subway_proximity.straight_line_distance_miles,
        }
      : null,
  };
}

export class EventsApiError extends Error {
  constructor(readonly status: number) {
    super(`Events API returned HTTP ${status}`);
  }
}

async function apiFetch(path: string): Promise<Response> {
  const response = await fetch(`${apiBaseUrl()}${path}`, { cache: "no-store" });
  if (!response.ok) {
    throw new EventsApiError(response.status);
  }
  return response;
}

export async function getEvent(guid: string): Promise<ApiEvent> {
  if (!guid || guid.length > 256) {
    throw new TypeError("Event guid must contain 1 to 256 characters");
  }
  const response = await apiFetch(`/events/${encodeURIComponent(guid)}`);
  return parseEventResponse(await response.json());
}

export async function getEvents(
  page = 1,
  pageSize = 12,
  subwayLine?: string,
): Promise<EventPage> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (subwayLine) params.set("subway_line", subwayLine);
  const response = await apiFetch(`/events?${params.toString()}`);
  const data = parseEventsResponse(await response.json());
  const mapped = data.events.map(apiToUiEvent);
  const events = uniqueEventsByGuid(mapped);
  return {
    events,
    page: data.page,
    pageSize: data.page_size,
    total: data.total,
    totalPages: Math.ceil(data.total / data.page_size),
    transitSource: data.transit_source
      ? apiToUiTransitSource(data.transit_source)
      : null,
  };
}

export async function getFilteredEvents(
  filters: FilterState,
  page = 1,
  pageSize = 12,
  now = new Date(),
): Promise<EventPage> {
  // When subway_line is the only active filter, the backend handles it
  // entirely. No client-side filtering is needed.
  const clientFilters: FilterState = { ...filters, subwayLine: null };
  const needsClientFilter = hasActiveFilters(clientFilters);

  if (!needsClientFilter && !filters.subwayLine) {
    return getEvents(page, pageSize);
  }

  // When only subway_line is set (no client-side filters), let the backend
  // paginate directly.
  if (!needsClientFilter && filters.subwayLine) {
    return getEvents(page, pageSize, filters.subwayLine);
  }

  const sourcePageSize = 100;
  const maximumSourceEvents = 10_000;
  const maximumSourcePages = maximumSourceEvents / sourcePageSize;
  const first = await getEvents(
    1,
    sourcePageSize,
    filters.subwayLine ?? undefined,
  );
  if (first.totalPages > maximumSourcePages) {
    throw new Error("Event result set exceeds the bounded filter window");
  }

  const remaining: EventPage[] = [];
  for (let sourcePage = 2; sourcePage <= first.totalPages; sourcePage += 1) {
    remaining.push(
      await getEvents(
        sourcePage,
        sourcePageSize,
        filters.subwayLine ?? undefined,
      ),
    );
  }
  const sourceEvents = uniqueEventsByGuid(
    [first, ...remaining].flatMap((result) => result.events),
  );
  const filtered = applyEventFilters(sourceEvents, clientFilters, now);
  const start = (page - 1) * pageSize;
  return {
    events: filtered.slice(start, start + pageSize),
    page,
    pageSize,
    total: filtered.length,
    totalPages: Math.ceil(filtered.length / pageSize),
    transitSource: first.transitSource,
  };
}

export async function getFreshness(): Promise<Freshness> {
  const response = await apiFetch("/freshness");
  const data = parseFreshnessResponse(await response.json());
  return {
    lastSuccessfulSync: data.last_successful_sync.value,
    snapshotRowCount: data.snapshot_row_count.value,
    isStale: data.is_stale.value ?? true,
  };
}
