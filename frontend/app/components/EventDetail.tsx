"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import BottomNav from "@/app/components/BottomNav";
import MapPreview from "@/app/components/MapPreview";
import {
  EventLifecycleStatus,
  FreshnessBanner,
} from "@/app/components/TrustStatus";
import {
  eventLifecycleStatus,
  apiToUiEvent,
  parseEventResponse,
  safeOfficialUrl,
  type ApiFact,
  type ApiEvent,
  type Freshness,
  type Provenance,
} from "@/app/data/events";
import styles from "./EventDetail.module.css";

type EventDetailProps = {
  guid: string;
  returnHref: string;
};

type LoadState = "loading" | "ready" | "not-found" | "error";

function formatDate(value: string | null): string {
  if (!value) return "Date not listed";
  const date = new Date(`${value.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return "Date not listed";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  }).format(date);
}

function formatTime(value: string | null): string {
  if (!value) return "Time not listed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time not listed";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  }).format(date);
}

function normalizeProvenance(provenance: string): Provenance {
  if (provenance === "Stated" || provenance === "Derived") return provenance;
  return "Not listed";
}

type PresentedFact = {
  value: string;
  provenance: Provenance;
};

function presentFact<T>(
  fact: ApiFact<T>,
  fallback: string,
  format: (value: T) => string,
): PresentedFact {
  if (fact.value === null) {
    return { value: fallback, provenance: "Not listed" };
  }
  const value = format(fact.value);
  if (!value.trim() || value === fallback) {
    return { value: fallback, provenance: "Not listed" };
  }
  return { value, provenance: normalizeProvenance(fact.provenance) };
}

function provenanceClass(provenance: Provenance): string {
  if (provenance === "Stated") return styles.stated;
  if (provenance === "Derived") return styles.derived;
  return styles.notListed;
}

export function ProvenanceBadge({ provenance }: { provenance: string }) {
  const normalized = normalizeProvenance(provenance);
  return (
    <span
      className={`${styles.provenance} ${provenanceClass(normalized)}`}
      data-provenance={normalized}
    >
      {normalized}
    </span>
  );
}

function FactRow({
  label,
  value,
  provenance,
  note,
}: {
  label: string;
  value: ReactNode;
  provenance: string;
  note?: ReactNode;
}) {
  return (
    <div className={styles.factRow} data-fact-label={label}>
      <dt>{label}</dt>
      <dd>
        <strong>{value}</strong>
        {note ? <span className={styles.factNote}>{note}</span> : null}
        <ProvenanceBadge provenance={provenance} />
      </dd>
    </div>
  );
}

function DetailShell({
  returnHref,
  freshness,
  freshnessLoading = false,
  freshnessUnavailable = false,
  children,
}: {
  returnHref: string;
  freshness: Freshness | null;
  freshnessLoading?: boolean;
  freshnessUnavailable?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={styles.shell}>
      <a className="skip-link" href="#event-detail">
        Skip to event details
      </a>
      <header className={styles.header}>
        <Link className={styles.brand} href={returnHref}>
          EventMatch NYC
          <small>NYC Parks event explorer</small>
        </Link>
      </header>
      <div className={styles.freshnessSlot}>
        <FreshnessBanner
          freshness={freshness}
          loading={freshnessLoading}
          unavailable={freshnessUnavailable}
        />
      </div>
      <main id="event-detail" className={styles.page} tabIndex={-1}>
        <Link className={styles.backLink} href={returnHref}>
          <span aria-hidden="true">←</span> Back to filtered events
        </Link>
        {children}
      </main>
      <div className={styles.mobileNav}>
        <BottomNav />
      </div>
    </div>
  );
}

function presentRegistration(event: ApiEvent): PresentedFact {
  const description = presentFact(
    event.registration_description,
    "Registration information not listed",
    String,
  );
  if (description.provenance !== "Not listed") return description;

  let value = "Registration information not listed";
  if (event.registration_status.value === "required") {
    value = "Registration required";
  } else if (event.registration_status.value === "not_required") {
    value = "Registration not required";
  } else if (event.registration_status.value === "closed") {
    value = "Registration closed";
  }
  return {
    value,
    provenance:
      value === "Registration information not listed"
        ? "Not listed"
        : normalizeProvenance(event.registration_status.provenance),
  };
}

function DecisionPanel({
  event,
  officialUrl,
  registration,
  borough,
}: {
  event: ApiEvent;
  officialUrl: string | null;
  registration: PresentedFact;
  borough: PresentedFact;
}) {
  const freeIsExplicit = event.is_free_explicit.value === true;
  const accessibilityIsMentioned = event.accessibility_mentioned.value === true;

  return (
    <aside className={styles.decisionCard} aria-label="Event decision summary">
      <dl>
        <FactRow
          label="Registration"
          value={registration.value}
          provenance={registration.provenance}
        />
        <FactRow
          label="Cost"
          value={
            freeIsExplicit
              ? "Free — explicitly stated by NYC Parks"
              : "Cost information is not listed"
          }
          provenance={
            freeIsExplicit ? event.is_free_explicit.provenance : "Not listed"
          }
          note={
            freeIsExplicit
              ? undefined
              : "EventMatch does not assume that a missing price means free."
          }
        />
        <FactRow
          label="Accessibility"
          value={
            accessibilityIsMentioned
              ? "Accessibility information is mentioned in the official listing"
              : "Accessibility details are not provided"
          }
          provenance={
            accessibilityIsMentioned
              ? event.accessibility_mentioned.provenance
              : "Not listed"
          }
          note={
            accessibilityIsMentioned
              ? undefined
              : "Missing information is not a statement that the event is inaccessible. Verify accommodations with NYC Parks."
          }
        />
        <FactRow
          label="Borough"
          value={borough.value}
          provenance={borough.provenance}
        />
      </dl>
      {officialUrl ? (
        <a
          className={styles.officialLink}
          href={officialUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open official NYC Parks listing
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ) : (
        <p className={styles.officialMissing}>Official event link not listed</p>
      )}
    </aside>
  );
}

function VerificationPanel({ officialUrl }: { officialUrl: string | null }) {
  return (
    <aside className={styles.verifyPanel} aria-label="Source verification">
      <h2>Verify before you go</h2>
      <p>
        Event details can change. Check registration, cost, and accessibility
        information with NYC Parks before traveling.
      </p>
      {officialUrl ? (
        <a href={officialUrl} target="_blank" rel="noopener noreferrer">
          Check the source record
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ) : null}
    </aside>
  );
}

export function EventDetailContent({ event }: { event: ApiEvent }) {
  const officialUrl = safeOfficialUrl(event.official_event_url.value);
  const title = presentFact(event.title, "Untitled event", String);
  const description = presentFact(
    event.description,
    "Description not listed by NYC Parks.",
    String,
  );
  const categories = presentFact(event.categories, "Not listed", (values) =>
    values.join(", "),
  );
  const location = presentFact(
    event.location_name,
    "Location not listed",
    String,
  );
  const borough = presentFact(event.borough, "Borough not listed", String);
  const date = presentFact(event.start_date, "Date not listed", formatDate);
  const startTime = presentFact(
    event.start_datetime,
    "Start time not listed",
    (value) => {
      const formatted = formatTime(value);
      return formatted === "Time not listed"
        ? "Start time not listed"
        : formatted;
    },
  );
  const endTime = presentFact(
    event.end_datetime,
    "End time not listed",
    (value) => {
      const formatted = formatTime(value);
      return formatted === "Time not listed"
        ? "End time not listed"
        : formatted;
    },
  );
  const registration = presentRegistration(event);
  const freeIsExplicit = event.is_free_explicit.value === true;
  const accessibilityIsMentioned = event.accessibility_mentioned.value === true;
  const missingFacts = [
    !freeIsExplicit ? "Event cost" : null,
    !accessibilityIsMentioned ? "Accessibility or accommodation details" : null,
    registration.provenance === "Not listed" ? "Registration details" : null,
  ].filter((value): value is string => value !== null);

  return (
    <div className={styles.detailColumns}>
      <div className={styles.storyColumn}>
        <section className={styles.hero} aria-labelledby="event-title">
          <p className={styles.eyebrow}>
            {categories.value === "Not listed"
              ? "NYC Parks event"
              : categories.value.replaceAll(", ", " · ")}
          </p>
          <h1 id="event-title">{title.value}</h1>
          <ProvenanceBadge provenance={title.provenance} />
          <EventLifecycleStatus status={eventLifecycleStatus(event)} detail />
          <div className={styles.datePlace} data-testid="event-summary">
            <div>
              <span className={styles.summaryLabel}>When</span>
              <strong>{date.value}</strong>
              <span>
                {startTime.value}–{endTime.value}
              </span>
            </div>
            <div>
              <span className={styles.summaryLabel}>Where</span>
              <strong>{location.value}</strong>
              <span>{borough.value}</span>
            </div>
          </div>
        </section>

        <MapPreview event={apiToUiEvent(event)} variant="detail" />

        <div className={styles.storyContent}>
          <section className={styles.section} aria-labelledby="about-heading">
            <p className={styles.caption}>Full organizer source description</p>
            <h2 id="about-heading">About this event</h2>
            <div className={styles.sourceDescription}>
              <p>{description.value}</p>
            </div>
            <ProvenanceBadge provenance={description.provenance} />
          </section>

          <section className={styles.section} aria-labelledby="facts-heading">
            <h2 id="facts-heading">Plan your visit</h2>
            <dl className={styles.factList}>
              <FactRow
                label="Date"
                value={date.value}
                provenance={date.provenance}
              />
              <FactRow
                label="Start time"
                value={startTime.value}
                provenance={startTime.provenance}
              />
              <FactRow
                label="End time"
                value={endTime.value}
                provenance={endTime.provenance}
              />
              <FactRow
                label="Location"
                value={location.value}
                provenance={location.provenance}
              />
              <FactRow
                label="Borough"
                value={borough.value}
                provenance={borough.provenance}
              />
              <FactRow
                label="Address"
                value="Not listed"
                provenance="Not listed"
              />
              <FactRow
                label="Categories"
                value={categories.value}
                provenance={categories.provenance}
              />
              <FactRow
                label="Registration"
                value={registration.value}
                provenance={registration.provenance}
              />
            </dl>
          </section>

          {missingFacts.length > 0 ? (
            <section
              className={styles.section}
              aria-labelledby="missing-heading"
            >
              <div className={styles.missingPanel}>
                <h2 id="missing-heading">What is not listed</h2>
                <p>
                  These details are absent from the source record and should not
                  be assumed.
                </p>
                <ul>
                  {missingFacts.map((fact) => (
                    <li key={fact}>{fact}</li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <div className={styles.sideColumn}>
        <DecisionPanel
          event={event}
          officialUrl={officialUrl}
          registration={registration}
          borough={borough}
        />
        <VerificationPanel officialUrl={officialUrl} />
      </div>
    </div>
  );
}

export default function EventDetail({ guid, returnHref }: EventDetailProps) {
  const [state, setState] = useState<LoadState>("loading");
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [freshness, setFreshness] = useState<Freshness | null>(null);
  const [freshnessUnavailable, setFreshnessUnavailable] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const [eventResult, freshnessResult] = await Promise.allSettled([
          fetch(`/api/events/${encodeURIComponent(guid)}`, {
            cache: "no-store",
            signal: controller.signal,
          }),
          fetch("/api/freshness", {
            cache: "no-store",
            signal: controller.signal,
          }),
        ]);
        if (controller.signal.aborted) return;
        if (eventResult.status === "rejected") throw eventResult.reason;
        if (
          freshnessResult.status === "fulfilled" &&
          freshnessResult.value.ok
        ) {
          try {
            setFreshness((await freshnessResult.value.json()) as Freshness);
            setFreshnessUnavailable(false);
          } catch {
            setFreshnessUnavailable(true);
          }
        } else {
          setFreshnessUnavailable(true);
        }
        if (eventResult.value.status === 404) {
          setState("not-found");
          return;
        }
        if (!eventResult.value.ok) throw new Error("Event is unavailable");
        setEvent(parseEventResponse(await eventResult.value.json()));
        setState("ready");
      } catch {
        if (!controller.signal.aborted) setState("error");
      }
    }

    queueMicrotask(() => void load());
    return () => controller.abort();
  }, [guid]);

  if (state === "loading") {
    return (
      <DetailShell
        returnHref={returnHref}
        freshness={freshness}
        freshnessLoading
      >
        <section className={styles.dataState} role="status" aria-live="polite">
          <h1>Loading event details…</h1>
          <p>Checking the current NYC Parks source record.</p>
        </section>
      </DetailShell>
    );
  }

  if (state === "not-found") {
    return (
      <DetailShell
        returnHref={returnHref}
        freshness={freshness}
        freshnessUnavailable={freshnessUnavailable}
      >
        <section className={styles.dataState}>
          <h1>Event not found</h1>
          <p>This source event is not in the current EventMatch snapshot.</p>
        </section>
      </DetailShell>
    );
  }

  if (state === "error" || !event) {
    return (
      <DetailShell
        returnHref={returnHref}
        freshness={freshness}
        freshnessUnavailable={freshnessUnavailable}
      >
        <section className={styles.dataState}>
          <h1>Event details are unavailable</h1>
          <p>Return to the filtered event list and try again.</p>
        </section>
      </DetailShell>
    );
  }

  return (
    <DetailShell
      returnHref={returnHref}
      freshness={freshness}
      freshnessUnavailable={freshnessUnavailable}
    >
      <EventDetailContent event={event} />
    </DetailShell>
  );
}
