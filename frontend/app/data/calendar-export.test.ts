import { describe, expect, it } from "vitest";
import {
  buildIcs,
  eventSchedule,
  googleCalendarUrl,
  icsFilename,
  icsUid,
} from "./calendar-export";
import type { ParkEvent } from "./events";

function makeEvent(overrides: Partial<ParkEvent> = {}): ParkEvent {
  return {
    id: "1000001",
    guid: "1000001",
    title: "Birding in Central Park",
    location: "Central Park",
    locationId: null,
    coordinates: [],
    positionAccuracy: "not-listed",
    borough: "Manhattan",
    category: "Nature",
    categories: ["Nature"],
    startDate: "2026-07-04",
    date: "Jul 4, 2026",
    time: "10:00 AM",
    costType: "Free",
    registration: "Registration not listed",
    registrationStatus: "not_listed",
    accessibility: "Accessibility information not listed",
    imageAlt: "Nature event at Central Park",
    officialUrl: "https://www.nycgovparks.org/events/1000001",
    lifecycleStatus: "current",
    description: "Bring binoculars.",
    startDateTime: "2026-07-04T10:00:00-04:00",
    endDateTime: "2026-07-04T12:00:00-04:00",
    endDate: "2026-07-04",
    ...overrides,
  };
}

const FIXED_NOW = new Date("2026-08-16T12:00:00Z");

describe("eventSchedule", () => {
  it("returns null when neither datetime nor date is stored", () => {
    const schedule = eventSchedule(
      makeEvent({
        startDateTime: null,
        endDateTime: null,
        startDate: null,
        endDate: null,
      }),
    );
    expect(schedule).toBeNull();
  });

  it("ignores an end before the start instead of inventing a duration", () => {
    const schedule = eventSchedule(
      makeEvent({ endDateTime: "2026-07-04T09:00:00-04:00" }),
    );
    expect(schedule).toEqual(
      expect.objectContaining({ kind: "timed", end: null }),
    );
  });

  it("falls back to an all-day schedule when only a date is stored", () => {
    const schedule = eventSchedule(
      makeEvent({ startDateTime: null, endDateTime: null }),
    );
    expect(schedule).toEqual({
      kind: "all-day",
      startDate: "2026-07-04",
      endDateExclusive: "2026-07-05",
    });
  });
});

describe("googleCalendarUrl", () => {
  it("renders New York wall time with ctz for EDT dates", () => {
    const url = googleCalendarUrl(makeEvent());
    expect(url).toContain("https://calendar.google.com/calendar/render?");
    expect(url).toContain("action=TEMPLATE");
    expect(url).toContain("dates=20260704T100000%2F20260704T120000");
    expect(url).toContain("ctz=America%2FNew_York");
  });

  it("preserves New York wall time across DST (EST winter date)", () => {
    const url = googleCalendarUrl(
      makeEvent({
        startDateTime: "2027-01-09T14:00:00-05:00",
        endDateTime: "2027-01-09T15:00:00-05:00",
      }),
    );
    expect(url).toContain("dates=20270109T140000%2F20270109T150000");
  });

  it("uses a zero-duration end when no end time is stored", () => {
    const url = googleCalendarUrl(makeEvent({ endDateTime: null }));
    expect(url).toContain("dates=20260704T100000%2F20260704T100000");
  });

  it("renders date-only Events as all-day with an exclusive end", () => {
    const url = googleCalendarUrl(
      makeEvent({ startDateTime: null, endDateTime: null }),
    );
    expect(url).toContain("dates=20260704%2F20260705");
    expect(url).not.toContain("ctz=");
  });

  it("spans multi-day all-day Events through the stored end date", () => {
    const url = googleCalendarUrl(
      makeEvent({
        startDateTime: null,
        endDateTime: null,
        endDate: "2026-07-06",
      }),
    );
    expect(url).toContain("dates=20260704%2F20260707");
  });

  it("returns null instead of inventing a date", () => {
    expect(
      googleCalendarUrl(
        makeEvent({
          startDateTime: null,
          endDateTime: null,
          startDate: null,
          endDate: null,
        }),
      ),
    ).toBeNull();
  });

  it("strips CR/LF so source text cannot smuggle extra URL structure", () => {
    const url = googleCalendarUrl(
      makeEvent({ title: "Concert\r\n&dates=19000101/19000102" }),
    )!;
    // The title's CR/LF collapses to a space and its "&dates=" stays encoded
    // inside the text parameter instead of becoming a URL parameter.
    expect(url).toContain("text=Concert+%26dates%3D19000101%2F19000102");
    expect(url).not.toContain("%0D");
    expect(url.match(/[?&]dates=/g)).toHaveLength(1);
    expect(url).toContain("dates=20260704T100000");
  });

  it("contains no device token or credential material", () => {
    const url = googleCalendarUrl(makeEvent())!;
    expect(url).not.toMatch(/token|secret|key=/i);
  });
});

