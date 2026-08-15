"use client";

import { useState } from "react";
import styles from "./FilterChips.module.css";

const categories = [
  "All",
  "Fitness",
  "Theater",
  "Music",
  "Nature",
  "Sports",
  "Art",
  "Family",
] as const;

export default function FilterChips() {
  const [active, setActive] = useState<string>("All");

  return (
    <div className={styles.wrapper} data-testid="filter-chips" role="group" aria-label="Event categories">
      <ul className={styles.list}>
        {categories.map((cat) => (
          <li key={cat}>
            <button
              className={`${styles.chip} ${active === cat ? styles.chipActive : ""}`}
              onClick={() => setActive(cat)}
              aria-pressed={active === cat}
              type="button"
            >
              {cat}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
