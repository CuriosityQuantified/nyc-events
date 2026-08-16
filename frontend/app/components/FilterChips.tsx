"use client";

import { useEffect, useRef } from "react";
import {
  EMPTY_FILTERS,
  FILTER_OPTIONS,
  hasActiveFilters,
  isValidIsoDate,
  type FilterKey,
  type FilterState,
} from "@/app/data/filters";
import styles from "./FilterChips.module.css";

type FilterChipsProps = {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
};

const GROUPS: Array<{
  key: FilterKey;
  label: string;
  options: ReadonlyArray<readonly [string, string]>;
}> = [
  { key: "borough", label: "Borough", options: FILTER_OPTIONS.borough },
  { key: "category", label: "Category", options: FILTER_OPTIONS.category },
  { key: "date", label: "Date range", options: FILTER_OPTIONS.date },
  {
    key: "registration",
    label: "Registration",
    options: FILTER_OPTIONS.registration,
  },
];

export default function FilterChips({ filters, onChange }: FilterChipsProps) {
  const wrapperRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const adjustments = Array.from(
      wrapperRef.current?.querySelectorAll<HTMLButtonElement>(
        'button[aria-pressed="true"]',
      ) ?? [],
    ).flatMap((button) => {
      const list = button.closest("ul");
      if (!list) return [];
      const listBox = list.getBoundingClientRect();
      const buttonBox = button.getBoundingClientRect();
      const left =
        list.scrollLeft +
        buttonBox.left -
        listBox.left -
        (listBox.width - buttonBox.width) / 2;
      return [{ list, left }];
    });
    for (const { list, left } of adjustments) list.scrollLeft = left;
  }, [filters]);

  function toggle(key: FilterKey, value: string) {
    const next = {
      ...filters,
      [key]: filters[key] === value ? null : value,
    } as FilterState;
    // A preset date range and exact dates would silently intersect; the
    // last choice wins instead.
    if (key === "date" && next.date) {
      next.dateFrom = null;
      next.dateTo = null;
    }
    onChange(next);
  }

  function setExactDate(bound: "dateFrom" | "dateTo", value: string) {
    onChange({
      ...filters,
      [bound]: value && isValidIsoDate(value) ? value : null,
      date: null,
    });
  }

  function toggleFreeOnly() {
    onChange({ ...filters, freeOnly: !filters.freeOnly });
  }

  return (
    <section
      ref={wrapperRef}
      className={styles.wrapper}
      data-testid="filter-chips"
      aria-labelledby="filters-title"
    >
      <div className={styles.headingRow}>
        <h2 id="filters-title">Filters</h2>
        {hasActiveFilters(filters) ? (
          <button
            className={styles.clearAll}
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            aria-label="Clear all filters"
          >
            Clear all
          </button>
        ) : null}
      </div>
      <div className={styles.groups}>
        {GROUPS.map((group) => (
          <fieldset className={styles.group} key={group.key}>
            <legend>{group.label}</legend>
            <ul className={styles.list}>
              {group.options.map(([value, label]) => {
                const active = filters[group.key] === value;
                return (
                  <li key={value}>
                    <button
                      className={`${styles.chip} ${active ? styles.chipActive : ""}`}
                      onClick={() => toggle(group.key, value)}
                      aria-label={`${active ? "Remove" : "Add"} ${group.label}: ${label}`}
                      aria-pressed={active}
                      type="button"
                    >
                      {label}
                      {active ? (
                        <span className={styles.remove} aria-hidden="true">
                          ×
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        ))}
        <fieldset className={styles.group}>
          <legend>Cost</legend>
          <ul className={styles.list}>
            <li>
              <button
                className={`${styles.chip} ${filters.freeOnly ? styles.chipActive : ""}`}
                onClick={toggleFreeOnly}
                aria-label={`${filters.freeOnly ? "Remove" : "Add"} Cost: Free events`}
                aria-pressed={filters.freeOnly}
                type="button"
              >
                Free events
                {filters.freeOnly ? (
                  <span className={styles.remove} aria-hidden="true">
                    ×
                  </span>
                ) : null}
              </button>
            </li>
          </ul>
        </fieldset>
        <fieldset className={styles.group}>
          <legend>Exact dates</legend>
          <div className={styles.dateInputs} data-testid="exact-date-filter">
            <label className={styles.dateLabel}>
              From
              <input
                type="date"
                className={styles.dateInput}
                autoComplete="off"
                value={filters.dateFrom ?? ""}
                max={filters.dateTo ?? undefined}
                onChange={(changeEvent) =>
                  setExactDate("dateFrom", changeEvent.target.value)
                }
              />
            </label>
            <label className={styles.dateLabel}>
              To
              <input
                type="date"
                className={styles.dateInput}
                autoComplete="off"
                value={filters.dateTo ?? ""}
                min={filters.dateFrom ?? undefined}
                onChange={(changeEvent) =>
                  setExactDate("dateTo", changeEvent.target.value)
                }
              />
            </label>
            {filters.dateFrom || filters.dateTo ? (
              <button
                type="button"
                className={styles.clearDates}
                onClick={() =>
                  onChange({ ...filters, dateFrom: null, dateTo: null })
                }
              >
                Clear dates
              </button>
            ) : null}
          </div>
        </fieldset>
      </div>
    </section>
  );
}
