import { describe, expect, it } from "vitest";
import eventDetail from "../../../contracts/golden/event-detail.json";
import eventList from "../../../contracts/golden/events-list.json";
import freshness from "../../../contracts/golden/freshness.json";
import subwayFiltered from "../../../contracts/golden/events-subway-filtered.json";

type Provenance = "Stated" | "Derived" | "Not listed";

type Fact<T> = {
  value: T;
  provenance: Provenance;
};

type FrontendEvent = {
  guid: string;
  title: Fact<string>;
  start_datetime: Fact<string>;
  location_name: Fact<string>;
  official_event_url: Fact<string>;
};

function consumeEvent(value: unknown): FrontendEvent {
  if (!value || typeof value !== "object")
    throw new TypeError("Event must be an object");
  const event = value as Partial<FrontendEvent>;
  if (typeof event.guid !== "string" || !event.title || !event.start_datetime) {
    throw new TypeError("Event is missing frontend-required identity fields");
  }
  for (const fact of [
    event.title,
    event.start_datetime,
    event.location_name,
    event.official_event_url,
  ]) {
    if (
      !fact ||
      !["Stated", "Derived", "Not listed"].includes(fact.provenance)
    ) {
      throw new TypeError("Event fact has invalid provenance");
    }
  }
  return event as FrontendEvent;
}

describe("shared API contract frontend consumer", () => {
  it("consumes every committed golden Event through frontend-required fields", () => {
    const events = eventList.events.map(consumeEvent);
    expect(events.length).toBeGreaterThan(0);
    expect(consumeEvent(eventDetail).guid).toBe(events[0].guid);
    expect(freshness.last_successful_sync.provenance).toBe("Derived");
  });

  it("fails closed when a required identity field is absent", () => {
    expect(() => consumeEvent({ title: eventDetail.title })).toThrow(
      /identity/,
    );
  });

  it("fails closed on invented provenance", () => {
    expect(() =>
      consumeEvent({
        ...eventDetail,
        title: { ...eventDetail.title, provenance: "Inferred" },
      }),
    ).toThrow(/provenance/);
  });

  it("consumes subway-filtered golden contract with proximity and transit_source", () => {
    const events = subwayFiltered.events.map(consumeEvent);
    expect(events).toHaveLength(1);
    const event = subwayFiltered.events[0];
    expect(event.subway_proximity).toEqual({
      line_id: "1",
      nearest_stop: { id: "121", name: "86 St" },
      straight_line_distance_miles: 0.22,
    });
    expect(subwayFiltered.transit_source).toEqual({
      id: "mta-nyct-subway-gtfs",
      attribution: "Metropolitan Transportation Authority (MTA)",
      source_url: "https://rrgtfsfeeds.s3.amazonaws.com/gtfs_subway.zip",
      last_updated: "2026-08-07T12:10:36+00:00",
    });
  });
});
