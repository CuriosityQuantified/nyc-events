import { describe, expect, it } from "vitest";
import type { ParkEvent } from "./events";
import {
  EMPTY_FILTERS,
  applyEventFilters,
  describeFilters,
  parseFilterSearchParams,
  writeFilterSearchParams,
} from "./filters";

const events: ParkEvent[] = [
  {
    id: "queens-nature",
    guid: "queens-nature",
    title: "Queens nature walk",
    location: "Forest Park",
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
      }),
    ).toEqual([
      "Borough: Queens",
      "Category: Nature",
      "Date: This weekend",
      "Registration: Required",
    ]);
  });
});
