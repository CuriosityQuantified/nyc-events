import type { ParkEvent } from "./events";

export const FILTER_OPTIONS = {
  borough: [
    ["Manhattan", "Manhattan"],
    ["Brooklyn", "Brooklyn"],
    ["Queens", "Queens"],
    ["Bronx", "Bronx"],
    ["Staten Island", "Staten Island"],
  ],
  category: [
    ["Fitness", "Fitness"],
    ["Nature", "Nature"],
    ["Best for Kids", "Family"],
    ["Sports", "Sports"],
    ["Music", "Music"],
    ["Theater", "Theater"],
    ["Art", "Art"],
  ],
  date: [
    ["today", "Today"],
    ["tomorrow", "Tomorrow"],
    ["weekend", "This weekend"],
    ["next14", "Next 14 days"],
  ],
  registration: [
    ["required", "Required"],
    ["not_required", "Not required"],
    ["closed", "Closed"],
    ["not_listed", "Not listed"],
  ],
} as const;

export type FilterKey = keyof typeof FILTER_OPTIONS;
export type FilterState = {
  [K in FilterKey]: (typeof FILTER_OPTIONS)[K][number][0] | null;
} & {
  /** A case-insensitive match across event and park details. */
  query: string;
  /** Events presented to visitors as free, including listings without a cost. */
  freeOnly: boolean;
  /** Exact New York calendar dates, inclusive, as YYYY-MM-DD. */
  dateFrom: string | null;
  dateTo: string | null;
};

export const EMPTY_FILTERS: FilterState = {
  borough: null,
  category: null,
  date: null,
  registration: null,
  query: "",
  freeOnly: false,
  dateFrom: null,
  dateTo: null,
};

const EXACT_DATE_PARAMS = { dateFrom: "date_from", dateTo: "date_to" } as const;
const QUERY_PARAM = "query";
const FREE_PARAM = "free";
const MAX_QUERY_LENGTH = 200;

function normalizeQuery(value: string): string {
  return value.trim().replace(/\s+/g, " ").slice(0, MAX_QUERY_LENGTH);
}

