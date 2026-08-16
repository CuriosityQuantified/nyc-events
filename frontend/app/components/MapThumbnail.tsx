"use client";

import { useEffect, useRef, useState } from "react";
import type { ParkEvent } from "@/app/data/events";
import {
  googleMapsDirectionsUrl,
  thumbnailPath,
  validEventCoordinates,
} from "@/app/data/maps";
import styles from "./MapThumbnail.module.css";

type MapThumbnailProps = {
  event: ParkEvent;
  variant: "compact" | "detail";
  coordinateIndex?: number;
};

export default function MapThumbnail({
  event,
  variant,
  coordinateIndex = 0,
}: MapThumbnailProps) {
  const frame = useRef<HTMLElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const coordinates = validEventCoordinates(event);
  const coordinate = coordinates[coordinateIndex];
  const src = thumbnailPath(event, variant, coordinateIndex);
  const unavailable = !coordinate || !src || failed;
  const directionsUrl = coordinate
    ? googleMapsDirectionsUrl(coordinate)
    : undefined;
  const accuracy =
    event.positionAccuracy === "exact"
      ? "Exact source location"
      : event.positionAccuracy === "approximate"
        ? "Approximate location"
        : "Location unavailable";

  useEffect(() => {
    if (!coordinate || !src) return;
    const requestUrl = src;

    let active = true;
    let objectUrl: string | null = null;
    let observer: IntersectionObserver | null = null;

    async function load(): Promise<void> {
      try {
        const response = await fetch(requestUrl, { cache: "no-store" });
        if (!response.ok) throw new Error("Map image is unavailable");
        const blob = await response.blob();
        if (!blob.type.startsWith("image/")) {
          throw new Error("Map image response is invalid");
        }
        objectUrl = URL.createObjectURL(blob);
        if (active) setImageUrl(objectUrl);
      } catch {
        if (active) setFailed(true);
      }
    }

    if (typeof IntersectionObserver === "undefined") {
      void load();
    } else if (frame.current) {
      observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          observer?.disconnect();
          observer = null;
          void load();
        },
        { rootMargin: "800px 0px" },
      );
      observer.observe(frame.current);
    }

    return () => {
      active = false;
      observer?.disconnect();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [coordinate, src]);

  if (unavailable) {
    return (
      <section
        className={`${styles.frame} ${styles[variant]} ${styles.fallback}`}
        data-testid="map-thumbnail-fallback"
        aria-label={`Map location unavailable for ${event.title}`}
      >
        <strong>Map Image Unavailable</strong>
        <span>
          {event.location || "Location not listed"}, {event.borough}. Use the
          location facts in this card.
        </span>
        {failed && directionsUrl ? (
          <a
            className={styles.fallbackLink}
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open location in Google Maps
          </a>
        ) : null}
      </section>
    );
  }

  const width = 640;
  const height = variant === "compact" ? 360 : 400;

  return (
    <figure
      ref={frame}
      className={`${styles.frame} ${styles[variant]}`}
      data-testid="map-thumbnail"
      data-map-variant={variant}
    >
      {imageUrl ? (
        <a
          className={styles.handoff}
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${event.location} for ${event.title} in Google Maps (opens in a new tab)`}
        >
          {/* The server endpoint supplies the exact Google image bytes. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.image}
            src={imageUrl}
            width={width}
            height={height}
            sizes={
              variant === "compact"
                ? "(max-width: 599px) 100vw, 640px"
                : "(max-width: 780px) 100vw, 720px"
            }
            loading="lazy"
            alt={`Google map showing ${event.location}, ${event.borough}`}
            onError={() => setFailed(true)}
          />
        </a>
      ) : (
        <p className={styles.loading} role="status">
          Map Image Is Loading…
        </p>
      )}
      <figcaption className={styles.caption}>
        <span>{accuracy}</span>
        <span>Open Location</span>
      </figcaption>
    </figure>
  );
}
