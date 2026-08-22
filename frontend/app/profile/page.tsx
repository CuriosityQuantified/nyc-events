import type { Metadata } from "next";
import { connection } from "next/server";
import type { ReactNode } from "react";
import ClerkAccountPanel from "@/app/components/ClerkAccountPanel";
import ProfileView from "@/app/components/ProfileView";
import { clerkConfiguration } from "@/app/data/clerk";
import styles from "@/app/components/ProfileView.module.css";

export const metadata: Metadata = {
  title: "Profile · EventMatch NYC",
  description:
    "Your anonymous EventMatch profile: the Interests you follow and how Matches reach you.",
};

function UnavailableAccount() {
  return (
    <p className={styles.state} role="status" data-testid="account-unavailable">
      Account sign-in is unavailable because account configuration is
      incomplete. Anonymous Profile, Saved, Interests, and Concierge features
      still work.
    </p>
  );
}

export default async function ProfilePage() {
  await connection();
  const clerk = clerkConfiguration();
  let account: ReactNode = null;
  if (clerk.status === "configured") account = <ClerkAccountPanel />;
  if (clerk.status === "unavailable") account = <UnavailableAccount />;
  return <ProfileView account={account} />;
}
