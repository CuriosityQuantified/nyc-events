"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Header from "@/app/components/Header";
import SearchBar from "@/app/components/SearchBar";
import FilterChips from "@/app/components/FilterChips";
import ListMapToggle from "@/app/components/ListMapToggle";
import type { View } from "@/app/components/ListMapToggle";
import EventCard from "@/app/components/EventCard";
import MapPlaceholder from "@/app/components/MapPlaceholder";
import BottomNav from "@/app/components/BottomNav";
import DesktopSidebar from "@/app/components/DesktopSidebar";
import type { EventPage, Freshness, ParkEvent } from "@/app/data/events";
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

function formatSyncTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "time not listed";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(date);
}

function eventsPath(filters: FilterState, page: number): string {
  const params = writeFilterSearchParams(new URLSearchParams(), filters);
  params.set("page", String(page));
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
  const requestVersion = useRef(0);
  const activeFilterDescriptions = describeFilters(filters);
  const returnQuery = writeFilterSearchParams(
    new URLSearchParams(),
    filters,
  ).toString();

  const load = useCallback(
    async (targetPage: number, replace: boolean) => {
      const requestId = ++requestVersion.current;
      if (replace) {
        setState("loading");
        setFreshnessUnavailable(false);
      } else {
        setLoadingMore(true);
        setLoadMoreError(false);
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

  useEffect(() => {
    function restoreFilters() {
      setFilters(
        parseFilterSearchParams(new URLSearchParams(window.location.search)),
      );
    }
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

  function retry() {
    void load(1, true);
  }

  function loadMore() {
    void load(failedPage ?? page + 1, false);
  }

  return (
    <div className={styles.appLayout}>
      <a className="skip-link" href="#main-content">
        Skip to event results
      </a>
      <DesktopSidebar />
      <div className={styles.mainArea}>
        <Header />
        <main
          id="main-content"
          className={styles.mainContent}
          tabIndex={-1}
          aria-busy={state === "loading" || loadingMore}
        >
          <SearchBar />
          <div className={styles.explorerWorkspace}>
            <FilterChips filters={filters} onChange={changeFilters} />
            <section
              className={styles.resultsRegion}
              aria-label="Filtered events"
            >
              <div className={styles.resultsHeader}>
                <div>
                  <h2>Events</h2>
                  {state === "ready" ? (
                    <p>
                      {total} {total === 1 ? "event matches" : "events match"}
                    </p>
                  ) : null}
                </div>
                <ListMapToggle activeView={view} onViewChange={setView} />
              </div>
              {freshnessUnavailable && state === "ready" ? (
                <p
                  className={styles.freshnessStatus}
                  role="status"
                  data-testid="freshness-unavailable"
                >
                  Event freshness is unavailable. Showing the latest event data
                  received.
                </p>
              ) : freshness?.isStale && state === "ready" ? (
                <p
                  className={styles.staleBanner}
                  role="status"
                  data-testid="stale-banner"
                >
                  Event data may be old. Last successful update:{" "}
                  {freshness.lastSuccessfulSync ? (
                    <time dateTime={freshness.lastSuccessfulSync}>
                      {formatSyncTime(freshness.lastSuccessfulSync)}
                    </time>
                  ) : (
                    "not available"
                  )}
                  .
                </p>
              ) : freshness && state === "ready" ? (
                <p className={styles.freshnessStatus} role="status">
                  Event data is current
                  {freshness.lastSuccessfulSync ? (
                    <>
                      {" "}
                      as of{" "}
                      <time dateTime={freshness.lastSuccessfulSync}>
                        {formatSyncTime(freshness.lastSuccessfulSync)}
                      </time>
                    </>
                  ) : null}
                  .
                </p>
              ) : null}
              {state === "loading" ? (
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
              {state === "ready" && events.length > 0 && view === "list" ? (
                <>
                  <p
                    className={styles.resultsSummary}
                    role="status"
                    aria-live="polite"
                  >
                    Showing {events.length} of {total} matching events
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
                      The next page could not be loaded. Your place is
                      preserved.
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
              {state === "ready" && events.length > 0 && view === "map" ? (
                <div className={styles.mapContainer}>
                  <MapPlaceholder />
                </div>
              ) : null}
            </section>
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
