import { afterEach, describe, expect, it, vi } from "vitest";
import eventList from "../../../contracts/golden/events-list.json";
import eventDetail from "../../../contracts/golden/event-detail.json";
import freshness from "../../../contracts/golden/freshness.json";
import {
  apiToUiEvent,
  getEvent,
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
});
