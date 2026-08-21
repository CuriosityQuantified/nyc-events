"use client";

import { useState } from "react";
import { getUpcomingDates } from "@/app/data/dates";
import styles from "./DateStrip.module.css";

interface DayInfo {
  dayName: string;
  dayNumber: number;
  dateStr: string;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function getNext7Days(): DayInfo[] {
  return getUpcomingDates(7).map((dateStr) => {
    const d = new Date(dateStr + "T00:00:00");
    return {
      dayName: DAY_NAMES[d.getDay()],
      dayNumber: d.getDate(),
      dateStr,
    };
  });
}

export default function DateStrip() {
  const days = getNext7Days();
  const [selected, setSelected] = useState(days[0].dateStr);

  return (
    <div
      className={styles.wrapper}
      data-testid="date-strip"
      role="group"
      aria-label="Select date"
    >
      <ul className={styles.list}>
        {days.map((day) => (
          <li key={day.dateStr}>
            <button
              className={`${styles.dayButton} ${selected === day.dateStr ? styles.dayButtonActive : ""}`}
              onClick={() => setSelected(day.dateStr)}
              aria-pressed={selected === day.dateStr}
              aria-label={`${day.dayName} ${day.dayNumber}`}
              type="button"
            >
              <span className={styles.dayName}>{day.dayName}</span>
              <span className={styles.dayNumber}>{day.dayNumber}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
