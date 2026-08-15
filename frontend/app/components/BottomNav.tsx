"use client";

import { useState } from "react";
import { coreNavItems } from "@/app/data/nav-items";
import styles from "./BottomNav.module.css";

export default function BottomNav() {
  const [active, setActive] = useState<string>("explore");

  return (
    <nav className={styles.nav} data-testid="bottom-nav" aria-label="Main navigation">
      <ul className={styles.list}>
        {coreNavItems.map((item) => (
          <li key={item.id}>
            <button
              className={`${styles.button} ${active === item.id ? styles.buttonActive : ""}`}
              onClick={() => setActive(item.id)}
              aria-current={active === item.id ? "page" : undefined}
              type="button"
            >
              <span className={styles.icon} aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
