"use client";

import "leaflet/dist/leaflet.css";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
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

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const NYC_CENTER: [number, number] = [40.7128, -74.006];
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

type EventMapProps = {
  events: ParkEvent[];
  returnQuery?: string;
};

export default function EventMap({ events, returnQuery = "" }: EventMapProps) {
  const groups = useMemo(() => groupEventsByLocation(events), [events]);
  const unlocated = useMemo(() => {
    const locatedGuids = new Set(
      groups.flatMap((group) => group.events.map((event) => event.guid)),
    );
    return events.filter((event) => !locatedGuids.has(event.guid));
  }, [events, groups]);
  const [selectedKey, setSelectedKey] = useState(groups[0]?.key ?? "");
  const [mapReady, setMapReady] = useState(false);
  const detailPanel = useRef<HTMLElement>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<LeafletMap | null>(null);
  const markerLayer = useRef<LayerGroup | null>(null);
  const selected =
    groups.find((group) => group.key === selectedKey) ?? groups[0] ?? null;
  const status = groups.length === 0 ? "error" : mapReady ? "ready" : "loading";

  useEffect(() => {
    let disposed = false;
    (async () => {
      const leaflet = (await import("leaflet")).default;
      if (disposed || !mapContainer.current || leafletMap.current) return;
      const map = leaflet.map(mapContainer.current, {
        center: NYC_CENTER,
        zoom: 11,
        zoomControl: true,
        scrollWheelZoom: true,
        zoomAnimation: false,
        fadeAnimation: false,
        markerZoomAnimation: false,
      });
      leaflet
        .tileLayer(TILE_URL, { maxZoom: 19, attribution: TILE_ATTRIBUTION })
        .addTo(map);
      leafletMap.current = map;
      setMapReady(true);
    })();
    return () => {
      disposed = true;
      leafletMap.current?.remove();
      leafletMap.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    let disposed = false;
    (async () => {
      const leaflet = (await import("leaflet")).default;
      const map = leafletMap.current;
      if (disposed || !map) return;
      markerLayer.current?.remove();
      const layer = leaflet.layerGroup();
      for (const group of groups) {
        const diameter = markerDiameter(group.events.length);
        const icon = leaflet.divIcon({
          className: styles.markerWrapper,
          html:
            `<button type="button" class="${styles.markerTarget}" ` +
            `data-testid="map-marker" ` +
            `data-location-key="${escapeAttribute(group.key)}" ` +
            `data-diameter="${diameter}" ` +
            `aria-label="${escapeAttribute(markerLabel(group))}">` +
            `<span class="${styles.markerDot}" aria-hidden="true" ` +
            `style="--marker-diameter:${diameter}px">` +
            `${group.events.length}</span></button>`,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });
        leaflet
          .marker([group.latitude, group.longitude], {
            icon,
            interactive: false,
            keyboard: false,
          })
          .addTo(layer);
      }
      layer.addTo(map);
      markerLayer.current = layer;
      if (groups.length > 0) {
        map.fitBounds(
          leaflet.latLngBounds(
            groups.map((group) => [group.latitude, group.longitude]),
          ),
          { padding: [48, 48], maxZoom: 15, animate: false },
        );
      }
    })();
    return () => {
      disposed = true;
    };
  }, [groups, mapReady]);

  function selectFromMarker(target: EventTarget): boolean {
    const button = (target as HTMLElement).closest?.(
      '[data-testid="map-marker"]',
    );
    const key = button?.getAttribute("data-location-key");
    if (!key) return false;
    setSelectedKey(key);
    queueMicrotask(() =>
      detailPanel.current?.scrollIntoView({ block: "nearest" }),
    );
    return true;
  }

  function onCanvasClick(clickEvent: MouseEvent<HTMLDivElement>) {
    selectFromMarker(clickEvent.target);
  }

  function onCanvasKeyDown(keyEvent: KeyboardEvent<HTMLDivElement>) {
    if (keyEvent.key !== "Enter" && keyEvent.key !== " ") return;
    if (selectFromMarker(keyEvent.target)) keyEvent.preventDefault();
  }

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
        <div
          ref={mapContainer}
          className={styles.canvas}
          data-testid="coordinate-map"
          data-fit-bounds="true"
          role="group"
          aria-label="Street map of event locations. Select a marker for event links."
          onClick={onCanvasClick}
          onKeyDown={onCanvasKeyDown}
        />
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
