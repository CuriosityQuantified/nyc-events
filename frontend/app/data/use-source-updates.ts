"use client";

import { useEffect, useEffectEvent } from "react";
import type { Freshness } from "./events";

/** Poll our database-backed API, never NYC; pause hidden tabs and retry failures. */
export function useSourceUpdates(
  snapshot: string | null | undefined,
  refresh: (signal: AbortSignal) => Promise<void>,
  report: (freshness: Freshness | null) => void,
  scope = "",
) {
  const check = useEffectEvent(async (signal: AbortSignal) => {
    try {
      const response = await fetch("/api/freshness", {
        cache: "no-store",
        signal,
      });
      if (!response.ok) throw new Error("Freshness unavailable");
      const next = (await response.json()) as Freshness;
      if (
        typeof next.isStale !== "boolean" ||
        !(
          next.lastSuccessfulSync === null ||
          typeof next.lastSuccessfulSync === "string"
        )
      ) {
        throw new Error("Invalid freshness response");
      }
      if (signal.aborted) return;
      // Advance the displayed revision only after its event requests succeed.
      if (next.lastSuccessfulSync && next.lastSuccessfulSync !== snapshot) {
        await refresh(signal);
      }
      if (!signal.aborted) report(next);
    } catch {
      if (!signal.aborted || signal.reason?.name === "TimeoutError")
        report(null);
    }
  });

  useEffect(() => {
    let busy = false;
    let disposed = false;
    let controller: AbortController | undefined;
    const poll = async () => {
      if (
        disposed ||
        busy ||
        document.visibilityState === "hidden" ||
        !navigator.onLine
      )
        return;
      busy = true;
      controller = new AbortController();
      const timeout = window.setTimeout(
        () =>
          controller?.abort(
            new DOMException("Refresh timed out", "TimeoutError"),
          ),
        30_000,
      );
      try {
        await check(controller.signal);
      } finally {
        window.clearTimeout(timeout);
        busy = false;
      }
    };
    const resume = () => void poll();
    const interval = window.setInterval(resume, 60_000);
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("online", resume);
    return () => {
      disposed = true;
      controller?.abort();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("online", resume);
    };
  }, [scope]);
}
