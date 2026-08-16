import { describe, expect, it } from "vitest";
import eventList from "../../../contracts/golden/events-list.json";
import freshness from "../../../contracts/golden/freshness.json";
import {
  apiToUiEvent,
  parseEventsResponse,
  parseFreshnessResponse,
} from "./events";

describe("live Event API mapping", () => {
  it("maps the flat shared contract without losing user-visible facts", () => {
    const parsed = parseEventsResponse(eventList);
    const event = apiToUiEvent(parsed.events[0]);

    expect(event.guid).toBe(eventList.events[0].guid);
    expect(event.title).toBe(eventList.events[0].title.value);
    expect(event.date).toBe("Aug 9, 2026");
    expect(event.time).not.toBe("Time not listed");
    expect(event.location).toBe(eventList.events[0].location_name.value);
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

  it("fails closed on malformed event and freshness payloads", () => {
    expect(() =>
      parseEventsResponse({ ...eventList, events: [{ guid: "broken" }] }),
    ).toThrow(/contract Fact/);
    expect(() =>
      parseFreshnessResponse({ ...freshness, is_stale: null }),
    ).toThrow(/Freshness response/);
  });
});
