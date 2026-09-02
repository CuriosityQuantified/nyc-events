"use client";

import {
  SUBWAY_LINES,
  getSubwayLine,
  type SubwayStopData,
} from "@/app/data/subway";
import { safeOfficialUrl, type TransitSource } from "@/app/data/events";
import styles from "./SubwayLineSelector.module.css";

type SubwayLineSelectorProps = {
  selectedLine: string | null;
  onChange: (lineId: string | null) => void;
  transitSource?: TransitSource | null;
  transitGeoState?: "idle" | "loading" | "ready" | "stale" | "error";
  stops?: Record<string, SubwayStopData>;
  stopIds?: string[];
  routeBranchCount?: number;
  selectedStopId?: string | null;
  onSelectStop?: (stopId: string | null) => void;
  nearbyEventTitles?: string[];
};

function formatTransitLastUpdated(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export default function SubwayLineSelector({
  selectedLine,
  onChange,
  transitSource,
  transitGeoState,
  stops,
  stopIds,
  routeBranchCount,
  selectedStopId,
  onSelectStop,
  nearbyEventTitles = [],
}: SubwayLineSelectorProps) {
  const activeLine = selectedLine ? getSubwayLine(selectedLine) : null;
  const hasStops = stops && stopIds && stopIds.length > 0;

  return (
    <div className={styles.wrapper}>
      <label className={styles.label}>
        Subway line
        <select
          className={`${styles.select}${selectedLine ? ` ${styles.selectActive}` : ""}`}
          aria-label="Subway line filter"
          name="subway-line"
          autoComplete="off"
          value={selectedLine ?? ""}
          onChange={(event) => onChange(event.target.value || null)}
        >
          <option value="">Any subway line</option>
          {SUBWAY_LINES.map((line) => (
            <option key={line.id} value={line.id}>
              {line.shortName} — {line.longName}
            </option>
          ))}
        </select>
      </label>
      {activeLine ? (
        <div className={styles.summary} data-testid="subway-line-summary">
          <div className={styles.summaryHeader}>
            <span
              className={styles.bullet}
              style={
                {
                  "--line-color": `#${activeLine.color}`,
                  "--line-text-color": `#${activeLine.textColor}`,
                } as React.CSSProperties
              }
              aria-hidden="true"
            >
              {activeLine.shortName}
            </span>
            <span className={styles.lineName}>{activeLine.longName}</span>
          </div>
          <span className={styles.eyebrow}>
            Strictly under 0.5 miles from stops
          </span>
          {hasStops && onSelectStop ? (
            <label className={styles.label}>
              Nearby stop
              <select
                className={styles.select}
                aria-label="Nearby stop"
                name="nearby-subway-stop"
                autoComplete="off"
                value={selectedStopId ?? ""}
                onChange={(event) => onSelectStop(event.target.value || null)}
              >
                <option value="">Any stop</option>
                {stopIds.map((id) => {
                  const stop = stops[id];
                  return stop ? (
                    <option key={id} value={id}>
                      {stop.name}
                    </option>
                  ) : null;
                })}
              </select>
            </label>
          ) : null}
          {selectedStopId ? (
            <div
              className={styles.nearbyEvents}
              role="status"
              aria-live="polite"
            >
              <strong>
                {nearbyEventTitles.length}{" "}
                {nearbyEventTitles.length === 1 ? "Event" : "Events"} nearest to
                this stop
              </strong>
              {nearbyEventTitles.length > 0 ? (
                <ul>
                  {nearbyEventTitles.map((title, index) => (
                    <li key={`${title}-${index}`}>{title}</li>
                  ))}
                </ul>
              ) : (
                <span>No matching Events use this as their nearest stop.</span>
              )}
            </div>
          ) : null}
          {transitSource ? (
            <span className={styles.attribution}>
              Transit data:{" "}
              {safeOfficialUrl(transitSource.sourceUrl) ? (
                <a
                  href={safeOfficialUrl(transitSource.sourceUrl)!}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {transitSource.attribution}
                </a>
              ) : (
                <span>{transitSource.attribution}</span>
              )}{" "}
              (updated {formatTransitLastUpdated(transitSource.lastUpdated)})
            </span>
          ) : null}
          {transitGeoState === "loading" ? (
            <span className={styles.geoStatus} role="status" aria-live="polite">
              Loading route geometry…
            </span>
          ) : null}
          {transitGeoState === "ready" ? (
            <span className={styles.geoStatus} role="status" aria-live="polite">
              Route overlay ready: {routeBranchCount ?? 0} represented{" "}
              {(routeBranchCount ?? 0) === 1 ? "branch" : "branches"} and{" "}
              {stopIds?.length ?? 0} stops.
            </span>
          ) : null}
          {transitGeoState === "stale" ? (
            <span className={styles.geoStatus} role="status" aria-live="polite">
              Transit data may be outdated (last updated{" "}
              {transitSource
                ? formatTransitLastUpdated(transitSource.lastUpdated)
                : "unknown"}
              ).
            </span>
          ) : null}
          {transitGeoState === "error" ? (
            <span className={styles.geoStatus} role="alert">
              Route overlay unavailable. Proximity results are still shown.
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
