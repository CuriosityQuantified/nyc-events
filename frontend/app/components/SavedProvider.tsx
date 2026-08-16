"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ParkEvent } from "@/app/data/events";
import {
  fetchSavedEvents,
  saveEventRemote,
  unsaveEventRemote,
} from "@/app/data/saved";

export type SavedContextValue = {
  status: "loading" | "ready" | "error";
  /** Saved Events, chronological by start date with unknown dates last. */
  events: ParkEvent[];
  savedGuids: ReadonlySet<string>;
  pendingGuids: ReadonlySet<string>;
  reload: () => void;
  /** Optimistic save/unsave; resolves false (after rollback) on failure. */
  toggle: (event: ParkEvent) => Promise<boolean>;
};

const SavedContext = createContext<SavedContextValue | null>(null);

export function useSaved(): SavedContextValue | null {
  return useContext(SavedContext);
}

function chronological(events: ParkEvent[]): ParkEvent[] {
  const unique = [...new Map(events.map((e) => [e.guid, e])).values()];
  return unique.sort((a, b) => {
    if (a.startDate && b.startDate && a.startDate !== b.startDate) {
      return a.startDate < b.startDate ? -1 : 1;
    }
    if (a.startDate && !b.startDate) return -1;
    if (!a.startDate && b.startDate) return 1;
    return a.guid < b.guid ? -1 : a.guid > b.guid ? 1 : 0;
  });
}

export default function SavedProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [events, setEvents] = useState<ParkEvent[]>([]);
  const [pendingGuids, setPendingGuids] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const loadVersion = useRef(0);
  const [loadCount, setLoadCount] = useState(0);

  const reload = useCallback(() => {
    setStatus("loading");
    setLoadCount((count) => count + 1);
  }, []);

  useEffect(() => {
    const version = ++loadVersion.current;
    fetchSavedEvents()
      .then((saved) => {
        if (loadVersion.current !== version) return;
        setEvents(chronological(saved));
        setStatus("ready");
      })
      .catch(() => {
        if (loadVersion.current !== version) return;
        setStatus("error");
      });
  }, [loadCount]);

  const savedGuids = useMemo(
    () => new Set(events.map((event) => event.guid)),
    [events],
  );

  const toggle = useCallback(
    async (event: ParkEvent): Promise<boolean> => {
      const guid = event.guid;
      const wasSaved = savedGuids.has(guid);
      setPendingGuids((prev) => new Set(prev).add(guid));
      setEvents((prev) =>
        wasSaved
          ? prev.filter((item) => item.guid !== guid)
          : chronological([...prev, event]),
      );
      try {
        if (wasSaved) await unsaveEventRemote(guid);
        else await saveEventRemote(guid);
        return true;
      } catch {
        setEvents((prev) =>
          wasSaved
            ? chronological([...prev, event])
            : prev.filter((item) => item.guid !== guid),
        );
        return false;
      } finally {
        setPendingGuids((prev) => {
          const next = new Set(prev);
          next.delete(guid);
          return next;
        });
      }
    },
    [savedGuids],
  );

  const value = useMemo(
    () => ({ status, events, savedGuids, pendingGuids, reload, toggle }),
    [status, events, savedGuids, pendingGuids, reload, toggle],
  );

  return (
    <SavedContext.Provider value={value}>{children}</SavedContext.Provider>
  );
}
