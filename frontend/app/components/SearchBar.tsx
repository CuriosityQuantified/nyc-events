"use client";

import styles from "./SearchBar.module.css";

type SearchBarProps = {
  query: string;
  onChange: (query: string) => void;
};

export default function SearchBar({ query, onChange }: SearchBarProps) {
  return (
    <div className={styles.wrapper}>
      <label className={styles.searchField}>
        <span className={styles.searchIcon} aria-hidden="true">
          ⌕
        </span>
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
      </label>
    </div>
  );
}
