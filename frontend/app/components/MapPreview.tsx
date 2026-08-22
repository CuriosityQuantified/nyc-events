"use client";

import { useEffect, useRef, useState } from "react";
import type { ParkEvent } from "@/app/data/events";
import {
  osmMarkerUrl,
  OSM_ATTRIBUTION,
  OSM_ATTRIBUTION_URL,
  OSM_MAX_ZOOM,
  OSM_MIN_ZOOM,
  OSM_PREVIEW_ZOOM,
  OSM_TILE_URL,
  validEventCoordinates,
} from "@/app/data/maps";
import styles from "./MapPreview.module.css";

type MapPreviewProps = {
  event: ParkEvent;
  variant: "compact" | "expanded" | "detail";
  coordinateIndex?: number;
};

export default function MapPreview({
  event,
  variant,
  coordinateIndex = 0,
}: MapPreviewProps) {
  const mapNode = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const coordinate = validEventCoordinates(event)[coordinateIndex];
  const [nearViewport, setNearViewport] = useState(false);
  const [status, setStatus] = useState<
    "waiting" | "loading" | "ready" | "error"
  >(coordinate ? "waiting" : "error");

  useEffect(() => {
    if (!coordinate || !frame.current) return;
    if (typeof IntersectionObserver === "undefined") {
      queueMicrotask(() => setNearViewport(true));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        setNearViewport(true);
      },
      { rootMargin: "240px 0px" },
    );
    observer.observe(frame.current);
    return () => observer.disconnect();
  }, [coordinate]);

  useEffect(() => {
    const element = frame.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      mapRef.current?.invalidateSize(false);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [coordinate]);

  useEffect(() => {
    mapRef.current?.invalidateSize(false);
  }, [variant]);

  useEffect(() => {
    if (!coordinate || !nearViewport || !mapNode.current) return;
    let disposed = false;
    let map: import("leaflet").Map | null = null;
    setStatus("loading");

    void import("leaflet")
      .then((leaflet) => {
        if (disposed || !mapNode.current) return;
        map = leaflet.map(mapNode.current, {
          attributionControl: false,
          boxZoom: false,
          doubleClickZoom: false,
          dragging: false,
          keyboard: false,
          scrollWheelZoom: false,
          touchZoom: false,
          zoomControl: false,
          minZoom: OSM_MIN_ZOOM,
          maxZoom: OSM_MAX_ZOOM,
        });
        mapRef.current = map;
        map.setView(
          [coordinate.latitude, coordinate.longitude],
          OSM_PREVIEW_ZOOM,
        );
        const tiles = leaflet.tileLayer(OSM_TILE_URL, {
          minZoom: OSM_MIN_ZOOM,
          maxZoom: OSM_MAX_ZOOM,
          attribution: OSM_ATTRIBUTION,
        });
        tiles.once("tileerror", () => {
          if (disposed) return;
          setStatus("error");
          map?.remove();
          mapRef.current = null;
          map = null;
        });
        tiles.once("load", () => {
          if (!disposed) setStatus("ready");
        });
        tiles.addTo(map);
        leaflet
          .circleMarker([coordinate.latitude, coordinate.longitude], {
            radius: 7,
            color: "#fff",
            weight: 3,
            fillColor: "#087f5b",
            fillOpacity: 1,
            interactive: false,
          })
          .addTo(map);
      })
      .catch(() => {
        if (!disposed) setStatus("error");
      });

    return () => {
      disposed = true;
      map?.remove();
      mapRef.current = null;
    };
  }, [coordinate, nearViewport]);

  const location = event.location || "Location not listed";
  const unavailable = !coordinate;
  const markerUrl = coordinate ? osmMarkerUrl(coordinate) : undefined;
  const accessibleName = `${location}, ${event.borough} map preview for ${event.title}`;

  return (
    <section
      ref={frame}
      className={`${styles.frame} ${styles[variant]}`}
      data-testid={unavailable ? "map-preview-fallback" : "map-preview"}
      data-map-variant={variant}
      data-map-status={unavailable ? "unavailable" : status}
      aria-label={accessibleName}
    >
      {!unavailable && status !== "error" ? (
        <div
          ref={mapNode}
          className={styles.map}
          data-testid="map-preview-canvas"
          aria-hidden="true"
        />
      ) : null}
      {unavailable || status === "error" ? (
        <div className={styles.fallback} role="status">
          <strong>Map preview unavailable</strong>
          <span>
            {unavailable
              ? "Location coordinates are missing or invalid."
              : "Map tiles could not load."}{" "}
            {location}, {event.borough}. No event content is hidden.
          </span>
        </div>
      ) : null}
      {!unavailable && status !== "ready" && status !== "error" ? (
        <p className={styles.loading} role="status">
          {status === "waiting"
            ? "Map preview waiting"
            : "Loading map preview…"}
        </p>
      ) : null}
      {markerUrl ? (
        <a
          className={styles.openMap}
          href={markerUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${location} marker for ${event.title} in OpenStreetMap (opens in a new tab)`}
        >
          Open map
        </a>
      ) : null}
      <a
        className={styles.attribution}
        href={OSM_ATTRIBUTION_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        {OSM_ATTRIBUTION}
      </a>
    </section>
  );
}
