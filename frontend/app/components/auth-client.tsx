"use client";

import {
  ClerkProvider,
  SignIn,
  SignInButton,
  SignUp,
  SignUpButton,
  UserButton,
  useClerk,
  useUser,
} from "@clerk/nextjs";
import type { ComponentType, ReactElement, ReactNode } from "react";

export type AccountSession = {
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
  email: string | undefined;
  signOut: () => Promise<unknown>;
};

export type AuthClient = {
  useAccountSession: () => AccountSession;
  SignInButton: ComponentType<{ children: ReactElement }>;
  SignUpButton: ComponentType<{ children: ReactElement }>;
  UserButton: ComponentType;
};

export function AccountAuthProvider({
  publishableKey,
  children,
}: {
  publishableKey: string;
  children: ReactNode;
}) {
  return (
    <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>
  );
}

export function useAccountSession(): AccountSession {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  return {
    isLoaded,
    isSignedIn,
    email: user?.primaryEmailAddress?.emailAddress,
    signOut,
  };
}

export function AccountSignInButton({ children }: { children: ReactElement }) {
  return <SignInButton mode="modal">{children}</SignInButton>;
}

export function AccountSignUpButton({ children }: { children: ReactElement }) {
  return <SignUpButton mode="modal">{children}</SignUpButton>;
}

export function AccountUserButton() {
  return <UserButton />;
}

export const clerkAuthClient: AuthClient = {
  useAccountSession,
  SignInButton: AccountSignInButton,
  SignUpButton: AccountSignUpButton,
  UserButton: AccountUserButton,
};

export function AccountSignInScreen() {
  return <SignIn />;
}

export function AccountSignUpScreen() {
  return <SignUp />;
}
