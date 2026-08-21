"use client";

import { useCallback, useEffect, useState } from "react";
import EventCard from "@/app/components/EventCard";
import { useSaved } from "@/app/components/SavedProvider";
import type { ParkEvent } from "@/app/data/events";
import {
  dismissMatch,
  fetchMatches,
  promoteMatch,
} from "@/app/data/preferences";
import styles from "./MatchesSection.module.css";

/**
 * Matches inside the Saved destination (#22): automatic suggestions from
 * followed Interests, kept visibly separate from deliberate Saved choices.
 * A Match can be promoted into Saved or dismissed.
 */
export default function MatchesSection() {
  const saved = useSaved();
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [matches, setMatches] = useState<ParkEvent[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loadCount, setLoadCount] = useState(0);

  const reload = useCallback(() => {
    setStatus("loading");
    setLoadCount((count) => count + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchMatches()
      .then((events) => {
        if (cancelled) return;
        setMatches(events);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [loadCount]);

  const onPromote = async (event: ParkEvent) => {
    setActionError(null);
    try {
      await promoteMatch(event.guid);
      setMatches((prev) => prev.filter((item) => item.guid !== event.guid));
      saved?.reload();
    } catch {
      setActionError(`Could not add ${event.title} to Saved.`);
    }
  };

  const onDismiss = async (event: ParkEvent) => {
    setActionError(null);
    try {
      await dismissMatch(event.guid);
      setMatches((prev) => prev.filter((item) => item.guid !== event.guid));
    } catch {
      setActionError(`Could not dismiss ${event.title}.`);
    }
  };

  return (
    <section
      className={styles.section}
      aria-label="Matches from your Interests"
      data-testid="matches-section"
    >
      <h2 className={styles.heading}>Matches</h2>
      <p className={styles.explainer}>
        Automatic suggestions from the Interests you follow — separate from the
        events you saved yourself.
      </p>
      {actionError ? (
        <p role="alert" className={styles.error}>
          {actionError}
        </p>
      ) : null}
      {status === "loading" ? (
        <p role="status" className={styles.state}>
          Loading matches…
        </p>
      ) : status === "error" ? (
        <p role="alert" className={styles.state}>
          Matches could not be loaded.{" "}
          <button type="button" className={styles.retry} onClick={reload}>
            Retry
          </button>
        </p>
      ) : matches.length === 0 ? (
        <p className={styles.state} data-testid="matches-empty">
          No new matches. Follow a borough, category, or registration filter
          from Explore and new events will find you here.
        </p>
      ) : (
        <ul className={styles.list} data-testid="matches-list">
          {matches.map((event) => (
            <li key={event.guid} className={styles.item}>
              <EventCard event={event} />
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.promote}
                  onClick={() => void onPromote(event)}
                >
                  Add to Saved
                </button>
                <button
                  type="button"
                  className={styles.dismiss}
                  onClick={() => void onDismiss(event)}
                  aria-label={`Dismiss ${event.title}`}
                >
                  Dismiss
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
