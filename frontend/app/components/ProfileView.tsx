"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import Header from "@/app/components/Header";
import DesktopSidebar from "@/app/components/DesktopSidebar";
import BottomNav from "@/app/components/BottomNav";
import {
  fetchInterests,
  unfollowInterest,
  type Interest,
} from "@/app/data/preferences";
import pageStyles from "@/app/page.module.css";
import styles from "./ProfileView.module.css";

const FACET_TYPE_LABELS: Record<string, string> = {
  borough: "Borough",
  category: "Category",
  registration: "Registration",
};

/**
 * Profile destination (#22): the current Interests are visible here so it is
 * clear why a Match arrived, and each can be unfollowed. Notification controls
 * arrive with #25.
 *
 * `account` carries the Clerk-backed Account controls (#24) when Clerk is
 * configured; the page decides, so no Clerk code reaches a build without a key.
 */
export default function ProfileView({ account }: { account?: ReactNode }) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [interests, setInterests] = useState<Interest[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loadCount, setLoadCount] = useState(0);

  const reload = useCallback(() => {
    setStatus("loading");
    setLoadCount((count) => count + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchInterests()
      .then((list) => {
        if (cancelled) return;
        setInterests(list);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [loadCount]);

  const onUnfollow = async (interest: Interest) => {
    setActionError(null);
    try {
      await unfollowInterest(interest.id);
      setInterests((prev) => prev.filter((item) => item.id !== interest.id));
    } catch {
      setActionError(`Could not unfollow ${interest.facetValue}.`);
    }
  };

  return (
    <div className={pageStyles.appLayout}>
      <a className="skip-link" href="#main-content">
        Skip to profile
      </a>
      <DesktopSidebar />
      <div className={pageStyles.mainArea}>
        <Header />
        <main
          id="main-content"
          className={pageStyles.mainContent}
          tabIndex={-1}
          aria-busy={status === "loading"}
        >
          <h2 className={styles.title}>Profile</h2>
          <p className={styles.subtitle}>
            An anonymous profile on this device. Your Interests decide which new
            events become Matches in Saved.
          </p>

          <section aria-label="Interests you follow" className={styles.section}>
            <h3 className={styles.heading}>Interests</h3>
            {actionError ? (
              <p role="alert" className={styles.error}>
                {actionError}
              </p>
            ) : null}
            {status === "loading" ? (
              <p role="status" className={styles.state}>
                Loading your interests…
              </p>
            ) : status === "error" ? (
              <p role="alert" className={styles.state}>
                Your interests could not be loaded.{" "}
                <button type="button" className={styles.retry} onClick={reload}>
                  Retry
                </button>
              </p>
            ) : interests.length === 0 ? (
              <p className={styles.state} data-testid="interests-empty">
                You are not following anything yet. Filter{" "}
                <Link href="/">Explore</Link> by a borough, category, or
                registration status and tap Follow.
              </p>
            ) : (
              <ul className={styles.list} data-testid="interests-list">
                {interests.map((interest) => (
                  <li key={interest.id} className={styles.item}>
                    <span className={styles.itemLabel}>
                      <span className={styles.itemType}>
                        {FACET_TYPE_LABELS[interest.facetType] ??
                          interest.facetType}
                      </span>
                      {interest.facetValue}
                      <span className={styles.itemAlert}>
                        {interest.alertEnabled ? "· alerts on" : "· alerts off"}
                      </span>
                    </span>
                    <button
                      type="button"
                      className={styles.unfollow}
                      onClick={() => void onUnfollow(interest)}
                      aria-label={`Unfollow ${interest.facetValue}`}
                    >
                      Unfollow
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-label="Account" className={styles.section}>
            <h3 className={styles.heading}>Account</h3>
            {account ?? (
              <p className={styles.state}>
                Sign-in to keep your profile across devices is coming soon. Your
                saves and interests stay on this device until then.
              </p>
            )}
          </section>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
