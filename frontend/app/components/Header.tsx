import HeaderAuth from "./HeaderAuth";
import { clerkPublishableKey } from "@/app/data/clerk";
import styles from "./Header.module.css";

/**
 * The floating top tile. On phones it carries the brand and the account
 * control; on desktop the sidebar owns the brand, so only the account control
 * floats in the top-right corner.
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
      <div className={styles.actions}>
        {clerkPublishableKey() ? <HeaderAuth /> : null}
      </div>
    </header>
  );
}
