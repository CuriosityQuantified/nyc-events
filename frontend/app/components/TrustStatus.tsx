import type { Freshness, EventLifecycleStatus } from "@/app/data/events";
import styles from "./TrustStatus.module.css";

export const COVERAGE_LABEL =
  "Upcoming events currently present in NYC Parks’ rolling 14-day feed";

type FreshnessBannerProps = {
  freshness: Freshness | null;
  loading?: boolean;
  unavailable?: boolean;
};

function formatSyncTime(value: string | null): string {
  if (!value) return "not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "not available";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(date);
}

export function FreshnessBanner({
  freshness,
  loading = false,
  unavailable = false,
}: FreshnessBannerProps) {
  let state = "current";
  let icon = "✓";
  const syncTime = formatSyncTime(freshness?.lastSuccessfulSync ?? null);
  let title =
    syncTime === "not available"
      ? "Official data is current — last successful sync time is unavailable"
      : `Official data updated ${syncTime}`;

  if (loading) {
    state = "loading";
    icon = "…";
    title = "Checking official data freshness…";
  } else if (unavailable || !freshness) {
    state = "unavailable";
    icon = "!";
    title = "NYC Parks feed unavailable — freshness could not be checked";
  } else if (freshness.isStale) {
    state = "stale";
    icon = "!";
    title = `Data may be stale — last successful sync was ${formatSyncTime(freshness.lastSuccessfulSync)}`;
  }

  return (
    <section
      className={styles.freshnessBanner}
      data-state={state}
      data-testid="freshness-banner"
      role="status"
      aria-live="polite"
      aria-label="Data freshness"
    >
      <span className={styles.statusIcon} aria-hidden="true">
        {icon}
      </span>
      <div className={styles.freshnessCopy}>
        <strong>{title}</strong>
        <span>{COVERAGE_LABEL}</span>
      </div>
    </section>
  );
}

type EventStatusProps = {
  status?: EventLifecycleStatus | null;
  detail?: boolean;
};

const STATUS_COPY: Record<
  Exclude<EventLifecycleStatus, "current" | "unchanged">,
  { label: string; detail: string }
> = {
  new: {
    label: "New in latest update",
    detail: "This Event first appeared in the latest successful sync.",
  },
  changed: {
    label: "Details changed",
    detail: "NYC Parks changed this Event since the previous successful sync.",
  },
  cancelled: {
    label: "Officially cancelled",
    detail:
      "NYC Parks marked this Event as cancelled. Check the official listing for any rescheduling information.",
  },
  expired: {
    label: "Event ended",
    detail: "This Event’s scheduled date has passed.",
  },
  removed: {
    label: "Not in latest feed",
    detail:
      "This Event is absent from the latest rolling feed. That does not mean it was cancelled.",
  },
};

export function EventLifecycleStatus({
  status,
  detail = false,
}: EventStatusProps) {
  if (!status || status === "current" || status === "unchanged") return null;
  const copy = STATUS_COPY[status];

  if (!detail) {
    return (
      <span
        className={styles.lifecycleBadge}
        data-lifecycle-status={status}
        data-testid="event-lifecycle-status"
      >
        <span aria-hidden="true">●</span> {copy.label}
      </span>
    );
  }

  return (
    <section
      className={styles.lifecycleNotice}
      data-lifecycle-status={status}
      data-testid="event-lifecycle-notice"
      role={status === "cancelled" ? "alert" : "status"}
    >
      <strong>{copy.label}</strong>
      <p>{copy.detail}</p>
    </section>
  );
}
