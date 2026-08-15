import type { ParkEvent } from "@/app/data/events";
import styles from "./EventCard.module.css";

interface EventCardProps {
  event: ParkEvent;
}

function costLabel(event: ParkEvent): string {
  switch (event.costType) {
    case "Free":
      return "Free";
    case "Paid":
      return `$${event.costAmount}`;
    case "RSVP":
      return "RSVP";
  }
}

function costBadgeClass(costType: ParkEvent["costType"]): string {
  switch (costType) {
    case "Free":
      return styles.badgeFree;
    case "Paid":
      return styles.badgePaid;
    case "RSVP":
      return styles.badgeRsvp;
  }
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <article className={styles.card} data-testid="event-card">
      <div className={styles.imagePlaceholder} role="img" aria-label={event.imageAlt}>
        <span className={styles.imagePlaceholderIcon} aria-hidden="true">
          🌿
        </span>
        <span className={`${styles.badge} ${costBadgeClass(event.costType)}`}>
          {costLabel(event)}
        </span>
      </div>
      <div className={styles.content}>
        <p className={styles.category}>{event.category}</p>
        <h3 className={styles.title}>{event.title}</h3>
        <div className={styles.meta}>
          <p className={styles.metaItem}>
            <span className={styles.metaIcon} aria-hidden="true">
              📍
            </span>
            <span>
              {event.location}, {event.borough}
            </span>
          </p>
          <p className={styles.metaItem}>
            <span className={styles.metaIcon} aria-hidden="true">
              🕐
            </span>
            <span>{event.time}</span>
          </p>
        </div>
      </div>
    </article>
  );
}
