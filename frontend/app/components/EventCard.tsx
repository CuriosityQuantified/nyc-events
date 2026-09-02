"use client";

import { useState } from "react";
import Link from "next/link";
import type { ParkEvent } from "@/app/data/events";
import { EventLifecycleStatus } from "./TrustStatus";
import SaveHeart from "./SaveHeart";
import MapPreview from "./MapPreview";
import styles from "./EventCard.module.css";

interface EventCardProps {
  event: ParkEvent;
  returnQuery?: string;
  onSelectTransit?: (event: ParkEvent) => void;
}

function costLabel(event: ParkEvent): string {
  switch (event.costType) {
    case "Free":
      return "Free";
    case "Paid":
      return "Paid";
    case "Not listed":
      // Product decision (2026-08-16): NYC Parks events are free unless the
      // listing states a cost, so a silent source renders as Free.
      return "Free";
  }
}

function costBadgeClass(costType: ParkEvent["costType"]): string {
  switch (costType) {
    case "Paid":
      return styles.badgePaid;
    case "Free":
    case "Not listed":
      return styles.badgeFree;
  }
}

export default function EventCard({
  event,
  returnQuery = "",
  onSelectTransit,
}: EventCardProps) {
  const [mapExpanded, setMapExpanded] = useState(false);
  const detailHref = `/events/${encodeURIComponent(event.guid)}${returnQuery ? `?${returnQuery}` : ""}`;

  return (
    <article
      className={styles.card}
      data-testid="event-card"
      data-event-guid={event.guid}
    >
      <div className={styles.content}>
        <div className={styles.statusRow}>
          <EventLifecycleStatus status={event.lifecycleStatus} />
          <span className={`${styles.badge} ${costBadgeClass(event.costType)}`}>
            {costLabel(event)}
          </span>
          <SaveHeart event={event} />
        </div>
        <p className={styles.category}>{event.category}</p>
        <h2 className={styles.title}>{event.title}</h2>
        <p className={styles.when}>
          <span className={styles.metaIcon} aria-hidden="true">
            🕐
          </span>
          <span>
            {event.date} · {event.time}
          </span>
        </p>
        <p className={styles.where} data-location-fact="venue">
          <span className={styles.metaIcon} aria-hidden="true">
            📍
          </span>
          <span>Venue or park: {event.location}</span>
        </p>
        <div className={styles.meta}>
          <p className={styles.metaItem} data-location-fact="borough">
            Borough: {event.borough}
          </p>
          <p className={styles.metaItem}>{event.registration}</p>
          <p className={styles.metaItem} data-location-fact="address">
            Address: Not listed
          </p>
          <p className={styles.metaItem}>{event.accessibility}</p>
          {event.subwayProximity ? (
            <>
              <p className={styles.metaItem} data-testid="nearest-station">
                Nearest station: {event.subwayProximity.nearestStop.name}
              </p>
              <p
                className={styles.metaItem}
                data-testid="straight-line-distance"
              >
                Straight-line distance:{" "}
                {event.subwayProximity.straightLineDistanceMiles.toFixed(2)} mi
              </p>
            </>
          ) : null}
        </div>
      </div>
      <MapPreview
        event={event}
        variant={mapExpanded ? "expanded" : "compact"}
      />
      <div className={styles.actions}>
        {event.subwayProximity && onSelectTransit ? (
          <button
            className={styles.expandMap}
            type="button"
            onClick={() => onSelectTransit(event)}
          >
            Select event and nearest stop
          </button>
        ) : null}
        <button
          className={styles.expandMap}
          type="button"
          aria-expanded={mapExpanded}
          onClick={() => setMapExpanded((expanded) => !expanded)}
        >
          {mapExpanded ? "Show compact map" : "Show larger map"}
        </button>
        <Link
          className={styles.detailLink}
          href={detailHref}
          aria-label={`View details for ${event.title}`}
        >
          View event details
        </Link>
      </div>
    </article>
  );
}
