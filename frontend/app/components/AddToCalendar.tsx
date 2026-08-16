"use client";

import type { ParkEvent } from "@/app/data/events";
import {
  buildIcs,
  googleCalendarUrl,
  icsFilename,
} from "@/app/data/calendar-export";
import styles from "./AddToCalendar.module.css";

/**
 * Explicit external-calendar handoff for a Saved Event (#46). The user
 * confirms the final addition inside Google or Apple Calendar; EventMatch
 * requests no calendar-account access.
 */
export default function AddToCalendar({ event }: { event: ParkEvent }) {
  const googleUrl = googleCalendarUrl(event);
  const ics = buildIcs(event);

  if (!googleUrl || !ics) {
    return (
      <p
        className={styles.unavailable}
        data-testid="add-to-calendar-unavailable"
      >
        Add to calendar unavailable — this event&apos;s date is not listed.
      </p>
    );
  }

  const icsHref = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;

  return (
    <details className={styles.menu} data-testid="add-to-calendar">
      <summary className={styles.summary}>
        <span aria-hidden="true">📆</span> Add to calendar
      </summary>
      <div className={styles.options}>
        <a
          className={styles.option}
          href={googleUrl}
          target="_blank"
          rel="noreferrer"
        >
          Google Calendar{" "}
          <span className={styles.notice}>(opens in a new tab)</span>
        </a>
        <a
          className={styles.option}
          href={icsHref}
          download={icsFilename(event)}
        >
          Apple Calendar (.ics file)
        </a>
        <p className={styles.notice}>
          Your calendar app asks you to confirm. Imported entries do not update
          automatically if this event changes.
        </p>
      </div>
    </details>
  );
}
