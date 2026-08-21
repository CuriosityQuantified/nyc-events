"use client";

import styles from "./SearchBar.module.css";

type SearchBarProps = {
  query: string;
  onChange: (query: string) => void;
};

export default function SearchBar({ query, onChange }: SearchBarProps) {
  return (
    <div className={styles.wrapper}>
      <label className={`${styles.searchField} glass-pill`}>
        <svg
          className={styles.searchIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
          focusable="false"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.6-3.6" />
        </svg>
        <input
          type="search"
          name="event-search"
          autoComplete="off"
          className={styles.input}
          placeholder="Search parks and events…"
          aria-label="Search parks and events"
          data-testid="search-bar"
          value={query}
          onChange={(event) => onChange(event.target.value)}
        />
        {query ? (
          <button
            type="button"
            className={styles.clear}
            aria-label="Clear search"
            onClick={() => onChange("")}
          >
            <span aria-hidden="true">×</span>
          </button>
        ) : null}
      </label>
    </div>
  );
}
