"use client";

import { useState } from "react";
import Header from "@/app/components/Header";
import SearchBar from "@/app/components/SearchBar";
import FilterChips from "@/app/components/FilterChips";
import DateStrip from "@/app/components/DateStrip";
import ListMapToggle from "@/app/components/ListMapToggle";
import type { View } from "@/app/components/ListMapToggle";
import EventCard from "@/app/components/EventCard";
import MapPlaceholder from "@/app/components/MapPlaceholder";
import BottomNav from "@/app/components/BottomNav";
import DesktopSidebar from "@/app/components/DesktopSidebar";
import { mockEvents } from "@/app/data/events";
import styles from "./page.module.css";

export default function Home() {
  const [view, setView] = useState<View>("list");

  return (
    <div className={styles.appLayout}>
      <DesktopSidebar />
      <div className={styles.mainArea}>
        <Header />
        <main className={styles.mainContent}>
          <SearchBar />
          <FilterChips />
          <DateStrip />
          <ListMapToggle activeView={view} onViewChange={setView} />
          {view === "list" ? (
            <section
              className={styles.eventList}
              data-testid="event-list"
              aria-label="Event listings"
            >
              {mockEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </section>
          ) : (
            <div className={styles.mapContainer}>
              <MapPlaceholder />
            </div>
          )}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
