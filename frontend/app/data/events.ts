import { applyEventFilters, type FilterState } from "./filters";

export type ParkEvent = {
  id: string;
  guid: string;
  title: string;
  location: string;
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
};

export type EventPage = {
  events: ParkEvent[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type Freshness = {
  lastSuccessfulSync: string | null;
  snapshotRowCount: number | null;
  isStale: boolean;
};

type ApiFact<T> = {
  value: T | null;
  provenance: string;
  raw: string | null;
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
};

type ApiEventsResponse = {
  events: ApiEvent[];
  page: number;
  page_size: number;
  total: number;
  applied_facets: Record<string, string[]>;
};

type ApiFreshness = {
  last_successful_sync: ApiFact<string>;
  snapshot_row_count: ApiFact<number>;
  is_stale: ApiFact<boolean>;
};

function apiBaseUrl(): string {
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

function safeOfficialUrl(value: string | null): string | null {
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

function parseApiEvent(value: unknown): ApiEvent {
  if (!isRecord(value) || typeof value.guid !== "string" || !value.guid) {
    throw new TypeError("Event is missing its source guid");
  }
  for (const field of FACT_FIELDS) {
    if (!isFact(value[field])) {
      throw new TypeError(`Event field ${field} is not a contract Fact`);
    }
  }
  return value as ApiEvent;
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
    events: value.events.map(parseApiEvent),
    page: Number(value.page),
    page_size: Number(value.page_size),
    total: Number(value.total),
    applied_facets: value.applied_facets as Record<string, string[]>,
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
  };
}

async function apiFetch(path: string): Promise<Response> {
  const response = await fetch(`${apiBaseUrl()}${path}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Events API returned HTTP ${response.status}`);
  }
  return response;
}

export async function getEvents(page = 1, pageSize = 12): Promise<EventPage> {
  const response = await apiFetch(`/events?page=${page}&page_size=${pageSize}`);
  const data = parseEventsResponse(await response.json());
  return {
    events: data.events.map(apiToUiEvent),
    page: data.page,
    pageSize: data.page_size,
    total: data.total,
    totalPages: Math.ceil(data.total / data.page_size),
  };
}

export async function getFilteredEvents(
  filters: FilterState,
  page = 1,
  pageSize = 12,
  now = new Date(),
): Promise<EventPage> {
  const sourcePageSize = 100;
  const maximumSourcePages = 10;
  const first = await getEvents(1, sourcePageSize);
  if (first.totalPages > maximumSourcePages) {
    throw new Error("Event result set exceeds the bounded filter window");
  }

  const remaining: EventPage[] = [];
  for (let sourcePage = 2; sourcePage <= first.totalPages; sourcePage += 1) {
    remaining.push(await getEvents(sourcePage, sourcePageSize));
  }
  const filtered = applyEventFilters(
    [first, ...remaining].flatMap((result) => result.events),
    filters,
    now,
  );
  const start = (page - 1) * pageSize;
  return {
    events: filtered.slice(start, start + pageSize),
    page,
    pageSize,
    total: filtered.length,
    totalPages: Math.ceil(filtered.length / pageSize),
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
