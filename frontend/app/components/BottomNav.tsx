"use client";

import { usePathname, useRouter } from "next/navigation";
import NavIcon from "@/app/components/NavIcon";
import { coreNavItems } from "@/app/data/nav-items";
import styles from "./BottomNav.module.css";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav
      className={`${styles.nav} glass`}
      data-testid="bottom-nav"
      aria-label="Main navigation"
    >
      <ul className={styles.list}>
        {coreNavItems.map((item) => {
          const active = item.href !== null && pathname === item.href;
          return (
            <li key={item.id}>
              <button
                className={`${styles.button} ${active ? styles.buttonActive : ""}`}
                onClick={() => {
                  if (item.href) router.push(item.href);
                }}
                aria-current={active ? "page" : undefined}
                aria-disabled={item.href === null || undefined}
                type="button"
              >
                <span className={styles.icon}>
                  <NavIcon name={item.icon} />
                </span>
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
