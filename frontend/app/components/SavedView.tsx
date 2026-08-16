"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/app/components/Header";
import DesktopSidebar from "@/app/components/DesktopSidebar";
import BottomNav from "@/app/components/BottomNav";
import EventCard from "@/app/components/EventCard";
import AddToCalendar from "@/app/components/AddToCalendar";
import SavedCalendar, { isMonthKey } from "@/app/components/SavedCalendar";
import { useSaved } from "@/app/components/SavedProvider";
import type { ParkEvent } from "@/app/data/events";
import pageStyles from "@/app/page.module.css";
import styles from "./SavedView.module.css";

function newYorkToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function SavedEventItem({ event }: { event: ParkEvent }) {
  return (
    <li className={styles.savedItem}>
      <EventCard event={event} />
      <AddToCalendar event={event} />
    </li>
  );
}

/**
 * Combined Saved / My Plans tab (#20): one Saved collection rendered by an
 * in-page List / Calendar switch. View, month, and selected day live in the
 * URL so refresh and back/forward keep the state.
 */
export default function SavedView() {
  const saved = useSaved();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const todayIso = newYorkToday();

  const view = searchParams.get("view") === "calendar" ? "calendar" : "list";
  const monthParam = searchParams.get("month");
  const monthKey = isMonthKey(monthParam) ? monthParam : todayIso.slice(0, 7);
  const dayParam = searchParams.get("day");
  const selectedDay =
    dayParam && /^\d{4}-\d{2}-\d{2}$/.test(dayParam) ? dayParam : null;

  const setParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const events = saved?.events ?? [];
  const undated = events.filter((event) => !event.startDate);
  const dayEvents = selectedDay
    ? events.filter((event) => event.startDate === selectedDay)
    : [];

  return (
    <div className={pageStyles.appLayout}>
      <a className="skip-link" href="#main-content">
        Skip to saved events
      </a>
      <DesktopSidebar />
      <div className={pageStyles.mainArea}>
        <Header />
        <main
          id="main-content"
          className={pageStyles.mainContent}
          tabIndex={-1}
          aria-busy={saved?.status === "loading"}
        >
          <div className={styles.savedHeader}>
            <div>
              <h2 className={styles.title}>Saved</h2>
              <p className={styles.subtitle}>
                Your plans, saved on this device — no account needed.
              </p>
            </div>
            <div
              className={styles.viewToggle}
              role="group"
              aria-label="Saved view mode"
              data-testid="saved-view-toggle"
            >
              <button
                type="button"
                className={`${styles.viewButton} ${view === "list" ? styles.viewButtonActive : ""}`}
                aria-pressed={view === "list"}
                onClick={() => setParams({ view: null, day: null })}
              >
                List
              </button>
              <button
                type="button"
                className={`${styles.viewButton} ${view === "calendar" ? styles.viewButtonActive : ""}`}
                aria-pressed={view === "calendar"}
                onClick={() => setParams({ view: "calendar" })}
              >
                Calendar
              </button>
            </div>
          </div>

          {!saved || saved.status === "loading" ? (
            <section className={pageStyles.dataState} role="status">
              <p>Loading your saved events…</p>
            </section>
          ) : saved.status === "error" ? (
            <section className={pageStyles.dataState} role="alert">
              <p>Your saved events could not be loaded right now.</p>
              <button type="button" onClick={() => saved.reload()}>
                Retry
              </button>
            </section>
          ) : events.length === 0 ? (
            <section className={pageStyles.dataState} data-testid="saved-empty">
              <p>No saved events yet.</p>
              <p>
                Tap the heart on any event in <Link href="/">Explore</Link> to
                save it here.
              </p>
            </section>
          ) : view === "list" ? (
            <section aria-label="Saved events list">
              <ul className={pageStyles.eventList} data-testid="saved-list">
                {events.map((event) => (
                  <SavedEventItem key={event.guid} event={event} />
                ))}
              </ul>
            </section>
          ) : (
            <section
              aria-label="Saved events calendar"
              className={styles.calendarLayout}
            >
              <SavedCalendar
                events={events}
                monthKey={monthKey}
                todayIso={todayIso}
                selectedDay={selectedDay}
                onMonthChange={(nextMonth) =>
                  setParams({ month: nextMonth, day: null })
                }
                onSelectDay={(isoDate) =>
                  setParams({
                    month: isoDate.slice(0, 7),
                    day: selectedDay === isoDate ? null : isoDate,
                  })
                }
              />
              {undated.length > 0 ? (
                <p className={styles.undatedNote}>
                  {undated.length} saved{" "}
                  {undated.length === 1 ? "event has" : "events have"} no listed
                  date and {undated.length === 1 ? "appears" : "appear"} only in
                  the List view.
                </p>
              ) : null}
              <div aria-live="polite">
                {selectedDay === null ? (
                  <p className={styles.dayHint}>
                    Select a day to see its saved events.
                  </p>
                ) : dayEvents.length === 0 ? (
                  <p className={styles.dayHint} data-testid="saved-day-empty">
                    No saved events on {selectedDay}.
                  </p>
                ) : (
                  <ul
                    className={pageStyles.eventList}
                    data-testid="saved-day-list"
                  >
                    {dayEvents.map((event) => (
                      <SavedEventItem key={event.guid} event={event} />
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
