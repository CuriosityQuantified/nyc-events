import styles from "./Header.module.css";

const boroughs = [
  "All Boroughs",
  "Manhattan",
  "Brooklyn",
  "Queens",
  "Bronx",
  "Staten Island",
] as const;

export default function Header() {
  return (
    <header className={styles.header} data-testid="header">
      <div className={styles.brand}>
        <div className={styles.logo} aria-hidden="true">
          EM
        </div>
        <h1 className={styles.title}>
          Event<span className={styles.titleAccent}>Match</span>{" "}
          <span>NYC</span>
        </h1>
      </div>
      <label>
        <span className="sr-only">Select borough</span>
        <select className={styles.boroughSelect} defaultValue="All Boroughs">
          {boroughs.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </label>
    </header>
  );
}
