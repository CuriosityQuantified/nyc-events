"use client";

import { useState } from "react";
import type { ParkEvent } from "@/app/data/events";
import { useSaved } from "./SavedProvider";
import styles from "./SaveHeart.module.css";

/**
 * Quick-save heart toggle (#20). Saves to EventMatch Saved only — external
 * calendar export is the explicit flow in AddToCalendar. Renders nothing when
 * no SavedProvider is mounted (unit tests, isolated renders).
 */
export default function SaveHeart({ event }: { event: ParkEvent }) {
  const saved = useSaved();
  const [failed, setFailed] = useState(false);
  if (!saved) return null;

  const isSaved = saved.savedGuids.has(event.guid);
  const isPending = saved.pendingGuids.has(event.guid);
  const label = isSaved
    ? `Remove ${event.title} from Saved`
    : `Save ${event.title}`;

  const onToggle = async () => {
    setFailed(false);
    const ok = await saved.toggle(event);
    if (!ok) setFailed(true);
  };

  return (
    <span className={styles.wrapper}>
      <button
        type="button"
        className={`${styles.heart} ${isSaved ? styles.heartSaved : ""}`}
        aria-pressed={isSaved}
        aria-label={label}
        disabled={isPending}
        data-testid="save-heart"
        data-saved={isSaved ? "true" : "false"}
        onClick={(clickEvent) => {
          clickEvent.stopPropagation();
          clickEvent.preventDefault();
          void onToggle();
        }}
      >
        <span aria-hidden="true">{isSaved ? "♥" : "♡"}</span>
      </button>
      {isSaved ? <span className={styles.savedBadge}>Saved</span> : null}
      {failed ? (
        <span role="alert" className={styles.error}>
          {isSaved ? "Could not remove." : "Could not save."}{" "}
          <button
            type="button"
            className={styles.retry}
            onClick={(clickEvent) => {
              clickEvent.stopPropagation();
              clickEvent.preventDefault();
              void onToggle();
            }}
          >
            Retry
          </button>
        </span>
      ) : null}
    </span>
  );
}
