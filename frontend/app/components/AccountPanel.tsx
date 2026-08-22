"use client";

import type { AuthClient } from "@/app/components/auth-client";
import { useState } from "react";
import { claimProfile } from "@/app/data/profile-claim";
import { prepareDeviceTokenRotation } from "@/app/data/device-token";
import { announceProfileChanged } from "@/app/data/profile-sync";
import styles from "./ProfileView.module.css";

type ClaimState = "idle" | "claiming" | "claimed" | "error";
type SignOutState =
  | "idle"
  | "signing-out"
  | "rotation-error"
  | "signout-restored"
  | "signout-isolated"
  | "uncertain";

function claimButtonLabel(state: ClaimState): string {
  if (state === "claiming") return "Claiming profile…";
  if (state === "error") return "Try claiming again";
  return "Claim this profile";
}

function signOutError(state: SignOutState): string | null {
  if (state === "rotation-error") {
    return "Sign-out stopped because this device Profile could not be isolated. You are still signed in. Check browser storage and try again.";
  }
  if (state === "signout-restored") {
    return "Sign-out failed. You are still signed in, and this device Profile was safely restored. Try again.";
  }
  if (state === "signout-isolated") {
    return "Sign-out failed. You are still signed in, but this device Profile remains isolated. Try again before handing over this device.";
  }
  if (state === "uncertain") {
    return "Sign-out failed, and device Profile isolation could not be verified. Do not hand over this device. Reload and try again.";
  }
  return null;
}

function SignedInAccount({ authClient }: { authClient: AuthClient }) {
  const { email, signOut } = authClient.useAccountSession();
  const UserButton = authClient.UserButton;
  const [claimState, setClaimState] = useState<ClaimState>("idle");
  const [signOutState, setSignOutState] = useState<SignOutState>("idle");

  const claim = async () => {
    setClaimState("claiming");
    try {
      await claimProfile();
      announceProfileChanged();
      setClaimState("claimed");
    } catch {
      setClaimState("error");
    }
  };

  const finishSignOut = async () => {
    setSignOutState("signing-out");
    const rotation = prepareDeviceTokenRotation();
    if (!rotation.ok) {
      setSignOutState(
        rotation.previousRestored ? "rotation-error" : "uncertain",
      );
      return;
    }

    announceProfileChanged();
    try {
      await signOut();
    } catch {
      const restore = rotation.restore();
      announceProfileChanged();
      if (restore.restored) setSignOutState("signout-restored");
      else if (restore.isolationVerified) setSignOutState("signout-isolated");
      else setSignOutState("uncertain");
    }
  };

  const error = signOutError(signOutState);
  return (
    <>
      <div className={styles.identityRow}>
        <UserButton />
        <p className={styles.state} data-testid="account-email">
          Signed in{email ? ` as ${email}` : ""}.
        </p>
      </div>
      {claimState === "claimed" ? (
        <p role="status" className={styles.claimSuccess}>
          Profile linked. Saved events and followed Interests were refreshed
          from this account.
        </p>
      ) : (
        <div className={styles.claimBox}>
          <p className={styles.state}>
            Claim this device Profile to carry it to another device. Your Saved
            events and followed Interests are preserved.
          </p>
          {claimState === "error" ? (
            <p role="alert" className={styles.error}>
              This Profile could not be linked. Nothing on this device changed.
            </p>
          ) : null}
          <button
            type="button"
            className={styles.accountButton}
            disabled={claimState === "claiming"}
            onClick={() => void claim()}
          >
            {claimButtonLabel(claimState)}
          </button>
        </div>
      )}
      {error ? (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}
      <button
        type="button"
        className={styles.secondaryButton}
        disabled={signOutState === "signing-out"}
        onClick={() => void finishSignOut()}
      >
        {signOutState === "signing-out" ? "Signing out…" : "Sign out"}
      </button>
    </>
  );
}

/** Optional Clerk account and device-Profile claim controls for Profile only. */
export default function AccountPanel({
  authClient,
}: {
  authClient: AuthClient;
}) {
  const { isLoaded, isSignedIn } = authClient.useAccountSession();
  const SignUpButton = authClient.SignUpButton;
  const SignInButton = authClient.SignInButton;
  return (
    <div className={styles.account} data-testid="account-panel">
      {!isLoaded ? (
        <p role="status" className={styles.state}>
          Loading account controls…
        </p>
      ) : isSignedIn ? (
        <SignedInAccount authClient={authClient} />
      ) : (
        <>
          <p className={styles.state}>
            An account keeps your saves and Interests with you across devices.
            This profile keeps working without one.
          </p>
          <div className={styles.accountActions}>
            <SignUpButton>
              <button type="button" className={styles.accountButton}>
                Sign up
              </button>
            </SignUpButton>
            <SignInButton>
              <button type="button" className={styles.secondaryButton}>
                Sign in
              </button>
            </SignInButton>
          </div>
        </>
      )}
    </div>
  );
}
