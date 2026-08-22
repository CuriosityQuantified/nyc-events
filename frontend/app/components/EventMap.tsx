"use client";

import { useEffect, useRef, useState } from "react";
import type { View } from "@/app/components/ListMapToggle";
import {
  markerDiameter,
  OSM_ATTRIBUTION,
  OSM_ATTRIBUTION_URL,
  OSM_MAX_ZOOM,
  OSM_MIN_ZOOM,
  OSM_TILE_URL,
  type LocationGroup,
} from "@/app/data/maps";
import styles from "./EventMap.module.css";

function markerLabel(group: LocationGroup): string {
  const count = group.events.length;
  return `${group.name}, ${group.borough}: ${count} ${count === 1 ? "event" : "events"}`;
}

type EventMapProps = {
  groups: LocationGroup[];
  selectedKey: string;
  view: View;
  onSelectLocation: (key: string) => void;
};

export default function EventMap({
  groups,
  selectedKey,
  view,
  onSelectLocation,
}: EventMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<import("leaflet").Marker[]>([]);
  const tilesRef = useRef<import("leaflet").TileLayer | null>(null);
  const selectRef = useRef(onSelectLocation);
  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const hasGroups = groups.length > 0;
  const controlsDisabled = mapFailed || !mapReady || !hasGroups;
  let status = "loading";
  if (mapFailed || !hasGroups) status = "error";
  else if (mapReady) status = "ready";

  useEffect(() => {
    selectRef.current = onSelectLocation;
  }, [onSelectLocation]);

  useEffect(() => {
    if (!hasGroups) return;
    let disposed = false;
    void import("leaflet")
      .then((leaflet) => {
        if (disposed || !mapContainer.current || mapRef.current) return;
        setMapFailed(false);
        setMapReady(false);
        const map = leaflet.map(mapContainer.current, {
          center: [40.7128, -74.006],
          zoom: 11,
          minZoom: OSM_MIN_ZOOM,
          maxZoom: OSM_MAX_ZOOM,
          attributionControl: false,
          zoomControl: false,
        });
        const tiles = leaflet.tileLayer(OSM_TILE_URL, {
          minZoom: OSM_MIN_ZOOM,
          maxZoom: OSM_MAX_ZOOM,
          attribution: OSM_ATTRIBUTION,
        });
        tiles.once("tileerror", () => {
          if (disposed || tilesRef.current !== tiles) return;
          tiles.remove();
          tilesRef.current = null;
          setMapFailed(true);
        });
        mapRef.current = map;
        tilesRef.current = tiles;
        tiles.addTo(map);
        map.whenReady(() => {
          if (!disposed) setMapReady(true);
        });
      })
      .catch(() => {
        if (!disposed) setMapFailed(true);
      });
    return () => {
      disposed = true;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      tilesRef.current?.remove();
      tilesRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [hasGroups]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    let disposed = false;
    void import("leaflet").then((leaflet) => {
      const map = mapRef.current;
      if (disposed || !map) return;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = groups.map((group) => {
        const diameter = markerDiameter(group.events.length);
        const selected = group.key === selectedKey;
        const label = markerLabel(group);
        const icon = leaflet.divIcon({
          className: `${styles.markerTarget}${selected ? ` ${styles.markerSelected}` : ""}`,
          html: `<span class="${styles.markerDot}" style="--marker-diameter:${diameter}px" aria-hidden="true">${group.events.length}</span>`,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });
        const marker = leaflet.marker([group.latitude, group.longitude], {
          icon,
          keyboard: true,
          title: label,
          alt: label,
        });
        marker.on("add", () => {
          const element = marker.getElement();
          if (!element) return;
          element.dataset.testid = "map-marker";
          element.dataset.locationKey = group.key;
          element.dataset.diameter = String(diameter);
          element.dataset.selected = String(selected);
          element.setAttribute("role", "button");
          element.setAttribute("aria-label", label);
          element.setAttribute("aria-pressed", String(selected));
          element.addEventListener("keydown", (event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            selectRef.current(group.key);
          });
        });
        marker.on("click", () => selectRef.current(group.key));
        return marker.addTo(map);
      });

      if (groups.length > 0) {
        const bounds = leaflet.latLngBounds(
          groups.map((group) => [group.latitude, group.longitude]),
        );
        map.invalidateSize(false);
        map.fitBounds(bounds, {
          paddingTopLeft: view === "map" ? [48, 160] : [48, 96],
          paddingBottomRight: [48, view === "map" ? 300 : 180],
          maxZoom: 15,
          animate: false,
        });
      }
    });
    return () => {
      disposed = true;
    };
  }, [groups, mapReady, selectedKey, view]);

  function changeZoom(amount: 1 | -1) {
    if (controlsDisabled) return;
    if (amount > 0) mapRef.current?.zoomIn();
    else mapRef.current?.zoomOut();
  }

  return (
    <section
      className={styles.layer}
      data-testid="event-map"
      data-map-status={status}
      aria-label="Interactive OpenStreetMap of filtered event locations"
    >
      <div
        ref={mapContainer}
        className={styles.canvas}
        data-testid="coordinate-map"
        data-fit-bounds="true"
        role="group"
        aria-label="Street map of event locations. Select a marker for event links."
      />
      <div className={styles.veil} aria-hidden="true" />
      <div
        className={`${styles.zoomControls} glass`}
        aria-label="Map zoom controls"
      >
        <button
          type="button"
          onClick={() => changeZoom(1)}
          disabled={controlsDisabled}
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => changeZoom(-1)}
          disabled={controlsDisabled}
          aria-label="Zoom out"
        >
          −
        </button>
      </div>
      <p className={styles.attribution}>
        <a href={OSM_ATTRIBUTION_URL} target="_blank" rel="noopener noreferrer">
          {OSM_ATTRIBUTION}
        </a>
      </p>
      {status === "error" ? (
        <div className={`${styles.mapState} glass-strong`} role="status">
          <strong>
            {mapFailed
              ? "The street map is unavailable"
              : "No locations to map"}
          </strong>
          <span>
            Every filtered event stays reachable in the list beside the map.
          </span>
        </div>
      ) : null}
    </section>
  );
}
