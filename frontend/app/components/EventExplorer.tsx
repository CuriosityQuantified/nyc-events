"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Header from "@/app/components/Header";
import SearchBar from "@/app/components/SearchBar";
import FilterChips from "@/app/components/FilterChips";
import FollowFacets from "@/app/components/FollowFacets";
import ListMapToggle from "@/app/components/ListMapToggle";
import type { View } from "@/app/components/ListMapToggle";
import EventCard from "@/app/components/EventCard";
import EventMap from "@/app/components/EventMap";
import LocationPanel from "@/app/components/LocationPanel";
import BottomNav from "@/app/components/BottomNav";
import DesktopSidebar from "@/app/components/DesktopSidebar";
import { FreshnessBanner } from "@/app/components/TrustStatus";
import type { EventPage, Freshness, ParkEvent } from "@/app/data/events";
import { groupEventsByLocation } from "@/app/data/maps";
import {
  EMPTY_FILTERS,
  describeFilters,
  hasActiveFilters,
  parseFilterSearchParams,
  writeFilterSearchParams,
  type FilterState,
} from "@/app/data/filters";
import styles from "@/app/page.module.css";

function mergeWithoutDuplicates(current: ParkEvent[], incoming: ParkEvent[]) {
  const merged = new Map(current.map((event) => [event.guid, event]));
  for (const event of incoming) merged.set(event.guid, event);
  return [...merged.values()];
}

function eventsPath(filters: FilterState, page: number, pageSize = 12): string {
  const params = writeFilterSearchParams(new URLSearchParams(), filters);
  params.set("page", String(page));
  params.set("page_size", String(pageSize));
  return `/api/events?${params.toString()}`;
}

type EventExplorerProps = {
  initialFilters: FilterState;
};

