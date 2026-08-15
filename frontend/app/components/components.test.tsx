import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import BottomNav from "./BottomNav";
import EventCard from "./EventCard";
import ListMapToggle from "./ListMapToggle";
import type { ParkEvent } from "@/app/data/events";

afterEach(cleanup);

const event: ParkEvent = {
  id: "test-event",
  title: "Morning Yoga in Prospect Park",
  location: "Long Meadow",
  borough: "Brooklyn",
  category: "Fitness",
  date: "2026-08-16",
  time: "7:30 AM",
  costType: "Free",
  imageAlt: "People doing yoga on a meadow",
};

describe("ListMapToggle", () => {
  it("reports a map selection and exposes the current state", () => {
    const onViewChange = vi.fn();
    render(<ListMapToggle activeView="list" onViewChange={onViewChange} />);

    expect(screen.getByRole("button", { name: "List" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Map" }));
    expect(onViewChange).toHaveBeenCalledOnce();
    expect(onViewChange).toHaveBeenCalledWith("map");
  });
});

describe("EventCard", () => {
  it("renders the event identity, location, time, and cost", () => {
    render(<EventCard event={event} />);

    expect(screen.getByRole("heading", { level: 2, name: event.title })).toBeTruthy();
    expect(screen.getByText("Long Meadow, Brooklyn")).toBeTruthy();
    expect(screen.getByText("7:30 AM")).toBeTruthy();
    expect(screen.getByText("Free")).toBeTruthy();
    expect(screen.getByRole("img", { name: event.imageAlt })).toBeTruthy();
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
