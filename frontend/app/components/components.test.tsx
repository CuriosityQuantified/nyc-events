import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const routerPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

import BottomNav from "./BottomNav";
import EventCard from "./EventCard";
import FilterChips from "./FilterChips";
import ListMapToggle from "./ListMapToggle";
import type { ParkEvent } from "@/app/data/events";
import { EMPTY_FILTERS } from "@/app/data/filters";

afterEach(cleanup);

const event: ParkEvent = {
  id: "test-event",
  guid: "test-event",
  title: "Morning Yoga in Prospect Park",
  location: "Long Meadow",
  locationId: "B073",
  coordinates: [{ latitude: 40.6602, longitude: -73.969 }],
  positionAccuracy: "exact",
  borough: "Brooklyn",
  category: "Fitness",
  categories: ["Fitness"],
  startDate: "2026-08-16",
  date: "Aug 16, 2026",
  time: "7:30 AM",
  costType: "Free",
  registration: "Registration required",
  registrationStatus: "required",
  accessibility:
    "Accessibility information is mentioned in the official listing",
  imageAlt: "People doing yoga on a meadow",
  officialUrl: "https://www.nycgovparks.org/events/test-event",
};

describe("FilterChips", () => {
  it("exposes the filter groups, including free events, and reports a removable selection", () => {
    const onChange = vi.fn();
    render(<FilterChips filters={EMPTY_FILTERS} onChange={onChange} />);

    expect(screen.getByRole("group", { name: "Borough" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Category" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Date range" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Registration" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Cost" })).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: "Add Borough: Queens" }),
    );
    expect(onChange).toHaveBeenCalledWith({
      ...EMPTY_FILTERS,
      borough: "Queens",
    });
  });

  it("toggles the free events filter", () => {
    const onChange = vi.fn();
    render(<FilterChips filters={EMPTY_FILTERS} onChange={onChange} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Add Cost: Free events" }),
    );
    expect(onChange).toHaveBeenCalledWith({
      ...EMPTY_FILTERS,
      freeOnly: true,
    });
  });

  it("removes an active chip and clears combined state", () => {
    const onChange = vi.fn();
    const filters = {
      ...EMPTY_FILTERS,
      borough: "Queens" as const,
      category: "Nature" as const,
    };
    render(<FilterChips filters={filters} onChange={onChange} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Remove Borough: Queens" }),
    );
    expect(onChange).toHaveBeenCalledWith({ ...filters, borough: null });

    fireEvent.click(screen.getByRole("button", { name: "Clear all filters" }));
    expect(onChange).toHaveBeenLastCalledWith(EMPTY_FILTERS);
  });
});

describe("ListMapToggle", () => {
  it("reports a map selection and exposes the current state", () => {
    const onViewChange = vi.fn();
    render(<ListMapToggle activeView="list" onViewChange={onViewChange} />);

    expect(
      screen.getByRole("button", { name: "List" }).getAttribute("aria-pressed"),
    ).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Map" }));
    expect(onViewChange).toHaveBeenCalledOnce();
    expect(onViewChange).toHaveBeenCalledWith("map");
  });
});

describe("EventCard", () => {
  it("renders the event identity, location, time, and cost", () => {
    render(<EventCard event={event} returnQuery="borough=Brooklyn" />);

    expect(
      screen.getByRole("heading", { level: 2, name: event.title }),
    ).toBeTruthy();
    expect(screen.getByText("Venue or park: Long Meadow")).toBeTruthy();
    expect(screen.getByText("Neighborhood: Not listed")).toBeTruthy();
    expect(screen.getByText("Borough: Brooklyn")).toBeTruthy();
    expect(screen.getByText("Address: Not listed")).toBeTruthy();
    expect(screen.getByText("Aug 16, 2026 · 7:30 AM")).toBeTruthy();
    expect(screen.getByText("Free")).toBeTruthy();
    expect(screen.queryByTestId("map-thumbnail")).toBeNull();
    expect(screen.queryByTestId("map-thumbnail-fallback")).toBeNull();
    expect(screen.getByText(event.registration)).toBeTruthy();
    expect(screen.getByText(event.accessibility)).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: `View details for ${event.title}` })
        .getAttribute("href"),
    ).toBe("/events/test-event?borough=Brooklyn");
    expect(
      screen.queryByRole("link", { name: /Official event details/ }),
    ).toBeNull();
  });

  it("labels facts and links that the source did not provide", () => {
    render(
      <EventCard
        event={{
          ...event,
          registration: "Registration not listed",
          accessibility: "Accessibility information not listed",
          officialUrl: null,
        }}
      />,
    );

    expect(screen.getByText("Registration not listed")).toBeTruthy();
    expect(
      screen.getByText("Accessibility information not listed"),
    ).toBeTruthy();
    expect(screen.queryByText("Official event link not listed")).toBeNull();
    expect(screen.getByRole("link", { name: /View details/ })).toBeTruthy();
  });

  it("does not render a thumbnail for an invalid source location", () => {
    render(
      <EventCard
        event={{
          ...event,
          coordinates: [{ latitude: 0, longitude: 0 }],
          positionAccuracy: "not-listed",
        }}
      />,
    );

    expect(screen.queryByTestId("map-thumbnail")).toBeNull();
    expect(screen.queryByTestId("map-thumbnail-fallback")).toBeNull();
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.queryByRole("link", { name: /Google Maps/ })).toBeNull();
  });
});

describe("BottomNav", () => {
  it("marks the current route and navigates to Saved on click", () => {
    render(<BottomNav />);

    const explore = screen.getByRole("button", { name: /Explore/ });
    const saved = screen.getByRole("button", { name: /^Saved/ });
    expect(explore.getAttribute("aria-current")).toBe("page");
    expect(saved.hasAttribute("aria-current")).toBe(false);

    fireEvent.click(saved);
    expect(routerPush).toHaveBeenCalledWith("/saved");
  });

  it("keeps Explore, Saved, Concierge, Profile in order with no Calendar tab", () => {
    render(<BottomNav />);
    const labels = screen
      .getAllByRole("button")
      .map((button) => button.textContent);
    expect(labels).toHaveLength(4);
    expect(labels[0]).toContain("Explore");
    expect(labels[1]).toContain("Saved");
    expect(labels[2]).toContain("Concierge");
    expect(labels[3]).toContain("Profile");
    expect(labels.join(" ")).not.toContain("Calendar");
  });

  it("navigates to the Concierge destination", () => {
    render(<BottomNav />);

    fireEvent.click(screen.getByRole("button", { name: /Concierge/ }));
    expect(routerPush).toHaveBeenCalledWith("/concierge");
  });
});
