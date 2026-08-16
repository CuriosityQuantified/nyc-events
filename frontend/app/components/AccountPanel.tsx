"use client";

import { Show, SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import styles from "./ProfileView.module.css";

function SignedInAccount() {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;

  return (
    <>
      <p className={styles.state} data-testid="account-email">
        Signed in{email ? ` as ${email}` : ""}.
      </p>
      <p className={styles.state}>
        Moving this device&rsquo;s saves and Interests onto your account is
        coming next.
      </p>
      <SignOutButton>
        <button type="button" className={styles.accountButton}>
          Sign out
        </button>
      </SignOutButton>
    </>
  );
}

/**
 * The Account section of the Profile tab (#24), rendered only when Clerk is
 * configured. Claiming a device profile into an account is #23.
 */
export default function AccountPanel() {
  return (
    <div className={styles.account} data-testid="account-panel">
      <Show when="signed-out">
        <p className={styles.state}>
          An account keeps your saves and Interests with you across devices.
          This profile keeps working without one.
        </p>
        <SignInButton mode="modal">
          <button type="button" className={styles.accountButton}>
            Sign in
          </button>
        </SignInButton>
      </Show>
      <Show when="signed-in">
        <SignedInAccount />
      </Show>
    </div>
  );
}
