import styles from "./Header.module.css";

/**
 * The floating top tile. Account controls live only in the canonical Profile
 * destination, so the header remains a brand and source-trust surface.
 */
export default function Header() {
  return (
    <header className={`${styles.header} glass-pill`} data-testid="header">
      <div className={styles.brand} data-testid="header-brand">
        <span className={styles.logo} aria-hidden="true">
          EM
        </span>
        <h1 className={styles.title}>
          Event<span className={styles.titleAccent}>Match</span>{" "}
          <span>NYC</span>
        </h1>
      </div>
      <p className={styles.tagline}>Official NYC Parks events, mapped live</p>
    </header>
  );
}
