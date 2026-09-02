import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const routerPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("leaflet", () => ({
  map: () => ({ setView: vi.fn(), remove: vi.fn() }),
  tileLayer: () => ({ once: vi.fn(), addTo: vi.fn() }),
  circleMarker: () => ({ addTo: vi.fn() }),
}));

import BottomNav from "./BottomNav";
import EventCard from "./EventCard";
import FilterChips from "./FilterChips";
import ListMapToggle from "./ListMapToggle";
import SubwayLineSelector from "./SubwayLineSelector";
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
    expect(screen.queryByText(/Neighborhood/)).toBeNull();
    expect(screen.getByText("Borough: Brooklyn")).toBeTruthy();
    expect(screen.getByText("Address: Not listed")).toBeTruthy();
    expect(screen.getByText("Aug 16, 2026 · 7:30 AM")).toBeTruthy();
    expect(screen.getByText("Free")).toBeTruthy();
    expect(screen.getByTestId("map-preview")).toBeTruthy();
    expect(
      screen.getByTestId("map-preview").getAttribute("data-map-variant"),
    ).toBe("compact");
    expect(
      screen
        .getByRole("link", { name: /Open Long Meadow marker/ })
        .getAttribute("href"),
    ).toBe(
      "https://www.openstreetmap.org/?mlat=40.660200&mlon=-73.969000#map=15/40.660200/-73.969000",
    );
    expect(
      screen.getByRole("link", { name: "© OpenStreetMap contributors" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Show larger map" }));
    expect(
      screen.getByTestId("map-preview").getAttribute("data-map-variant"),
    ).toBe("expanded");
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

  it("renders a stable fallback and no map activation for an invalid source location", () => {
    render(
      <EventCard
        event={{
          ...event,
          coordinates: [{ latitude: 0, longitude: 0 }],
          positionAccuracy: "not-listed",
        }}
      />,
    );

    expect(screen.getByTestId("map-preview-fallback")).toBeTruthy();
    expect(screen.getByText("Map preview unavailable")).toBeTruthy();
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.queryByRole("link", { name: /Open .* marker/ })).toBeNull();
    expect(
      screen.getByRole("link", { name: "© OpenStreetMap contributors" }),
    ).toBeTruthy();
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

describe("SubwayLineSelector", () => {
  it("renders with correct options including Any subway line", () => {
    render(<SubwayLineSelector selectedLine={null} onChange={vi.fn()} />);

    const select = screen.getByRole("combobox", { name: "Subway line filter" });
    expect(select).toBeTruthy();
    // Check "Any subway line" option exists
    const options = select.querySelectorAll("option");
    expect(options[0].textContent).toBe("Any subway line");
    // 29 lines + 1 "Any" = 30 options
    expect(options).toHaveLength(30);
  });

  it("triggers onChange when a line is selected", () => {
    const onChange = vi.fn();
    render(<SubwayLineSelector selectedLine={null} onChange={onChange} />);

    fireEvent.change(
      screen.getByRole("combobox", { name: "Subway line filter" }),
      {
        target: { value: "A" },
      },
    );
    expect(onChange).toHaveBeenCalledWith("A");
  });

  it("triggers onChange with null when cleared", () => {
    const onChange = vi.fn();
    render(<SubwayLineSelector selectedLine="A" onChange={onChange} />);

    fireEvent.change(
      screen.getByRole("combobox", { name: "Subway line filter" }),
      {
        target: { value: "" },
      },
    );
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("shows summary panel when a line is selected", () => {
    render(
      <SubwayLineSelector
        selectedLine="1"
        onChange={vi.fn()}
        transitSource={{
          id: "mta-gtfs-static",
          attribution: "MTA",
          sourceUrl: "https://new.mta.info/developers",
          lastUpdated: "2026-07-01",
        }}
      />,
    );

    expect(screen.getByTestId("subway-line-summary")).toBeTruthy();
    expect(screen.getByText("Broadway–Seventh Avenue Local")).toBeTruthy();
    expect(
      screen.getByText("Strictly under 0.5 miles from stops"),
    ).toBeTruthy();
    expect(screen.getByText(/MTA/)).toBeTruthy();
  });

  it("does not show summary when no line is selected", () => {
    render(<SubwayLineSelector selectedLine={null} onChange={vi.fn()} />);

    expect(screen.queryByTestId("subway-line-summary")).toBeNull();
  });

  it("renders a stop selector with all stops for the selected line (B2)", () => {
    const onSelectStop = vi.fn();
    render(
      <SubwayLineSelector
        selectedLine="1"
        onChange={vi.fn()}
        stops={{
          "101": {
            name: "Van Cortlandt Park-242 St",
            lat: 40.889,
            lng: -73.899,
          },
          "103": { name: "238 St", lat: 40.885, lng: -73.901 },
        }}
        stopIds={["101", "103"]}
        selectedStopId={null}
        onSelectStop={onSelectStop}
      />,
    );

    const stopSelect = screen.getByRole("combobox", { name: "Nearby stop" });
    expect(stopSelect).toBeTruthy();
    const options = stopSelect.querySelectorAll("option");
    expect(options).toHaveLength(3); // "Any stop" + 2 stops
    expect(options[0].textContent).toBe("Any stop");
    expect(options[1].textContent).toBe("Van Cortlandt Park-242 St");
    expect(options[2].textContent).toBe("238 St");
  });

  it("fires onSelectStop when a stop is chosen (B2)", () => {
    const onSelectStop = vi.fn();
    render(
      <SubwayLineSelector
        selectedLine="1"
        onChange={vi.fn()}
        stops={{
          "101": {
            name: "Van Cortlandt Park-242 St",
            lat: 40.889,
            lng: -73.899,
          },
        }}
        stopIds={["101"]}
        selectedStopId={null}
        onSelectStop={onSelectStop}
      />,
    );

    fireEvent.change(screen.getByRole("combobox", { name: "Nearby stop" }), {
      target: { value: "101" },
    });
    expect(onSelectStop).toHaveBeenCalledWith("101");
  });

  it("fires onSelectStop with null when stop is cleared (B2)", () => {
    const onSelectStop = vi.fn();
    render(
      <SubwayLineSelector
        selectedLine="1"
        onChange={vi.fn()}
        stops={{
          "101": {
            name: "Van Cortlandt Park-242 St",
            lat: 40.889,
            lng: -73.899,
          },
        }}
        stopIds={["101"]}
        selectedStopId="101"
        onSelectStop={onSelectStop}
      />,
    );

    fireEvent.change(screen.getByRole("combobox", { name: "Nearby stop" }), {
      target: { value: "" },
    });
    expect(onSelectStop).toHaveBeenCalledWith(null);
  });

  it("does not show stop selector when no stops are provided (B2)", () => {
    render(<SubwayLineSelector selectedLine="1" onChange={vi.fn()} />);

    expect(screen.queryByRole("combobox", { name: "Nearby stop" })).toBeNull();
  });

  it("shows stale transit data indicator (B4)", () => {
    render(
      <SubwayLineSelector
        selectedLine="1"
        onChange={vi.fn()}
        transitSource={{
          id: "mta-gtfs-static",
          attribution: "MTA",
          sourceUrl: "https://new.mta.info/developers",
          lastUpdated: "2026-07-01",
        }}
        transitGeoState="stale"
      />,
    );

    const staleStatus = screen.getByText(/data may be outdated/i);
    expect(staleStatus).toBeTruthy();
    expect(staleStatus.textContent).toContain("Jul 1, 2026");
  });
});

describe("EventCard subway proximity", () => {
  it("shows proximity info when subwayProximity is present", () => {
    render(
      <EventCard
        event={{
          ...event,
          subwayProximity: {
            lineId: "1",
            nearestStop: { id: "120", name: "86 St" },
            straightLineDistanceMiles: 0.22,
          },
        }}
      />,
    );

    expect(screen.getByTestId("nearest-station")).toBeTruthy();
    expect(screen.getByText("Nearest station: 86 St")).toBeTruthy();
    expect(screen.getByTestId("straight-line-distance")).toBeTruthy();
    expect(screen.getByText(/Straight-line distance: 0\.22 mi/)).toBeTruthy();
  });

  it("does not show proximity info when subwayProximity is absent", () => {
    render(<EventCard event={event} />);

    expect(screen.queryByTestId("nearest-station")).toBeNull();
    expect(screen.queryByTestId("straight-line-distance")).toBeNull();
  });

  it("never implies walking time, transit time, or route availability", () => {
    render(
      <EventCard
        event={{
          ...event,
          subwayProximity: {
            lineId: "1",
            nearestStop: { id: "120", name: "86 St" },
            straightLineDistanceMiles: 0.22,
          },
        }}
      />,
    );

    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/walking/i);
    expect(text).not.toMatch(/transit time/i);
    expect(text).not.toMatch(/route availability/i);
    expect(text).not.toMatch(/minutes? away/i);
    expect(text).toContain("Straight-line distance");
  });
});
