import Link from "next/link";
import type { ParkEvent } from "@/app/data/events";
import { EventLifecycleStatus } from "./TrustStatus";
import styles from "./EventCard.module.css";

interface EventCardProps {
  event: ParkEvent;
  returnQuery?: string;
}

function costLabel(event: ParkEvent): string {
  switch (event.costType) {
    case "Free":
      return "Free";
    case "Paid":
      return "Paid";
    case "Not listed":
      return "Cost not listed";
  }
}

function costBadgeClass(costType: ParkEvent["costType"]): string {
  switch (costType) {
    case "Free":
      return styles.badgeFree;
    case "Paid":
      return styles.badgePaid;
    case "Not listed":
      return styles.badgeRsvp;
  }
}

export default function EventCard({ event, returnQuery = "" }: EventCardProps) {
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
        </div>
        <p className={styles.category}>{event.category}</p>
        <h2 className={styles.title}>{event.title}</h2>
        <div className={styles.meta}>
          <p className={styles.metaItem} data-location-fact="venue">
            <span className={styles.metaIcon} aria-hidden="true">
              📍
            </span>
            <span>Venue or park: {event.location}</span>
          </p>
          <p className={styles.metaItem} data-location-fact="neighborhood">
            Neighborhood: Not listed
          </p>
          <p className={styles.metaItem} data-location-fact="borough">
            Borough: {event.borough}
          </p>
          <p className={styles.metaItem} data-location-fact="address">
            Address: Not listed
          </p>
          <p className={styles.metaItem}>
            <span className={styles.metaIcon} aria-hidden="true">
              🕐
            </span>
            <span>
              {event.date} · {event.time}
            </span>
          </p>
          <p className={styles.metaItem}>{event.registration}</p>
          <p className={styles.metaItem}>{event.accessibility}</p>
        </div>
      </div>
      <div className={styles.actions}>
        <Link
          className={styles.detailLink}
          href={detailHref}
          aria-label={`View details for ${event.title}`}
        >
          View event details
        </Link>
        {event.officialUrl ? (
          <a href={event.officialUrl} rel="noreferrer" target="_blank">
            Official event details{" "}
            <span className={styles.newTabNotice}>(opens in a new tab)</span>
          </a>
        ) : (
          <p className={styles.metaItem}>Official event link not listed</p>
        )}
      </div>
    </article>
  );
}
