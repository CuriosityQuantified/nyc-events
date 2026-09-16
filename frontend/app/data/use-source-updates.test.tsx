import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSourceUpdates } from "./use-source-updates";

const fresh = {
  lastSuccessfulSync: "2026-09-16T01:00:00Z",
  isStale: false,
  snapshotRowCount: 10,
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => fresh }),
  );
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("source updates", () => {
  it("checks our API every minute without reloading unchanged events", async () => {
    const refresh = vi.fn();
    const report = vi.fn();
    renderHook(() =>
      useSourceUpdates(fresh.lastSuccessfulSync, refresh, report),
    );
    await act(() => vi.advanceTimersByTimeAsync(60_000));
    expect(fetch).toHaveBeenCalledWith(
      "/api/freshness",
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(refresh).not.toHaveBeenCalled();
    expect(report).toHaveBeenCalledWith(fresh);
  });

  it("refreshes changed events before advancing freshness and retries a failed refresh", async () => {
    const refresh = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(undefined);
    const report = vi.fn();
    renderHook(() => useSourceUpdates("older", refresh, report));
    await act(() => vi.advanceTimersByTimeAsync(60_000));
    expect(report).toHaveBeenLastCalledWith(null);
    await act(() => vi.advanceTimersByTimeAsync(60_000));
    expect(refresh).toHaveBeenCalledTimes(2);
    expect(report).toHaveBeenLastCalledWith(fresh);
  });

  it("pauses hidden and offline tabs, then checks when they become visible", async () => {
    const visible = vi
      .spyOn(document, "visibilityState", "get")
      .mockReturnValue("hidden");
    const refresh = vi.fn();
    renderHook(() =>
      useSourceUpdates(fresh.lastSuccessfulSync, refresh, vi.fn()),
    );
    await act(() => vi.advanceTimersByTimeAsync(60_000));
    expect(fetch).not.toHaveBeenCalled();
    visible.mockReturnValue("visible");
    await act(async () =>
      document.dispatchEvent(new Event("visibilitychange")),
    );
    expect(fetch).toHaveBeenCalledTimes(1);
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    await act(() => vi.advanceTimersByTimeAsync(60_000));
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("aborts on a scope change and unmount without installing duplicate timers", async () => {
    let signal: AbortSignal | undefined;
    vi.mocked(fetch).mockImplementation((_url, options) => {
      signal = options?.signal as AbortSignal;
      return new Promise((_resolve, reject) =>
        signal?.addEventListener("abort", () => reject(signal?.reason)),
      );
    });
    const report = vi.fn();
    const { rerender, unmount } = renderHook(
      ({ scope }) => useSourceUpdates("older", vi.fn(), report, scope),
      { initialProps: { scope: "a" } },
    );
    await act(() => vi.advanceTimersByTimeAsync(60_000));
    rerender({ scope: "b" });
    expect(signal?.aborted).toBe(true);
    unmount();
    await act(() => vi.advanceTimersByTimeAsync(120_000));
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(report).not.toHaveBeenCalled();
  });
});