describe("buildIcs", () => {
  it("emits a VTIMEZONE-anchored VEVENT with a stable UID", () => {
    const ics = buildIcs(makeEvent(), FIXED_NOW)!;
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("TZID:America/New_York");
    expect(ics).toContain("UID:eventmatch-1000001@eventmatch.nyc");
    expect(ics).toContain("DTSTART;TZID=America/New_York:20260704T100000");
    expect(ics).toContain("DTEND;TZID=America/New_York:20260704T120000");
    expect(ics).toContain("DTSTAMP:20260816T120000Z");
    expect(ics.endsWith("\r\n")).toBe(true);
    expect(ics).toContain("END:VCALENDAR");
  });

  it("derives the same UID for the same guid every time", () => {
    expect(icsUid(makeEvent())).toBe(icsUid(makeEvent()));
    expect(icsFilename(makeEvent({ guid: "a/b c" }))).toBe(
      "eventmatch-a-b-c.ics",
    );
  });

  it("omits DTEND rather than inventing a duration", () => {
    const ics = buildIcs(makeEvent({ endDateTime: null }), FIXED_NOW)!;
    expect(ics).not.toContain("DTEND");
  });

  it("renders date-only Events as all-day VALUE=DATE", () => {
    const ics = buildIcs(
      makeEvent({ startDateTime: null, endDateTime: null }),
      FIXED_NOW,
    )!;
    expect(ics).toContain("DTSTART;VALUE=DATE:20260704");
    expect(ics).toContain("DTEND;VALUE=DATE:20260705");
    expect(ics).not.toContain("VTIMEZONE");
  });

  it("escapes separators and blocks VEVENT injection from source text", () => {
    const ics = buildIcs(
      makeEvent({
        title: "Fun; day, with\\slashes",
        description: "line1\nEND:VEVENT\nBEGIN:VEVENT\nSUMMARY:injected",
      }),
      FIXED_NOW,
    )!;
    expect(ics).toContain("SUMMARY:Fun\\; day\\, with\\\\slashes");
    const unfolded = ics.replace(/\r\n[ ]/g, "");
    // The injected text survives only inside the DESCRIPTION value; it never
    // starts a content line, so no second VEVENT or property is created.
    const eventBlocks = unfolded.match(/^BEGIN:VEVENT/gm) ?? [];
    expect(eventBlocks).toHaveLength(1);
    expect(unfolded).not.toMatch(/^SUMMARY:injected/m);
  });

  it("folds long lines and unfolding restores the content", () => {
    const longTitle = "Zürich–NYC festival 🎉 ".repeat(20).trim();
    const ics = buildIcs(makeEvent({ title: longTitle }), FIXED_NOW)!;
    for (const line of ics.split("\r\n")) {
      expect(line.length).toBeLessThanOrEqual(75);
    }
    const unfolded = ics.replace(/\r\n[ ]/g, "");
    expect(unfolded).toContain("SUMMARY:");
    expect(unfolded).toContain("festival 🎉");
  });

  it("marks cancelled Events with STATUS:CANCELLED", () => {
    const ics = buildIcs(
      makeEvent({ lifecycleStatus: "cancelled" }),
      FIXED_NOW,
    )!;
    expect(ics).toContain("STATUS:CANCELLED");
  });
});
