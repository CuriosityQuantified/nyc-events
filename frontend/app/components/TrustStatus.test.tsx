import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  COVERAGE_LABEL,
  EventLifecycleStatus,
  FreshnessBanner,
} from "./TrustStatus";

afterEach(cleanup);

const current = {
  lastSuccessfulSync: "2026-08-16T12:00:00Z",
  snapshotRowCount: 3,
  isStale: false,
};

describe("FreshnessBanner", () => {
  it("keeps the exact coverage limit visible for current data", () => {
    render(<FreshnessBanner freshness={current} />);

    expect(screen.getByText(COVERAGE_LABEL)).toBeTruthy();
    expect(screen.getByText(/^Official data updated/)).toBeTruthy();
    expect(screen.getByTestId("freshness-banner").dataset.state).toBe(
      "current",
    );
  });

  it("labels stale data without presenting it as current", () => {
    render(<FreshnessBanner freshness={{ ...current, isStale: true }} />);

    expect(screen.getByText(/^Data may be stale/)).toBeTruthy();
    expect(screen.queryByText(/^Official data updated/)).toBeNull();
    expect(screen.getByText(COVERAGE_LABEL)).toBeTruthy();
  });

  it("keeps loading and unavailable states explicit", () => {
    const { rerender } = render(<FreshnessBanner freshness={null} loading />);
    expect(screen.getByText("Checking official data freshness…")).toBeTruthy();

    rerender(<FreshnessBanner freshness={null} unavailable />);
    expect(screen.getByText(/freshness could not be checked/)).toBeTruthy();
    expect(screen.getByText(COVERAGE_LABEL)).toBeTruthy();
  });

  it("does not invent a successful sync time", () => {
    render(
      <FreshnessBanner
        freshness={{ ...current, lastSuccessfulSync: null }}
      />,
    );
    expect(screen.getByText(/sync time is unavailable/)).toBeTruthy();
    expect(screen.queryByText(/Official data updated/)).toBeNull();
  });
});

describe("EventLifecycleStatus", () => {
  it("reserves cancellation language for an explicit cancelled state", () => {
    const { rerender } = render(
      <EventLifecycleStatus status="cancelled" detail />,
    );
    expect(screen.getByText("Officially cancelled")).toBeTruthy();

    rerender(<EventLifecycleStatus status="removed" detail />);
    expect(screen.getByText("Not in latest feed")).toBeTruthy();
    expect(screen.getByText(/does not mean it was cancelled/i)).toBeTruthy();
    expect(screen.queryByText("Officially cancelled")).toBeNull();
  });

  it("distinguishes ended, changed, and unchanged Events", () => {
    const { rerender } = render(<EventLifecycleStatus status="expired" />);
    expect(screen.getByText(/Event ended/)).toBeTruthy();

    rerender(<EventLifecycleStatus status="changed" />);
    expect(screen.getByText(/Details changed/)).toBeTruthy();

    rerender(<EventLifecycleStatus status="unchanged" />);
    expect(screen.queryByTestId("event-lifecycle-status")).toBeNull();
  });
});
