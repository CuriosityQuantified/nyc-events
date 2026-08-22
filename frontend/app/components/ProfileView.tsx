"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import Header from "@/app/components/Header";
import DesktopSidebar from "@/app/components/DesktopSidebar";
import BottomNav from "@/app/components/BottomNav";
import {
  fetchInterests,
  setInterestAlert,
  unfollowInterest,
  type Interest,
} from "@/app/data/preferences";
import pageStyles from "@/app/page.module.css";
import { onProfileChanged } from "@/app/data/profile-sync";
import styles from "./ProfileView.module.css";

const FACET_TYPE_LABELS: Record<string, string> = {
  borough: "Borough",
  category: "Category",
  registration: "Registration",
  composite: "Combination",
};

function interestLabel(interest: Interest): string {
  if (interest.facets && interest.facets.length > 1) {
    return interest.facets.map((facet) => facet.facetValue).join(" + ");
  }
  return interest.facetValue;
}

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
    setInterests([]);
    setActionError(null);
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

  useEffect(() => onProfileChanged(reload), [reload]);

  const onUnfollow = async (interest: Interest) => {
    setActionError(null);
    try {
      await unfollowInterest(interest.id);
      setInterests((prev) => prev.filter((item) => item.id !== interest.id));
    } catch {
      setActionError(`Could not unfollow ${interest.facetValue}.`);
    }
  };

  const onAlertChange = async (interest: Interest) => {
    setActionError(null);
    const nextEnabled = !interest.alertEnabled;
    setInterests((previous) =>
      previous.map((item) =>
        item.id === interest.id ? { ...item, alertEnabled: nextEnabled } : item,
      ),
    );
    try {
      const updated = await setInterestAlert(interest, nextEnabled);
      setInterests((previous) =>
        previous.map((item) => (item.id === interest.id ? updated : item)),
      );
    } catch {
      setInterests((previous) =>
        previous.map((item) =>
          item.id === interest.id
            ? { ...item, alertEnabled: interest.alertEnabled }
            : item,
        ),
      );
      setActionError(`Could not update alerts for ${interestLabel(interest)}.`);
    }
  };

  return (
    <div className={`${pageStyles.appLayout} app-page`}>
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
          <div className={styles.intro}>
            <p className={styles.subtitle}>
              Shape the events you hear about. Your preferences stay on this
              device unless you choose to create an account.
            </p>
            <p className={styles.anonymousNote}>
              <strong>No account required.</strong> Interests, alerts, Saved,
              and Concierge work either way.
            </p>
          </div>

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
                      {interestLabel(interest)}
                      <span className={styles.itemAlert}>
                        {interest.alertEnabled ? "· alerts on" : "· alerts off"}
                      </span>
                    </span>
                    <span className={styles.itemActions}>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={interest.alertEnabled}
                        aria-label={`Alerts for ${interestLabel(interest)}`}
                        className={styles.alertSwitch}
                        onClick={() => void onAlertChange(interest)}
                      >
                        <span className={styles.switchTrack} aria-hidden="true">
                          <span className={styles.switchThumb} />
                        </span>
                        Alert me
                      </button>
                      <button
                        type="button"
                        className={styles.unfollow}
                        onClick={() => void onUnfollow(interest)}
                        aria-label={`Unfollow ${interestLabel(interest)}`}
                      >
                        Unfollow
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section
            aria-label="Notification preferences"
            className={styles.section}
          >
            <h3 className={styles.heading}>Notification preferences</h3>
            <p className={styles.state}>
              Use each Interest&rsquo;s Alert me switch to choose what can
              notify you. Alerts are optional and stay available without an
              account.
            </p>
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
