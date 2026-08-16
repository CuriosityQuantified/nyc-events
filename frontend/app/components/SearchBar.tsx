import styles from "./SearchBar.module.css";

export default function SearchBar() {
  return (
    <div className={styles.wrapper}>
      <input
        type="search"
        name="event-search"
        autoComplete="off"
        className={styles.input}
        placeholder="Search parks and events…"
        aria-label="Search parks and events"
        data-testid="search-bar"
      />
    </div>
  );
}
