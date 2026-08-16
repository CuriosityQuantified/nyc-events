"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ParkEvent } from "@/app/data/events";
import {
  groupEventsByLocation,
  markerDiameter,
  type LocationGroup,
} from "@/app/data/maps";
import styles from "./EventMap.module.css";

type MapListener = { remove(): void };
type MapInstance = {
  setCenter(position: { lat: number; lng: number }): void;
  addListener(event: string, callback: () => void): MapListener;
};
type MarkerInstance = { map: MapInstance | null };
type GoogleMapsApi = {
  Map: new (
    element: HTMLElement,
    options: Record<string, unknown>,
  ) => MapInstance;
  marker: {
    AdvancedMarkerElement: new (options: {
      map: MapInstance;
      position: { lat: number; lng: number };
      content: HTMLElement;
      title: string;
    }) => MarkerInstance;
  };
};
type GoogleNamespace = { maps: GoogleMapsApi };

let googleMapsPromise: Promise<GoogleNamespace> | null = null;

function currentGoogle(): GoogleNamespace | undefined {
  return (window as unknown as { google?: GoogleNamespace }).google;
}

function loadGoogleMaps(): Promise<GoogleNamespace> {
  const existing = currentGoogle();
  if (existing?.maps?.marker?.AdvancedMarkerElement) {
    return Promise.resolve(existing);
  }
  if (googleMapsPromise) return googleMapsPromise;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY;
  if (!apiKey) {
    googleMapsPromise = Promise.reject(
      new Error("Google Maps browser configuration is unavailable"),
    );
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const params = new URLSearchParams({
      key: apiKey,
      libraries: "marker",
      loading: "async",
      v: "weekly",
    });
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.referrerPolicy = "strict-origin-when-cross-origin";
    script.dataset.eventMatchMaps = "true";
    script.onload = () => {
      const loaded = currentGoogle();
      if (loaded?.maps?.marker?.AdvancedMarkerElement) resolve(loaded);
      else
        reject(new Error("Google Maps did not provide AdvancedMarkerElement"));
    };
    script.onerror = () => reject(new Error("Google Maps could not load"));
    document.head.append(script);
  });
  return googleMapsPromise;
}

function markerLabel(group: LocationGroup): string {
  const count = group.events.length;
  return `${group.name}, ${group.borough}: ${count} ${count === 1 ? "event" : "events"}`;
}

type EventMapProps = {
  events: ParkEvent[];
  returnQuery?: string;
};

export default function EventMap({ events, returnQuery = "" }: EventMapProps) {
  const groups = useMemo(() => groupEventsByLocation(events), [events]);
  const unlocated = useMemo(
    () =>
      events.filter(
        (event) => !groups.some((group) => group.events.includes(event)),
      ),
    [events, groups],
  );
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    groups.length ? "loading" : "error",
  );
  const [selectedKey, setSelectedKey] = useState(groups[0]?.key ?? "");
  const [panned, setPanned] = useState(false);
  const [areaMessage, setAreaMessage] = useState("");
  const mapElement = useRef<HTMLDivElement>(null);
  const detailPanel = useRef<HTMLElement>(null);
  const selected =
    groups.find((group) => group.key === selectedKey) ?? groups[0] ?? null;

  useEffect(() => {
    if (!groups.length || !mapElement.current) return;
    let active = true;
    let markers: MarkerInstance[] = [];
    let panListener: MapListener | null = null;

    void loadGoogleMaps()
      .then((google) => {
        if (!active || !mapElement.current) return;
        const center = {
          lat: groups[0].latitude,
          lng: groups[0].longitude,
        };
        const map = new google.maps.Map(mapElement.current, {
          center,
          zoom: 11,
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID,
          clickableIcons: false,
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
        });
        let firstIdle = true;
        panListener = map.addListener("idle", () => {
          if (firstIdle) {
            firstIdle = false;
            return;
          }
          setPanned(true);
        });
        markers = groups.map((group) => {
          const diameter = markerDiameter(group.events.length);
          const target = document.createElement("button");
          target.type = "button";
          target.className = styles.markerTarget;
          target.dataset.testid = "map-marker";
          target.dataset.locationKey = group.key;
          target.dataset.diameter = String(diameter);
          target.setAttribute("aria-label", markerLabel(group));
          target.style.setProperty("--marker-diameter", `${diameter}px`);
          const dot = document.createElement("span");
          dot.className = styles.markerDot;
          dot.setAttribute("aria-hidden", "true");
          dot.textContent =
            group.events.length > 1 ? String(group.events.length) : "";
          target.append(dot);
          const select = () => {
            setSelectedKey(group.key);
            map.setCenter({ lat: group.latitude, lng: group.longitude });
            queueMicrotask(() =>
              detailPanel.current?.scrollIntoView({ block: "nearest" }),
            );
          };
          target.addEventListener("click", select);
          target.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              select();
            }
          });
          return new google.maps.marker.AdvancedMarkerElement({
            map,
            position: { lat: group.latitude, lng: group.longitude },
            content: target,
            title: markerLabel(group),
          });
        });
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });

    return () => {
      active = false;
      panListener?.remove();
      for (const marker of markers) marker.map = null;
    };
  }, [groups]);

  function detailHref(event: ParkEvent): string {
    return `/events/${encodeURIComponent(event.guid)}${returnQuery ? `?${returnQuery}` : ""}`;
  }

  return (
    <section
      className={styles.shell}
      data-testid="event-map"
      data-map-status={status}
      aria-label="Map of filtered events"
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
        {panned ? (
          <button
            className={styles.searchArea}
            type="button"
            onClick={() => {
              setPanned(false);
              setAreaMessage(
                "Map area updated. Existing filters are unchanged.",
              );
            }}
          >
            Search This Area
          </button>
        ) : null}
        <p className="sr-only" aria-live="polite">
          {areaMessage}
        </p>
        <div
          ref={mapElement}
          className={styles.canvas}
          data-testid="google-map"
        />
        {status === "loading" ? (
          <p className={styles.mapState} role="status">
            Map Is Loading…
          </p>
        ) : null}
        {status === "error" ? (
          <div className={styles.mapState} role="alert">
            <strong>Map Could Not Load</strong>
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
