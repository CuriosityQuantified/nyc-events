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
import type { SubwayRouteData, SubwayStopData } from "@/app/data/subway";
import styles from "./EventMap.module.css";

function markerLabel(group: LocationGroup): string {
  const count = group.events.length;
  return `${group.name}, ${group.borough}: ${count} ${count === 1 ? "event" : "events"}`;
}

type RouteOverlay = {
  routeData: SubwayRouteData;
  stops: Record<string, SubwayStopData>;
  lineColor: string;
};

type EventMapProps = {
  groups: LocationGroup[];
  selectedKey: string;
  view: View;
  onSelectLocation: (key: string) => void;
  routeOverlay?: RouteOverlay | null;
  selectedStopId?: string | null;
  onSelectStop?: (stopId: string | null) => void;
};

export default function EventMap({
  groups,
  selectedKey,
  view,
  onSelectLocation,
  routeOverlay,
  selectedStopId,
  onSelectStop,
}: EventMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<import("leaflet").Marker[]>([]);
  const tilesRef = useRef<import("leaflet").TileLayer | null>(null);
  const routeLayerRef = useRef<import("leaflet").GeoJSON | null>(null);
  const stopMarkersRef = useRef<
    Array<{ marker: import("leaflet").Marker; stopId: string }>
  >([]);
  const selectRef = useRef(onSelectLocation);
  const selectStopRef = useRef(onSelectStop);

  function clearRouteOverlay() {
    routeLayerRef.current?.remove();
    routeLayerRef.current = null;
    stopMarkersRef.current.forEach((entry) => entry.marker.remove());
    stopMarkersRef.current = [];
  }
  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const hasGroups = groups.length > 0;
  const hasMapContent = hasGroups || Boolean(routeOverlay);
  const controlsDisabled = mapFailed || !mapReady || !hasMapContent;
  let status = "loading";
  if (mapFailed || !hasMapContent) status = "error";
  else if (mapReady) status = "ready";

  useEffect(() => {
    selectRef.current = onSelectLocation;
  }, [onSelectLocation]);

  useEffect(() => {
    selectStopRef.current = onSelectStop;
  }, [onSelectStop]);

  useEffect(() => {
    if (!hasMapContent) return;
    let disposed = false;
    void import("leaflet")
      .then((leaflet) => {
        if (disposed || !mapContainer.current || mapRef.current) return;
        leafletRef.current = leaflet;
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
      clearRouteOverlay();
      tilesRef.current?.remove();
      tilesRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [hasMapContent]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !leafletRef.current) return;
    const leaflet = leafletRef.current;
    const map = mapRef.current;
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
  }, [groups, mapReady, selectedKey, view]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !leafletRef.current) return;

    clearRouteOverlay();

    if (!routeOverlay) return;

    const leaflet = leafletRef.current;
    const map = mapRef.current;

    if (!map.getPane("routeOverlay")) {
      const pane = map.createPane("routeOverlay");
      pane.style.zIndex = "350";
      pane.style.pointerEvents = "none";
    }
    if (!map.getPane("stopOverlay")) {
      const pane = map.createPane("stopOverlay");
      pane.style.zIndex = "360";
    }

    const geojson = leaflet.geoJSON(
      {
        type: "Feature",
        geometry: routeOverlay.routeData.geometry,
        properties: {},
      } as GeoJSON.Feature,
      {
        pane: "routeOverlay",
        style: {
          color: `#${routeOverlay.lineColor}`,
          weight: 4,
          opacity: 0.6,
          dashArray: "8 4",
        },
      },
    );
    geojson.addTo(map);
    routeLayerRef.current = geojson;

    const routeBounds = geojson.getBounds();
    if (routeBounds.isValid()) {
      map.invalidateSize(false);
      map.fitBounds(routeBounds, {
        padding: [48, 48],
        maxZoom: 13,
        animate: false,
      });
    }

    const stopIds = routeOverlay.routeData.stopIds;
    const newStopMarkers: Array<{
      marker: import("leaflet").Marker;
      stopId: string;
    }> = [];
    for (const stopId of stopIds) {
      const stop = routeOverlay.stops[stopId];
      if (!stop) continue;
      const isSelected = stopId === selectedStopId;
      const stopLabel = `${stop.name} station${isSelected ? ", selected" : ""}`;
      const icon = leaflet.divIcon({
        className: styles.stopTarget,
        html: `<span class="${styles.stopDot}${isSelected ? ` ${styles.stopDotSelected}` : ""}" style="--stop-color:#${routeOverlay.lineColor}" aria-hidden="true"></span>`,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });
      const marker = leaflet.marker([stop.lat, stop.lng], {
        pane: "stopOverlay",
        icon,
        keyboard: true,
        title: stop.name,
        alt: stop.name,
      });
      marker.on("add", () => {
        const element = marker.getElement();
        if (!element) return;
        element.dataset.testid = "stop-marker";
        element.dataset.stopId = stopId;
        element.dataset.selected = String(isSelected);
        element.setAttribute("role", "button");
        element.setAttribute("aria-label", stopLabel);
        element.setAttribute("aria-pressed", String(isSelected));
        element.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          selectStopRef.current?.(isSelected ? null : stopId);
        });
      });
      marker.on("click", () => {
        selectStopRef.current?.(isSelected ? null : stopId);
      });
      marker.addTo(map);
      newStopMarkers.push({ marker, stopId });
    }
    stopMarkersRef.current = newStopMarkers;

    return () => {
      clearRouteOverlay();
    };
  }, [mapReady, routeOverlay, selectedStopId]);

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
