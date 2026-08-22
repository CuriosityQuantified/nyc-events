"use client";

import type { AuthClient } from "@/app/components/auth-client";
import {
  cloneElement,
  createContext,
  useContext,
  useEffect,
  useState,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";

const AUTH_KEY = "eventmatch-component-auth";
const SIGN_OUT_FAILURE_KEY = "eventmatch-component-signout-failure";
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

const FixtureContext = createContext<{
  signedIn: boolean;
  setSignedIn: (value: boolean) => void;
} | null>(null);

function requireLoopbackOrigin(): void {
  if (!LOOPBACK_HOSTS.has(window.location.hostname)) {
    throw new Error("The account component harness is loopback-only");
  }
}

export function FixtureAuthProvider({ children }: { children: ReactNode }) {
  requireLoopbackOrigin();
  const [signedIn, setSignedInState] = useState(
    () => window.localStorage.getItem(AUTH_KEY) === "true",
  );

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === AUTH_KEY) setSignedInState(event.newValue === "true");
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const setSignedIn = (value: boolean) => {
    if (value) window.localStorage.setItem(AUTH_KEY, "true");
    else window.localStorage.removeItem(AUTH_KEY);
    setSignedInState(value);
  };

  return (
    <FixtureContext.Provider value={{ signedIn, setSignedIn }}>
      {children}
    </FixtureContext.Provider>
  );
}

function useFixture() {
  const value = useContext(FixtureContext);
  if (!value) throw new Error("Account auth fixture is missing its provider");
  return value;
}

function useFixtureSession() {
  const { signedIn, setSignedIn } = useFixture();
  return {
    isLoaded: true,
    isSignedIn: signedIn,
    email: signedIn ? "component@example.invalid" : undefined,
    signOut: async () => {
      if (window.localStorage.getItem(SIGN_OUT_FAILURE_KEY) === "true") {
        throw new Error("Component harness sign-out failure");
      }
      setSignedIn(false);
    },
  };
}

function AuthTrigger({ children }: { children: ReactElement }) {
  const { setSignedIn } = useFixture();
  const trigger = children as ReactElement<{
    onClick?: (event: MouseEvent) => void;
  }>;
  return cloneElement(trigger, {
    onClick: (event: MouseEvent) => {
      trigger.props.onClick?.(event);
      setSignedIn(true);
    },
  });
}

function FixtureSignInButton({ children }: { children: ReactElement }) {
  return <AuthTrigger>{children}</AuthTrigger>;
}

function FixtureSignUpButton({ children }: { children: ReactElement }) {
  return <AuthTrigger>{children}</AuthTrigger>;
}

function FixtureUserButton() {
  return <button aria-label="Account menu">CE</button>;
}

/**
 * Client-only AuthClient for the loopback Vite component harness. It cannot
 * mint a Clerk token, alter Next middleware, or authorize the real claim route.
 */
export const fixtureAuthClient: AuthClient = {
  useAccountSession: useFixtureSession,
  SignInButton: FixtureSignInButton,
  SignUpButton: FixtureSignUpButton,
  UserButton: FixtureUserButton,
};
