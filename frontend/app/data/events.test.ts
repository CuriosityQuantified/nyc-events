import { afterEach, describe, expect, it, vi } from "vitest";
import eventList from "../../../contracts/golden/events-list.json";
import eventDetail from "../../../contracts/golden/event-detail.json";
import freshness from "../../../contracts/golden/freshness.json";
import subwayFiltered from "../../../contracts/golden/events-subway-filtered.json";
import {
  apiToUiEvent,
  getEvent,
  getEvents,
  getFilteredEvents,
  parseEventsResponse,
  parseFreshnessResponse,
} from "./events";
import { EMPTY_FILTERS } from "./filters";

afterEach(() => vi.unstubAllGlobals());

describe("live Event API mapping", () => {
  it("maps the flat shared contract without losing user-visible facts", () => {
    const parsed = parseEventsResponse(eventList);
    const event = apiToUiEvent(parsed.events[0]);

    expect(event.guid).toBe(eventList.events[0].guid);
    expect(event.title).toBe(eventList.events[0].title.value);
    expect(event.date).toBe("Aug 9, 2026");
    expect(event.time).not.toBe("Time not listed");
    expect(event.location).toBe(eventList.events[0].location_name.value);
    expect(event.locationId).toBe(eventList.events[0].location_id.value);
    expect(event.coordinates).toEqual(eventList.events[0].coordinates.value);
    expect(event.positionAccuracy).toBe("exact");
    expect(event.officialUrl).toBe(
      eventList.events[0].official_event_url.value,
    );
    expect(event.registration).toBe("Registration not listed");
    expect(event.accessibility).toBe("Accessibility information not listed");
  });

  it("keeps unknown cost explicit instead of inventing free or paid", () => {
    const event = apiToUiEvent(parseEventsResponse(eventList).events[0]);
    expect(event.costType).toBe("Not listed");
  });

  it("deduplicates an API page by source guid before UI rendering", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        ...eventList,
        events: [eventList.events[0], eventList.events[0], eventList.events[1]],
        total: 3,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await getEvents(1, 12);

    expect(result.events.map((event) => event.guid)).toEqual([
      eventList.events[0].guid,
      eventList.events[1].guid,
    ]);
    expect(result.total).toBe(3);
    expect(result.totalPages).toBe(1);
  });

  it("maps only allowlisted lifecycle classifications", () => {
    const source = parseEventsResponse(eventList).events[0];
    expect(
      apiToUiEvent({
        ...source,
        lifecycle_status: {
          value: "cancelled",
          provenance: "Stated",
          raw: "Cancelled",
        },
      }).lifecycleStatus,
    ).toBe("cancelled");
    expect(
      apiToUiEvent({
        ...source,
        lifecycle_status: {
          value: "definitely-cancelled-maybe",
          provenance: "Derived",
          raw: null,
        },
      }).lifecycleStatus,
    ).toBeNull();
  });

  it("fails closed on malformed event and freshness payloads", () => {
    expect(() =>
      parseEventsResponse({ ...eventList, events: [{ guid: "broken" }] }),
    ).toThrow(/contract Fact/);
    expect(() =>
      parseEventsResponse({
        ...eventList,
        events: [{ ...eventList.events[0], lifecycle_status: "cancelled" }],
      }),
    ).toThrow(/lifecycle_status is not a contract Fact/);
    expect(() =>
      parseFreshnessResponse({ ...freshness, is_stale: null }),
    ).toThrow(/Freshness response/);
  });

  it("fetches one detail using an encoded source guid and validates it", async () => {
    const fetchMock = vi.fn<
      (input: string | URL | Request) => Promise<Response>
    >(async () => Response.json(eventDetail));
    vi.stubGlobal("fetch", fetchMock);

    const event = await getEvent("parks/guid,14");

    expect(event.title.value).toBe(eventDetail.title.value);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toContain("/events/parks%2Fguid%2C14");
  });

  it("filters the complete source when the current snapshot exceeds 1,000 Events", async () => {
    const sourceTotal = 1_001;
    const sourcePageSize = 100;
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = new URL(input.toString());
      const page = Number(url.searchParams.get("page"));
      const pageStart = (page - 1) * sourcePageSize;
      const pageLength = Math.min(sourcePageSize, sourceTotal - pageStart);
      return Response.json({
        events: Array.from({ length: pageLength }, (_, index) => ({
          ...eventList.events[0],
          guid: `event-${pageStart + index}`,
        })),
        page,
        page_size: sourcePageSize,
        total: sourceTotal,
        applied_facets: {},
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await getFilteredEvents({
      ...EMPTY_FILTERS,
      borough: "Manhattan",
    });

    expect(result.total).toBe(sourceTotal);
    expect(result.events).toHaveLength(12);
    expect(fetchMock).toHaveBeenCalledTimes(11);
  });

  it("fails closed before unbounded source pagination", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        ...eventList,
        page: 1,
        page_size: 100,
        total: 10_001,
        applied_facets: {},
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getFilteredEvents({ ...EMPTY_FILTERS, category: "Fitness" }),
    ).rejects.toThrow("Event result set exceeds the bounded filter window");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("keeps unfiltered pagination to one bounded backend request", async () => {
    const fetchMock = vi.fn<
      (input: string | URL | Request) => Promise<Response>
    >(async () => Response.json(eventList));
    vi.stubGlobal("fetch", fetchMock);

    await getFilteredEvents(EMPTY_FILTERS, 1, 12);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toContain("/events?page=1&page_size=12");
  });

  it("parses subway_proximity from the API response", () => {
    const parsed = parseEventsResponse(subwayFiltered);
    const event = apiToUiEvent(parsed.events[0]);
    expect(event.subwayProximity).toEqual({
      lineId: "1",
      nearestStop: { id: "121", name: "86 St" },
      straightLineDistanceMiles: 0.22,
    });
  });

  it.each([
    ["negative distance", { straight_line_distance_miles: -0.01 }],
    ["strict boundary", { straight_line_distance_miles: 0.5 }],
    ["non-finite distance", { straight_line_distance_miles: Infinity }],
    ["missing line", { line_id: "" }],
    ["missing stop id", { nearest_stop: { id: "", name: "86 St" } }],
    ["missing stop name", { nearest_stop: { id: "121", name: "" } }],
  ])("rejects subway_proximity with %s", (_case, proximityPatch) => {
    const source = subwayFiltered.events[0].subway_proximity;
    expect(() =>
      parseEventsResponse({
        ...subwayFiltered,
        events: [
          {
            ...subwayFiltered.events[0],
            subway_proximity: { ...source, ...proximityPatch },
          },
        ],
      }),
    ).toThrow(/subway_proximity/);
  });

  it.each([0, 0.499_999])(
    "accepts subway_proximity distance inside the strict boundary: %s",
    (distance) => {
      const source = subwayFiltered.events[0].subway_proximity;
      const parsed = parseEventsResponse({
        ...subwayFiltered,
        events: [
          {
            ...subwayFiltered.events[0],
            subway_proximity: {
              ...source,
              straight_line_distance_miles: distance,
            },
          },
        ],
      });
      expect(
        parsed.events[0].subway_proximity?.straight_line_distance_miles,
      ).toBe(distance);
    },
  );

  it("parses transit_source from a subway-filtered response", () => {
    const parsed = parseEventsResponse(subwayFiltered);
    expect(parsed.transit_source).toEqual({
      id: "mta-nyct-subway-gtfs",
      attribution: "Metropolitan Transportation Authority (MTA)",
      source_url: "https://rrgtfsfeeds.s3.amazonaws.com/gtfs_subway.zip",
      last_updated: "2026-08-07T12:10:36+00:00",
    });
  });

  it("maps subway_proximity to null when absent", () => {
    const parsed = parseEventsResponse(eventList);
    const event = apiToUiEvent(parsed.events[0]);
    expect(event.subwayProximity).toBeNull();
  });

  it("passes subway_line to backend when getEvents is called with subwayLine", async () => {
    const fetchMock = vi.fn<
      (input: string | URL | Request) => Promise<Response>
    >(async () => Response.json(subwayFiltered));
    vi.stubGlobal("fetch", fetchMock);

    await getEvents(1, 12, "1");

    expect(fetchMock).toHaveBeenCalledOnce();
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("subway_line=1");
  });

  it("passes subway_line through getFilteredEvents when only subwayLine is set", async () => {
    const fetchMock = vi.fn<
      (input: string | URL | Request) => Promise<Response>
    >(async () => Response.json(subwayFiltered));
    vi.stubGlobal("fetch", fetchMock);

    const result = await getFilteredEvents({
      ...EMPTY_FILTERS,
      subwayLine: "1",
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("subway_line=1");
    expect(result.transitSource).toEqual({
      id: "mta-nyct-subway-gtfs",
      attribution: "Metropolitan Transportation Authority (MTA)",
      sourceUrl: "https://rrgtfsfeeds.s3.amazonaws.com/gtfs_subway.zip",
      lastUpdated: "2026-08-07T12:10:36+00:00",
    });
  });
});
