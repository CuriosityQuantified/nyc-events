"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";

/**
 * Clerk's provider is mounted from a Client Component so the browser SDK owns
 * the session on its own; no `clerkMiddleware` is installed yet, and the
 * server-side claim/merge arrives with #23.
 *
 * Without a publishable key this is a passthrough: nothing Clerk renders, so
 * nothing Clerk loads.
 */
export default function AuthProvider({
  publishableKey,
  children,
}: {
  publishableKey?: string | null;
  children: ReactNode;
}) {
  if (!publishableKey) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>
  );
}
