import styles from "./ListMapToggle.module.css";

export type View = "list" | "map";

interface ListMapToggleProps {
  activeView: View;
  onViewChange: (view: View) => void;
}

export default function ListMapToggle({
  activeView,
  onViewChange,
}: ListMapToggleProps) {
  return (
    <div
      className={styles.wrapper}
      data-testid="list-map-toggle"
      role="group"
      aria-label="View mode"
    >
      <div className={styles.toggle}>
        <button
          className={`${styles.button} ${activeView === "list" ? styles.buttonActive : ""}`}
          onClick={() => onViewChange("list")}
          aria-pressed={activeView === "list"}
          type="button"
        >
          List
        </button>
        <button
          className={`${styles.button} ${activeView === "map" ? styles.buttonActive : ""}`}
          onClick={() => onViewChange("map")}
          aria-pressed={activeView === "map"}
          type="button"
        >
          Map
        </button>
      </div>
    </div>
  );
}
