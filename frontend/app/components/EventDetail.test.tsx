import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import eventDetail from "../../../contracts/golden/event-detail.json";
import { EventDetailContent } from "./EventDetail";
import { parseEventResponse } from "@/app/data/events";

afterEach(cleanup);

const event = parseEventResponse(eventDetail);
const freshness = {
  lastSuccessfulSync: "2026-08-16T12:00:00Z",
  snapshotRowCount: 1,
  isStale: false,
};

describe("EventDetailContent", () => {
  it("shows the complete source description and visibly labels provenance", () => {
    render(<EventDetailContent event={event} freshness={freshness} />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: eventDetail.title.value,
      }),
    ).toBeTruthy();
    expect(screen.getByText(eventDetail.description.value)).toBeTruthy();
    expect(screen.getAllByText("Stated").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Derived").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Not listed").length).toBeGreaterThan(0);
  });

  it("keeps missing accessibility and cost honest", () => {
    render(<EventDetailContent event={event} freshness={freshness} />);

    expect(
      screen.getByText("Accessibility details are not provided"),
    ).toBeTruthy();
    expect(screen.getByText("Cost information is not listed")).toBeTruthy();
    expect(screen.queryByText("Inaccessible")).toBeNull();
    expect(screen.queryByText(/^Free$/)).toBeNull();
  });

  it("links to the source record without exposing an unsafe URL", () => {
    const { rerender } = render(
      <EventDetailContent event={event} freshness={freshness} />,
    );
    expect(
      screen
        .getByRole("link", { name: /Open official NYC Parks listing/ })
        .getAttribute("href"),
    ).toBe(eventDetail.official_event_url.value);

    rerender(
      <EventDetailContent
        event={{
          ...event,
          official_event_url: {
            value: "javascript:alert(1)",
            provenance: "Stated",
            raw: "javascript:alert(1)",
          },
        }}
        freshness={freshness}
      />,
    );
    expect(screen.queryByRole("link", { name: /Open official/ })).toBeNull();
    expect(screen.getByText("Official event link not listed")).toBeTruthy();
  });

  it("binds registration copy to the field that supplied it", () => {
    render(
      <EventDetailContent
        event={{
          ...event,
          registration_description: {
            value: "Register on the official page",
            provenance: "Derived",
            raw: "Register on the official page",
          },
          registration_status: {
            value: "required",
            provenance: "Stated",
            raw: "required",
          },
        }}
        freshness={freshness}
      />,
    );

    for (const row of document.querySelectorAll(
      '[data-fact-label="Registration"]',
    )) {
      expect(row.textContent).toContain("Register on the official page");
      expect(row.querySelector("[data-provenance]")?.textContent).toBe(
        "Derived",
      );
    }
  });

  it("labels empty fallback values as not listed", () => {
    render(
      <EventDetailContent
        event={{
          ...event,
          categories: { value: [], provenance: "Stated", raw: "" },
          location_name: { value: null, provenance: "Stated", raw: null },
          start_date: { value: null, provenance: "Derived", raw: null },
        }}
        freshness={freshness}
      />,
    );

    for (const label of ["Categories", "Location", "Date"]) {
      const row = document.querySelector(`[data-fact-label="${label}"]`);
      expect(row?.querySelector("[data-provenance]")?.textContent).toBe(
        "Not listed",
      );
    }
  });
});
