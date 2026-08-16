"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type CSSProperties } from "react";
import type { ParkEvent } from "@/app/data/events";
import {
  groupEventsByLocation,
  markerDiameter,
  type LocationGroup,
} from "@/app/data/maps";
import styles from "./EventMap.module.css";

function markerLabel(group: LocationGroup): string {
  const count = group.events.length;
  return `${group.name}, ${group.borough}: ${count} ${count === 1 ? "event" : "events"}`;
}

type EventMapProps = {
  events: ParkEvent[];
  returnQuery?: string;
};

type MarkerPosition = {
  left: string;
  top: string;
};

function markerPositions(groups: LocationGroup[]): Map<string, MarkerPosition> {
  if (!groups.length) return new Map();
  const latitudes = groups.map((group) => group.latitude);
  const longitudes = groups.map((group) => group.longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const latitudeRange = maxLatitude - minLatitude;
  const longitudeRange = maxLongitude - minLongitude;

  return new Map(
    groups.map((group) => {
      const x = longitudeRange
        ? 15 + ((group.longitude - minLongitude) / longitudeRange) * 70
        : 50;
      const y = latitudeRange
        ? 20 + ((maxLatitude - group.latitude) / latitudeRange) * 65
        : 52;
      return [group.key, { left: `${x}%`, top: `${y}%` }];
    }),
  );
}

export default function EventMap({ events, returnQuery = "" }: EventMapProps) {
  const groups = useMemo(() => groupEventsByLocation(events), [events]);
  const positions = useMemo(() => markerPositions(groups), [groups]);
  const unlocated = useMemo(() => {
    const locatedGuids = new Set(
      groups.flatMap((group) => group.events.map((event) => event.guid)),
    );
    return events.filter((event) => !locatedGuids.has(event.guid));
  }, [events, groups]);
  const [selectedKey, setSelectedKey] = useState(groups[0]?.key ?? "");
  const detailPanel = useRef<HTMLElement>(null);
  const selected =
    groups.find((group) => group.key === selectedKey) ?? groups[0] ?? null;
  const status = groups.length ? "ready" : "error";

  function detailHref(event: ParkEvent): string {
    return `/events/${encodeURIComponent(event.guid)}${returnQuery ? `?${returnQuery}` : ""}`;
  }

  return (
    <section
      className={styles.shell}
      data-testid="event-map"
      data-map-status={status}
      aria-label="Coordinate map of filtered events"
    >
      <div className={styles.mapStage}>
        <div className={styles.mapSummary} role="status">
          <strong>
            {groups.length} mapped{" "}
            {groups.length === 1 ? "location" : "locations"}
          </strong>
          <span>
            {events.length} filtered events · {unlocated.length} list-only
          </span>
        </div>
        <div
          className={styles.canvas}
          data-testid="coordinate-map"
          data-fit-bounds="true"
          role="group"
          aria-label="Approximate coordinate positions. Select a marker for event links."
        >
          <span className={styles.northLabel} aria-hidden="true">
            N
          </span>
          {groups.map((group) => {
            const diameter = markerDiameter(group.events.length);
            const position = positions.get(group.key);
            const markerStyle = {
              left: position?.left,
              top: position?.top,
              "--marker-diameter": `${diameter}px`,
            } as CSSProperties;
            return (
              <button
                key={group.key}
                type="button"
                className={styles.markerTarget}
                data-testid="map-marker"
                data-location-key={group.key}
                data-diameter={diameter}
                style={markerStyle}
                aria-label={markerLabel(group)}
                aria-pressed={selected?.key === group.key}
                onClick={() => {
                  setSelectedKey(group.key);
                  queueMicrotask(() =>
                    detailPanel.current?.scrollIntoView({ block: "nearest" }),
                  );
                }}
              >
                <span className={styles.markerDot} aria-hidden="true">
                  {group.events.length > 1 ? group.events.length : ""}
                </span>
              </button>
            );
          })}
        </div>
        {status === "error" ? (
          <div className={styles.mapState} role="alert">
            <strong>No Locations To Map</strong>
            <span>Filtered events remain available by location below.</span>
          </div>
        ) : null}
      </div>

      <aside
        ref={detailPanel}
        className={styles.locationPanel}
        aria-label="Events at selected location"
        tabIndex={-1}
      >
        {selected ? (
          <>
            <div className={styles.locationHeading}>
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
            <ul className={styles.locationEvents}>
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
          <p>No filtered events have a valid map location.</p>
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
    </section>
  );
}
