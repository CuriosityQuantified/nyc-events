"use client";

import { AccountAuthProvider } from "@/app/components/auth-client";
import type { ReactNode } from "react";

type AuthProviderProps = {
  publishableKey?: string;
  children: ReactNode;
};

/** Mount Clerk only after the server confirms complete configuration. */
export default function AuthProvider({
  publishableKey,
  children,
}: AuthProviderProps) {
  if (!publishableKey) return <>{children}</>;
  return (
    <AccountAuthProvider publishableKey={publishableKey}>
      {children}
    </AccountAuthProvider>
  );
}
