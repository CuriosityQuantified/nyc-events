"use client";

import { usePathname, useRouter } from "next/navigation";
import NavIcon from "@/app/components/NavIcon";
import { sidebarNavItems } from "@/app/data/nav-items";
import styles from "./DesktopSidebar.module.css";

export default function DesktopSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <aside
      className={`${styles.sidebar} glass`}
      data-testid="desktop-sidebar"
      aria-label="Desktop navigation"
    >
      <div className={styles.brand}>
        <span className={styles.brandLogo} aria-hidden="true">
          EM
        </span>
        <h1 className={styles.brandName}>
          Event<span className={styles.brandAccent}>Match</span>{" "}
          <span>NYC</span>
        </h1>
      </div>
      <nav aria-label="Sidebar navigation">
        <ul className={styles.navList}>
          {sidebarNavItems.map((item) => {
            const active = item.href !== null && pathname === item.href;
            return (
              <li key={item.id}>
                <button
                  className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
                  onClick={() => {
                    if (item.href) router.push(item.href);
                  }}
                  aria-current={active ? "page" : undefined}
                  aria-disabled={item.href === null || undefined}
                  type="button"
                >
                  <span className={styles.navIcon}>
                    <NavIcon name={item.icon} />
                  </span>
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <p className={styles.footNote}>
        Data from the official NYC Parks 14-day events feed.
      </p>
    </aside>
  );
}
