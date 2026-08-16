"use client";

import { useEffect, useRef } from "react";
import {
  EMPTY_FILTERS,
  FILTER_OPTIONS,
  hasActiveFilters,
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
    onChange({
      ...filters,
      [key]: filters[key] === value ? null : value,
    } as FilterState);
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
      </div>
    </section>
  );
}
