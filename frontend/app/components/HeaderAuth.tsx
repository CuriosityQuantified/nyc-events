"use client";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import styles from "./Header.module.css";

/**
 * The header's account control (#24). Rendered only when Clerk is configured,
 * so the header keeps its two-item layout for everyone else.
 */
export default function HeaderAuth() {
  return (
    <div className={styles.auth} data-testid="header-auth">
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button type="button" className={styles.signIn}>
            Sign in
          </button>
        </SignInButton>
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </div>
  );
}
