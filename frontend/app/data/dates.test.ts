import { afterEach, describe, expect, it, vi } from "vitest";
import { getUpcomingDates } from "./dates";

describe("getUpcomingDates", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses the New York calendar date when UTC is already on the next day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-16T01:00:00Z"));

    expect(getUpcomingDates(2)).toEqual(["2026-08-15", "2026-08-16"]);
  });
});
