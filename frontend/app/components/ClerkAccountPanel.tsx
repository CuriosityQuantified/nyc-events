"use client";

import AccountPanel from "./AccountPanel";
import { clerkAuthClient } from "./auth-client";

/** Bind the real Clerk adapter at the production composition boundary. */
export default function ClerkAccountPanel() {
  return <AccountPanel authClient={clerkAuthClient} />;
}
