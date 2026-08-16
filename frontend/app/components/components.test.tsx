import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import BottomNav from "./BottomNav";
import EventCard from "./EventCard";
import ListMapToggle from "./ListMapToggle";
import type { ParkEvent } from "@/app/data/events";

afterEach(cleanup);

const event: ParkEvent = {
  id: "test-event",
  guid: "test-event",
  title: "Morning Yoga in Prospect Park",
  location: "Long Meadow",
  borough: "Brooklyn",
  category: "Fitness",
  date: "Aug 16, 2026",
  time: "7:30 AM",
  costType: "Free",
  registration: "Registration required",
  accessibility:
    "Accessibility information is mentioned in the official listing",
  imageAlt: "People doing yoga on a meadow",
  officialUrl: "https://www.nycgovparks.org/events/test-event",
};

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
    render(<EventCard event={event} />);

    expect(
      screen.getByRole("heading", { level: 2, name: event.title }),
    ).toBeTruthy();
    expect(screen.getByText("Long Meadow, Brooklyn")).toBeTruthy();
    expect(screen.getByText("Aug 16, 2026 · 7:30 AM")).toBeTruthy();
    expect(screen.getByText("Free")).toBeTruthy();
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText(event.registration)).toBeTruthy();
    expect(screen.getByText(event.accessibility)).toBeTruthy();
    expect(
      screen.getByRole("link", {
        name: "Official event details (opens in a new tab)",
      }),
    ).toBeTruthy();
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
    expect(screen.getByText("Official event link not listed")).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
  });
});

describe("BottomNav", () => {
  it("moves aria-current when a navigation item is selected", () => {
    render(<BottomNav />);

    const explore = screen.getByRole("button", { name: /Explore/ });
    const saved = screen.getByRole("button", { name: /Saved/ });
    expect(explore.getAttribute("aria-current")).toBe("page");

    fireEvent.click(saved);
    expect(explore.hasAttribute("aria-current")).toBe(false);
    expect(saved.getAttribute("aria-current")).toBe("page");
  });
});
