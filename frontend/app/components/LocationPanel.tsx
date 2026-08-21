"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { ParkEvent } from "@/app/data/events";
import type { LocationGroup } from "@/app/data/maps";
import styles from "./LocationPanel.module.css";

type LocationPanelProps = {
  selected: LocationGroup | null;
  unlocated: ParkEvent[];
  returnQuery?: string;
};

/**
 * The glass tile that answers "what is at this pin?". It stays anchored to the
 * map rather than the document so a selection never scrolls out of reach, and
 * it keeps listing events that carry no usable coordinates.
 */
export default function LocationPanel({
  selected,
  unlocated,
  returnQuery = "",
}: LocationPanelProps) {
  const panel = useRef<HTMLElement>(null);
  const selectedKey = selected?.key ?? "";

  useEffect(() => {
    panel.current?.scrollTo({ top: 0 });
  }, [selectedKey]);

  function detailHref(event: ParkEvent): string {
    return `/events/${encodeURIComponent(event.guid)}${returnQuery ? `?${returnQuery}` : ""}`;
  }

  return (
    <aside
      ref={panel}
      className={`${styles.panel} glass-strong`}
      aria-label="Events at selected location"
      tabIndex={-1}
    >
      {selected ? (
        <>
          <div className={styles.heading}>
            <div>
              <p>
                {selected.accuracy === "exact"
                  ? "Exact Source Location"
                  : "Approximate Location"}
              </p>
              <h3>{selected.name}</h3>
              <span>{selected.borough}</span>
            </div>
            <strong>{selected.events.length} events</strong>
          </div>
          <ul className={styles.events}>
            {selected.events.map((event) => (
              <li key={event.guid}>
                <Link href={detailHref(event)}>{event.title}</Link>
                <span>
                  {event.date} · {event.time}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className={styles.empty}>
          No filtered events have a valid map location.
        </p>
      )}
      {unlocated.length ? (
        <details className={styles.unlocated}>
          <summary>
            {unlocated.length} events are available in the list only
          </summary>
          <ul>
            {unlocated.map((event) => (
              <li key={event.guid}>
                <Link href={detailHref(event)}>{event.title}</Link>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </aside>
  );
}
