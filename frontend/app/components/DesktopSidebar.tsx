"use client";

import { useState } from "react";
import { sidebarNavItems } from "@/app/data/nav-items";
import styles from "./DesktopSidebar.module.css";

export default function DesktopSidebar() {
  const [active, setActive] = useState<string>("explore");

  return (
    <aside className={styles.sidebar} data-testid="desktop-sidebar" aria-label="Desktop navigation">
      <div className={styles.brand}>
        <div className={styles.brandLogo} aria-hidden="true">
          PM
        </div>
        <span className={styles.brandName}>
          Park<span className={styles.brandAccent}>Match</span>
        </span>
      </div>
      <nav aria-label="Sidebar navigation">
        <ul className={styles.navList}>
          {sidebarNavItems.map((item) => (
            <li key={item.id}>
              <button
                className={`${styles.navLink} ${active === item.id ? styles.navLinkActive : ""}`}
                onClick={() => setActive(item.id)}
                aria-current={active === item.id ? "page" : undefined}
                type="button"
              >
                <span className={styles.navIcon} aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
