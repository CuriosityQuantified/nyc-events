import styles from "./MapPlaceholder.module.css";

export default function MapPlaceholder() {
  return (
    <div className={styles.wrapper} data-testid="map-placeholder" role="region" aria-label="Map view placeholder">
      <div className={styles.content}>
        <div className={styles.icon} aria-hidden="true">
          🗺️
        </div>
        <p className={styles.text}>Map View</p>
        <p className={styles.subtext}>Coming soon</p>
      </div>
    </div>
  );
}
