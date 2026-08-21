"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import type {
  Map as MapLibreMap,
  Marker,
  StyleSpecification,
} from "maplibre-gl";
import type { View } from "@/app/components/ListMapToggle";
import { markerDiameter, type LocationGroup } from "@/app/data/maps";
import styles from "./EventMap.module.css";

function markerLabel(group: LocationGroup): string {
  const count = group.events.length;
  return `${group.name}, ${group.borough}: ${count} ${count === 1 ? "event" : "events"}`;
}

/** MapLibre uses [longitude, latitude] where the source data is [lat, lng]. */
const NYC_CENTER: [number, number] = [-74.006, 40.7128];
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/**
 * Street tiles come straight from OpenStreetMap, so the map keeps working
 * without any vendor key or account.
 */
const STREET_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: [TILE_URL],
      tileSize: 256,
      maxzoom: 19,
      attribution: TILE_ATTRIBUTION,
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

/**
 * Keeps every marker clear of the glass tiles floating over the map: the
 * control column and the selected-location card cover different parts of the
 * screen in each view, so the fit is computed per view and per breakpoint.
 */
function fitPadding(width: number, height: number, view: View) {
  const desktop = width >= 1024;
  const raw = desktop
    ? { top: 130, bottom: 80, left: 700, right: 450 }
    : view === "map"
      ? {
          top: Math.round(height * 0.32),
          bottom: Math.round(height * 0.5),
          left: 40,
          right: 40,
        }
      : {
          top: 96,
          bottom: Math.round(height * 0.66),
          left: 40,
          right: 40,
        };
  // Never ask MapLibre for more padding than the canvas can give.
  const vertical = Math.min(1, (height * 0.86) / (raw.top + raw.bottom));
  const horizontal = Math.min(1, (width * 0.86) / (raw.left + raw.right));
  return {
    top: Math.round(raw.top * vertical),
    bottom: Math.round(raw.bottom * vertical),
    left: Math.round(raw.left * horizontal),
    right: Math.round(raw.right * horizontal),
  };
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
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const selectRef = useRef(onSelectLocation);
  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const status = mapFailed
    ? "error"
    : groups.length === 0
      ? "error"
      : mapReady
        ? "ready"
        : "loading";

  useEffect(() => {
    selectRef.current = onSelectLocation;
  }, [onSelectLocation]);

  useEffect(() => {
    let disposed = false;
    (async () => {
      const maplibre = (await import("maplibre-gl")).default;
      if (disposed || !mapContainer.current || mapRef.current) return;
      try {
        const map = new maplibre.Map({
          container: mapContainer.current,
          style: STREET_STYLE,
          center: NYC_CENTER,
          zoom: 10.6,
          maxZoom: 18,
          minZoom: 9,
          attributionControl: false,
          // A map that also rotates makes an events list harder to scan;
          // pan and zoom are the gestures this product needs.
          dragRotate: false,
          pitchWithRotate: false,
          touchPitch: false,
          fadeDuration: 0,
        });
        map.touchZoomRotate.disableRotation();
        map.on("load", () => {
          if (!disposed) setMapReady(true);
        });
        mapRef.current = map;
      } catch {
        // No WebGL available: the location panel below still lists every
        // filtered event, so the page stays usable.
        if (!disposed) setMapFailed(true);
      }
    })();
    return () => {
      disposed = true;
      for (const marker of markersRef.current) marker.remove();
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    let disposed = false;
    (async () => {
      const maplibre = (await import("maplibre-gl")).default;
      const map = mapRef.current;
      if (disposed || !map) return;

      for (const marker of markersRef.current) marker.remove();
      markersRef.current = groups.map((group) => {
        const diameter = markerDiameter(group.events.length);
        const target = document.createElement("button");
        target.type = "button";
        target.className = styles.markerTarget;
        target.dataset.testid = "map-marker";
        target.dataset.locationKey = group.key;
        target.dataset.diameter = String(diameter);
        target.setAttribute("aria-label", markerLabel(group));
        const dot = document.createElement("span");
        dot.className = styles.markerDot;
        dot.setAttribute("aria-hidden", "true");
        dot.style.setProperty("--marker-diameter", `${diameter}px`);
        dot.textContent = String(group.events.length);
        target.append(dot);
        target.addEventListener("click", () => selectRef.current(group.key));
        return new maplibre.Marker({ element: target, anchor: "center" })
          .setLngLat([group.longitude, group.latitude])
          .addTo(map);
      });

      if (groups.length > 0) {
        const bounds = new maplibre.LngLatBounds();
        for (const group of groups) {
          bounds.extend([group.longitude, group.latitude]);
        }
        const canvas = map.getContainer();
        map.fitBounds(bounds, {
          padding: fitPadding(canvas.clientWidth, canvas.clientHeight, view),
          maxZoom: 15,
          animate: false,
        });
      }
    })();
    return () => {
      disposed = true;
    };
  }, [groups, mapReady, view]);

  useEffect(() => {
    for (const marker of markersRef.current) {
      const element = marker.getElement();
      element.dataset.selected = String(
        element.dataset.locationKey === selectedKey,
      );
    }
  }, [selectedKey, groups, mapReady]);

  function changeZoom(amount: 1 | -1) {
    if (amount > 0) mapRef.current?.zoomIn();
    else mapRef.current?.zoomOut();
  }

  return (
    <section
      className={styles.layer}
      data-testid="event-map"
      data-map-status={status}
      aria-label="Map of filtered events"
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
          aria-label="Zoom in"
        >
          <span aria-hidden="true">+</span>
        </button>
        <button
          type="button"
          onClick={() => changeZoom(-1)}
          aria-label="Zoom out"
        >
          <span aria-hidden="true">−</span>
        </button>
      </div>
      <p className={styles.attribution}>
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
        >
          © OpenStreetMap
        </a>{" "}
        contributors
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
