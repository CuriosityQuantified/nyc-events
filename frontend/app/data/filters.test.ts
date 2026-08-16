import { describe, expect, it } from "vitest";
import type { ParkEvent } from "./events";
import {
  EMPTY_FILTERS,
  applyEventFilters,
  describeFilters,
  parseFilterSearchParams,
  parseStrictFilterSearchParams,
  writeFilterSearchParams,
} from "./filters";

const events: ParkEvent[] = [
  {
    id: "queens-nature",
    guid: "queens-nature",
    title: "Queens nature walk",
    location: "Forest Park",
    locationId: "Q015",
    coordinates: [{ latitude: 40.703, longitude: -73.854 }],
    positionAccuracy: "exact",
    borough: "Queens",
    category: "Nature",
    categories: ["Nature", "Best for Kids"],
    startDate: "2026-08-16",
    date: "Aug 16, 2026",
    time: "10:00 AM",
    costType: "Free",
    registration: "Registration required",
    registrationStatus: "required",
    accessibility: "Accessibility information not listed",
    imageAlt: "Nature event at Forest Park",
    officialUrl: "https://www.nycgovparks.org/events/queens-nature",
  },
  {
    id: "manhattan-fitness",
    guid: "manhattan-fitness",
    title: "Manhattan fitness class",
    location: "Riverside Park",
    locationId: "M072",
    coordinates: [{ latitude: 40.8, longitude: -73.97 }],
    positionAccuracy: "exact",
    borough: "Manhattan",
    category: "Fitness",
    categories: ["Fitness"],
    startDate: "2026-08-17",
    date: "Aug 17, 2026",
    time: "9:00 AM",
    costType: "Not listed",
    registration: "Registration not required",
    registrationStatus: "not_required",
    accessibility: "Accessibility information not listed",
    imageAlt: "Fitness event at Riverside Park",
    officialUrl: null,
  },
];

describe("filter URL state", () => {
  it("parses one canonical value per filter and rejects unsupported values", () => {
    const parsed = parseFilterSearchParams(
      new URLSearchParams(
        "borough=Queens&category=Nature&date=today&registration=required&borough=Bronx&category=%3Cscript%3E",
      ),
    );

    expect(parsed).toEqual({
      borough: "Queens",
      category: "Nature",
      date: "today",
      registration: "required",
      dateFrom: null,
      dateTo: null,
    });
  });

  it("writes a stable shareable URL without deleting unrelated state", () => {
    const params = writeFilterSearchParams(
      new URLSearchParams("view=map&borough=Bronx"),
      {
        borough: "Queens",
        category: "Best for Kids",
        date: "weekend",
        registration: "not_listed",
        dateFrom: null,
        dateTo: null,
      },
    );

    expect(params.toString()).toBe(
      "view=map&borough=Queens&category=Best+for+Kids&date=weekend&registration=not_listed",
    );
    expect(writeFilterSearchParams(params, EMPTY_FILTERS).toString()).toBe(
      "view=map",
    );
  });
});

describe("event filtering", () => {
  it("combines borough, any source category, date, and registration", () => {
    const filtered = applyEventFilters(
      events,
      {
        borough: "Queens",
        category: "Best for Kids",
        date: "today",
        registration: "required",
        dateFrom: null,
        dateTo: null,
      },
      new Date("2026-08-16T16:00:00Z"),
    );

    expect(filtered.map((event) => event.guid)).toEqual(["queens-nature"]);
  });

  it("uses inclusive New York date boundaries and excludes missing dates", () => {
    expect(
      applyEventFilters(
        [
          ...events,
          { ...events[0], guid: "missing-date", startDate: null },
          { ...events[0], guid: "outside-window", startDate: "2026-08-30" },
        ],
        { ...EMPTY_FILTERS, date: "next14" },
        new Date("2026-08-16T04:30:00Z"),
      ).map((event) => event.guid),
    ).toEqual(["queens-nature", "manhattan-fitness"]);
  });

  it("keeps Sunday inside the current weekend instead of jumping ahead", () => {
    expect(
      applyEventFilters(
        events,
        { ...EMPTY_FILTERS, date: "weekend" },
        new Date("2026-08-16T16:00:00Z"),
      ).map((event) => event.guid),
    ).toEqual(["queens-nature"]);
  });

  it("names every active filter for a zero-result recovery message", () => {
    expect(
      describeFilters({
        borough: "Queens",
        category: "Nature",
        date: "weekend",
        registration: "required",
        dateFrom: null,
        dateTo: null,
      }),
    ).toEqual([
      "Borough: Queens",
      "Category: Nature",
      "Date: This weekend",
      "Registration: Required",
    ]);
  });
});

describe("exact-date filters", () => {
  it("round-trips date_from and date_to through URL state", () => {
    const params = writeFilterSearchParams(new URLSearchParams(), {
      ...EMPTY_FILTERS,
      dateFrom: "2026-08-20",
      dateTo: "2026-08-22",
    });
    expect(params.get("date_from")).toBe("2026-08-20");
    expect(params.get("date_to")).toBe("2026-08-22");
    const parsed = parseFilterSearchParams(params);
    expect(parsed.dateFrom).toBe("2026-08-20");
    expect(parsed.dateTo).toBe("2026-08-22");
  });

  it("drops malformed or inverted exact dates on lenient parse", () => {
    expect(
      parseFilterSearchParams(new URLSearchParams("date_from=2026-13-40"))
        .dateFrom,
    ).toBeNull();
    const inverted = parseFilterSearchParams(
      new URLSearchParams("date_from=2026-08-22&date_to=2026-08-20"),
    );
    expect(inverted.dateFrom).toBeNull();
    expect(inverted.dateTo).toBeNull();
  });

  it("rejects malformed and inverted exact dates on strict parse", () => {
    expect(() =>
      parseStrictFilterSearchParams(new URLSearchParams("date_from=nope")),
    ).toThrowError(/date_from/);
    expect(() =>
      parseStrictFilterSearchParams(
        new URLSearchParams("date_from=2026-08-22&date_to=2026-08-20"),
      ),
    ).toThrowError(/date_from/);
  });

  it("keeps only events whose New York date falls inside the bounds", () => {
    const from = applyEventFilters(events, {
      ...EMPTY_FILTERS,
      dateFrom: "2026-08-17",
    });
    expect(from.map((event) => event.guid)).toEqual(["manhattan-fitness"]);

    const to = applyEventFilters(events, {
      ...EMPTY_FILTERS,
      dateTo: "2026-08-16",
    });
    expect(to.map((event) => event.guid)).toEqual(["queens-nature"]);

    const none = applyEventFilters([{ ...events[0], startDate: null }], {
      ...EMPTY_FILTERS,
      dateFrom: "2026-08-01",
    });
    expect(none).toEqual([]);
  });

  it("describes exact dates for the results header", () => {
    expect(
      describeFilters({
        ...EMPTY_FILTERS,
        dateFrom: "2026-08-20",
        dateTo: "2026-08-22",
      }),
    ).toContain("Dates: 2026-08-20 to 2026-08-22");
  });
});
