"use client";

import type { ParkEvent } from "@/app/data/events";
import styles from "./SavedCalendar.module.css";

export type MonthKey = `${number}-${string}`;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function monthKeyOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function isMonthKey(value: string | null): value is string {
  return !!value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function shiftMonth(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const shifted = new Date(year, month - 1 + delta, 1);
  return monthKeyOf(shifted);
}

function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

function dayLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

type SavedCalendarProps = {
  events: ParkEvent[];
  monthKey: string;
  todayIso: string;
  selectedDay: string | null;
  onMonthChange: (monthKey: string) => void;
  onSelectDay: (isoDate: string) => void;
};

/**
 * Responsive month grid placing Saved Events on their event dates (#20).
 * Events without a stored start date are not placed — the list view still
 * shows them; the calendar never invents a date.
 */
export default function SavedCalendar({
  events,
  monthKey,
  todayIso,
  selectedDay,
  onMonthChange,
  onSelectDay,
}: SavedCalendarProps) {
  const [year, month] = monthKey.split("-").map(Number);
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const byDay = new Map<string, ParkEvent[]>();
  for (const event of events) {
    if (!event.startDate) continue;
    const list = byDay.get(event.startDate) ?? [];
    list.push(event);
    byDay.set(event.startDate, list);
  }

  const cells: Array<{ isoDate: string; day: number } | null> = [];
  for (let blank = 0; blank < firstWeekday; blank += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      isoDate: `${monthKey}-${String(day).padStart(2, "0")}`,
      day,
    });
  }

  return (
    <div className={styles.calendar} data-testid="saved-calendar">
      <div className={styles.header}>
        <h2 className={styles.monthTitle} aria-live="polite">
          {monthLabel(monthKey)}
        </h2>
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.control}
            onClick={() => onMonthChange(shiftMonth(monthKey, -1))}
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            type="button"
            className={styles.control}
            onClick={() => onMonthChange(todayIso.slice(0, 7))}
          >
            Today
          </button>
          <button
            type="button"
            className={styles.control}
            onClick={() => onMonthChange(shiftMonth(monthKey, 1))}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>
      <div className={styles.weekdays} aria-hidden="true">
        {WEEKDAYS.map((weekday) => (
          <span key={weekday} className={styles.weekday}>
            {weekday}
          </span>
        ))}
      </div>
      <div className={styles.grid}>
        {cells.map((cell, index) =>
          cell === null ? (
            <span key={`blank-${index}`} className={styles.blank} />
          ) : (
            <button
              key={cell.isoDate}
              type="button"
              className={[
                styles.day,
                cell.isoDate === todayIso ? styles.dayToday : "",
                cell.isoDate === selectedDay ? styles.daySelected : "",
                byDay.has(cell.isoDate) ? styles.dayHasEvents : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-pressed={cell.isoDate === selectedDay}
              aria-current={cell.isoDate === todayIso ? "date" : undefined}
              aria-label={`${dayLabel(cell.isoDate)}, ${
                byDay.get(cell.isoDate)?.length ?? 0
              } saved ${
                (byDay.get(cell.isoDate)?.length ?? 0) === 1
                  ? "event"
                  : "events"
              }`}
              onClick={() => onSelectDay(cell.isoDate)}
            >
              <span className={styles.dayNumber}>{cell.day}</span>
              {byDay.has(cell.isoDate) ? (
                <span className={styles.count}>
                  {byDay.get(cell.isoDate)!.length}
                </span>
              ) : null}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