export default function EventExplorer({ initialFilters }: EventExplorerProps) {
  const [view, setView] = useState<View>("list");
  const [filters, setFilters] = useState(initialFilters);
  const [events, setEvents] = useState<ParkEvent[]>([]);
  const [freshness, setFreshness] = useState<Freshness | null>(null);
  const [freshnessUnavailable, setFreshnessUnavailable] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [failedPage, setFailedPage] = useState<number | null>(null);
  const [loadMoreMessage, setLoadMoreMessage] = useState("");
  const [mapEvents, setMapEvents] = useState<ParkEvent[]>([]);
  const [mapState, setMapState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [selectedKey, setSelectedKey] = useState("");
  const requestVersion = useRef(0);
  const mapRequestVersion = useRef(0);
  const activeFilterDescriptions = describeFilters(filters);
  const returnQuery = writeFilterSearchParams(
    new URLSearchParams(),
    filters,
  ).toString();

  const groups = useMemo(() => groupEventsByLocation(mapEvents), [mapEvents]);
  const unlocated = useMemo(() => {
    const locatedGuids = new Set(
      groups.flatMap((group) => group.events.map((event) => event.guid)),
    );
    return mapEvents.filter((event) => !locatedGuids.has(event.guid));
  }, [mapEvents, groups]);
  const selectedLocation =
    groups.find((group) => group.key === selectedKey) ?? groups[0] ?? null;

  const load = useCallback(
    async (targetPage: number, replace: boolean) => {
      const requestId = ++requestVersion.current;
      if (replace) {
        setState("loading");
        setFreshnessUnavailable(false);
      } else {
        // The failure notice stays put until the retry resolves: clearing it
        // mid-flight would shrink the panel and move the results being read.
        setLoadingMore(true);
        setLoadMoreMessage("Loading more events");
      }

      try {
        let eventsResponse: Response;
        if (replace) {
          const [eventsResult, freshnessResult] = await Promise.allSettled([
            fetch(eventsPath(filters, targetPage), { cache: "no-store" }),
            fetch("/api/freshness", { cache: "no-store" }),
          ]);
          if (requestId !== requestVersion.current) return;

          if (
            freshnessResult.status === "fulfilled" &&
            freshnessResult.value.ok
          ) {
            try {
              setFreshness((await freshnessResult.value.json()) as Freshness);
              setFreshnessUnavailable(false);
            } catch {
              setFreshness(null);
              setFreshnessUnavailable(true);
            }
          } else {
            setFreshness(null);
            setFreshnessUnavailable(true);
          }

          if (eventsResult.status === "rejected") throw eventsResult.reason;
          eventsResponse = eventsResult.value;
        } else {
          eventsResponse = await fetch(eventsPath(filters, targetPage), {
            cache: "no-store",
          });
          if (requestId !== requestVersion.current) return;
        }

        if (!eventsResponse.ok) throw new Error("Event data is unavailable");
        const eventPage = (await eventsResponse.json()) as EventPage;
        setEvents((current) =>
          replace
            ? eventPage.events
            : mergeWithoutDuplicates(current, eventPage.events),
        );
        setPage(eventPage.page);
        setTotal(eventPage.total);
        setState("ready");
        if (!replace) {
          setLoadMoreError(false);
          setFailedPage(null);
          setLoadMoreMessage("More events loaded");
        }
      } catch {
        if (requestId !== requestVersion.current) return;
        if (replace) {
          setState("error");
        } else {
          setLoadMoreError(true);
          setFailedPage(targetPage);
          setLoadMoreMessage("Could not load more events");
        }
      } finally {
        if (requestId === requestVersion.current) setLoadingMore(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    queueMicrotask(() => void load(1, true));
  }, [load]);

  const loadMapEvents = useCallback(async () => {
    const requestId = ++mapRequestVersion.current;
    setMapState("loading");
    try {
      const firstResponse = await fetch(eventsPath(filters, 1, 100), {
        cache: "no-store",
      });
      if (!firstResponse.ok) throw new Error("Map event data is unavailable");
      const first = (await firstResponse.json()) as EventPage;
      if (first.total > 10_000 || first.totalPages > 100) {
        throw new Error("Map event data exceeds its bounded window");
      }
      const remaining = await Promise.all(
        Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, index) =>
          fetch(eventsPath(filters, index + 2, 100), { cache: "no-store" }),
        ),
      );
      if (remaining.some((response) => !response.ok)) {
        throw new Error("Map event data is incomplete");
      }
      const pages = await Promise.all(
        remaining.map(async (response) => (await response.json()) as EventPage),
      );
      if (requestId !== mapRequestVersion.current) return;
      setMapEvents(
        mergeWithoutDuplicates(
          first.events,
          pages.flatMap((result) => result.events),
        ),
      );
      setMapState("ready");
    } catch {
      if (requestId === mapRequestVersion.current) {
        setMapEvents([]);
        setMapState("error");
      }
    }
  }, [filters]);

  // The map is the page now, so it always carries the complete filtered set
  // rather than waiting for a view switch.
  useEffect(() => {
    queueMicrotask(() => void loadMapEvents());
  }, [loadMapEvents]);

  useEffect(() => {
    function restoreFilters() {
      const params = new URLSearchParams(window.location.search);
      setFilters(parseFilterSearchParams(params));
      setView(params.get("view") === "map" ? "map" : "list");
    }
    queueMicrotask(restoreFilters);
    window.addEventListener("popstate", restoreFilters);
    return () => window.removeEventListener("popstate", restoreFilters);
  }, []);

  function changeFilters(next: FilterState) {
    const params = writeFilterSearchParams(
      new URLSearchParams(window.location.search),
      next,
    );
    const query = params.toString();
    window.history.pushState(
      null,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
    );
    setFilters(next);
    setFailedPage(null);
  }

  function changeView(next: View) {
    const params = new URLSearchParams(window.location.search);
    if (next === "map") params.set("view", "map");
    else params.delete("view");
    const query = params.toString();
    window.history.pushState(
      null,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
    );
    setView(next);
  }

  function selectLocation(key: string) {
    setSelectedKey(key);
    // A pin selection is a request to read that location, so the map view
    // takes over the panel on phones where both cannot share the screen.
    if (window.matchMedia("(max-width: 1023px)").matches && view !== "map") {
      changeView("map");
    }
  }

  function retry() {
    void load(1, true);
  }

  function loadMore() {
    void load(failedPage ?? page + 1, false);
  }

  const showList = view === "list";

  return (
    <div className={styles.explore} data-view={view}>
      <a className="skip-link" href="#main-content">
        Skip to event results
      </a>
      <EventMap
        groups={groups}
        selectedKey={selectedLocation?.key ?? ""}
        view={view}
        onSelectLocation={selectLocation}
      />
      <DesktopSidebar />
      <Header />
      <div className={styles.statusSlot}>
        <FreshnessBanner
          freshness={freshness}
          loading={state === "loading"}
          unavailable={freshnessUnavailable}
        />
      </div>
      <main
        id="main-content"
        className={styles.workspace}
        tabIndex={-1}
        aria-busy={state === "loading" || loadingMore}
      >
        <div className={styles.sheetGrip} aria-hidden="true" />
        <SearchBar
          query={filters.query}
          onChange={(query) => changeFilters({ ...filters, query })}
        />
        <div className={styles.filtersColumn}>
          <FilterChips filters={filters} onChange={changeFilters} />
          <FollowFacets filters={filters} />
        </div>
        <section
          className={`${styles.resultsRegion} glass-strong`}
          aria-label="Filtered events"
        >
          <div className={styles.resultsHeader}>
            <div>
              <h2>Events</h2>
              {state === "ready" || events.length > 0 ? (
                <p>
                  {total} {total === 1 ? "event matches" : "events match"}
                </p>
              ) : null}
            </div>
            <ListMapToggle activeView={view} onViewChange={changeView} />
          </div>
          {state === "loading" && events.length === 0 ? (
            <section
              className={styles.dataState}
              role="status"
              aria-live="polite"
            >
              <h2>Loading Current Events…</h2>
              <p>Getting the latest NYC Parks event snapshot.</p>
            </section>
          ) : null}
          {state === "error" ? (
            <section className={styles.dataState} role="alert">
              <h2>Events Are Unavailable</h2>
              <p>Try the event service again.</p>
              <button type="button" onClick={retry}>
                Try Again
              </button>
            </section>
          ) : null}
          {state === "ready" && events.length === 0 ? (
            <section
              className={`${styles.dataState} ${styles.emptyFiltered}`}
              role="status"
              aria-live="polite"
              data-testid="filter-empty-state"
            >
              <h2>
                {hasActiveFilters(filters)
                  ? "No events match these filters"
                  : "No Current Events"}
              </h2>
              {hasActiveFilters(filters) ? (
                <>
                  <p>0 events match this combined view:</p>
                  <ul>
                    {activeFilterDescriptions.map((description) => (
                      <li key={description}>{description}</li>
                    ))}
                  </ul>
                  <p>Remove a filter or broaden the date range.</p>
                  <button
                    type="button"
                    onClick={() => changeFilters(EMPTY_FILTERS)}
                  >
                    Clear all filters
                  </button>
                </>
              ) : (
                <p>
                  The latest successful snapshot contains no current events.
                </p>
              )}
            </section>
          ) : null}
          {(state === "ready" || state === "loading") &&
          events.length > 0 &&
          showList ? (
            <>
              <p
                className={styles.resultsSummary}
                role="status"
                aria-live="polite"
              >
                {state === "loading"
                  ? "Updating results…"
                  : `Showing ${events.length} of ${total} matching events`}
              </p>
              <section
                className={styles.eventList}
                data-testid="event-list"
                aria-label="Event listings"
              >
                {events.map((event) => (
                  <EventCard
                    key={event.guid}
                    event={event}
                    returnQuery={returnQuery}
                  />
                ))}
              </section>
              {loadMoreError ? (
                <p className={styles.loadMoreError} role="alert">
                  The next page could not be loaded. Your place is preserved.
                </p>
              ) : null}
              {events.length < total || failedPage !== null ? (
                <button
                  className={styles.loadMore}
                  data-testid="load-more"
                  type="button"
                  disabled={loadingMore}
                  onClick={(event) => {
                    event.currentTarget.blur();
                    loadMore();
                  }}
                >
                  {loadingMore
                    ? "Loading More Events…"
                    : loadMoreError
                      ? "Try Loading More Again"
                      : "Load More Events"}
                </button>
              ) : null}
              <p className={styles.liveStatus} aria-live="polite">
                {loadMoreMessage}
              </p>
            </>
          ) : null}
          {!showList ? (
            <p className={styles.mapHint} role="status">
              {mapState === "loading" || mapState === "idle"
                ? "Loading every filtered event onto the map…"
                : mapState === "error"
                  ? "Map results are unavailable. Switch back to List to keep browsing."
                  : `${groups.length} mapped ${groups.length === 1 ? "location" : "locations"} · ${mapEvents.length} filtered events`}
            </p>
          ) : null}
        </section>
      </main>
      <div className={styles.locationSlot} data-open={!showList}>
        <LocationPanel
          selected={selectedLocation}
          unlocated={unlocated}
          returnQuery={returnQuery}
        />
      </div>
      <BottomNav />
    </div>
  );
}