function isValidQuery(value: string): boolean {
  return value.length <= MAX_QUERY_LENGTH && normalizeQuery(value).length > 0;
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

const FILTER_KEYS = Object.keys(FILTER_OPTIONS) as FilterKey[];

function isAllowedValue<K extends FilterKey>(
  key: K,
  value: string,
): value is NonNullable<FilterState[K]> {
  return FILTER_OPTIONS[key].some(([candidate]) => candidate === value);
}

export function filterLabel<K extends FilterKey>(
  key: K,
  value: NonNullable<FilterState[K]>,
): string {
  return (
    FILTER_OPTIONS[key].find(([candidate]) => candidate === value)?.[1] ?? value
  );
}

export function parseFilterSearchParams(params: URLSearchParams): FilterState {
  function valueFor<K extends FilterKey>(key: K): FilterState[K] {
    return (
      params.getAll(key).find((candidate) => isAllowedValue(key, candidate)) ??
      null
    );
  }

  function dateFor(param: string): string | null {
    return params.getAll(param).find(isValidIsoDate) ?? null;
  }

  const query = normalizeQuery(params.get(QUERY_PARAM) ?? "");

  let dateFrom = dateFor(EXACT_DATE_PARAMS.dateFrom);
  let dateTo = dateFor(EXACT_DATE_PARAMS.dateTo);
  if (dateFrom && dateTo && dateFrom > dateTo) {
    dateFrom = null;
    dateTo = null;
  }

  return {
    borough: valueFor("borough"),
    category: valueFor("category"),
    date: valueFor("date"),
    registration: valueFor("registration"),
    query,
    freeOnly: params.getAll(FREE_PARAM).includes("true"),
    dateFrom,
    dateTo,
  };
}

export function parseStrictFilterSearchParams(
  params: URLSearchParams,
): FilterState {
  for (const key of FILTER_KEYS) {
    const values = params.getAll(key);
    if (
      values.length > 1 ||
      (values.length === 1 && !isAllowedValue(key, values[0]))
    ) {
      throw new TypeError(`Invalid ${key} filter`);
    }
  }
  const queries = params.getAll(QUERY_PARAM);
  if (
    queries.length > 1 ||
    (queries.length === 1 && !isValidQuery(queries[0]))
  ) {
    throw new TypeError(`Invalid ${QUERY_PARAM} filter`);
  }
  const freeValues = params.getAll(FREE_PARAM);
  if (
    freeValues.length > 1 ||
    (freeValues.length === 1 && freeValues[0] !== "true")
  ) {
    throw new TypeError(`Invalid ${FREE_PARAM} filter`);
  }
  for (const param of Object.values(EXACT_DATE_PARAMS)) {
    const values = params.getAll(param);
    if (
      values.length > 1 ||
      (values.length === 1 && !isValidIsoDate(values[0]))
    ) {
      throw new TypeError(`Invalid ${param} filter`);
    }
  }
  const from = params.get(EXACT_DATE_PARAMS.dateFrom);
  const to = params.get(EXACT_DATE_PARAMS.dateTo);
  if (from && to && from > to) {
    throw new TypeError("Invalid date_from filter");
  }
  return parseFilterSearchParams(params);
}

export function writeFilterSearchParams(
  current: URLSearchParams,
  filters: FilterState,
): URLSearchParams {
  const next = new URLSearchParams(current);
  for (const key of FILTER_KEYS) {
    next.delete(key);
    const value = filters[key];
    if (value) next.set(key, value);
  }
  for (const [stateKey, param] of Object.entries(EXACT_DATE_PARAMS)) {
    next.delete(param);
    const value = filters[stateKey as "dateFrom" | "dateTo"];
    if (value) next.set(param, value);
  }
  next.delete(QUERY_PARAM);
  const query = normalizeQuery(filters.query);
  if (query) next.set(QUERY_PARAM, query);
  next.delete(FREE_PARAM);
  if (filters.freeOnly) next.set(FREE_PARAM, "true");
  return next;
}

export function hasActiveFilters(filters: FilterState): boolean {
  return (
    FILTER_KEYS.some((key) => filters[key] !== null) ||
    normalizeQuery(filters.query).length > 0 ||
    filters.freeOnly ||
    filters.dateFrom !== null ||
    filters.dateTo !== null
  );
}

export function describeFilters(filters: FilterState): string[] {
  const groupLabels: Record<FilterKey, string> = {
    borough: "Borough",
    category: "Category",
    date: "Date",
    registration: "Registration",
  };
  const described = FILTER_KEYS.flatMap((key) => {
    const value = filters[key];
    return value ? [`${groupLabels[key]}: ${filterLabel(key, value)}`] : [];
  });
  const query = normalizeQuery(filters.query);
  if (query) described.unshift(`Search: ${query}`);
  if (filters.freeOnly) described.push("Cost: Free events");
  if (filters.dateFrom && filters.dateTo) {
    described.push(`Dates: ${filters.dateFrom} to ${filters.dateTo}`);
  } else if (filters.dateFrom) {
    described.push(`Dates: from ${filters.dateFrom}`);
  } else if (filters.dateTo) {
    described.push(`Dates: until ${filters.dateTo}`);
  }
  return described;
}

function newYorkDate(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${value.year}-${value.month}-${value.day}`;
}

function shiftDate(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function dateRange(
  filter: NonNullable<FilterState["date"]>,
  now: Date,
): [string, string] {
  const today = newYorkDate(now);
  if (filter === "today") return [today, today];
  if (filter === "tomorrow") {
    const tomorrow = shiftDate(today, 1);
    return [tomorrow, tomorrow];
  }
  if (filter === "next14") return [today, shiftDate(today, 13)];

  const day = new Date(`${today}T12:00:00Z`).getUTCDay();
  const untilSaturday = day === 0 ? 0 : (6 - day + 7) % 7;
  const start = shiftDate(today, untilSaturday);
  return [start, shiftDate(start, day === 0 ? 0 : 1)];
}

export function applyEventFilters(
  events: ParkEvent[],
  filters: FilterState,
  now = new Date(),
): ParkEvent[] {
  const range = filters.date ? dateRange(filters.date, now) : null;
  return events.filter((event) => {
    const query = normalizeQuery(filters.query);
    if (query) {
      const haystack = [
        event.title,
        event.location,
        event.borough,
        event.category,
        ...event.categories,
      ]
        .join(" ")
        .toLocaleLowerCase();
      const queryTerms = query.toLocaleLowerCase().split(" ");
      if (!queryTerms.every((term) => haystack.includes(term))) return false;
    }
    if (filters.freeOnly && event.costType === "Paid") return false;
    if (filters.borough && event.borough !== filters.borough) return false;
    if (filters.category && !event.categories.includes(filters.category)) {
      return false;
    }
    if (
      filters.registration &&
      event.registrationStatus !== filters.registration
    ) {
      return false;
    }
    if (range) {
      if (!event.startDate) return false;
      if (event.startDate < range[0] || event.startDate > range[1])
        return false;
    }
    if (filters.dateFrom || filters.dateTo) {
      if (!event.startDate) return false;
      if (filters.dateFrom && event.startDate < filters.dateFrom) return false;
      if (filters.dateTo && event.startDate > filters.dateTo) return false;
    }
    return true;
  });
}
