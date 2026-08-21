import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

const clerk = vi.hoisted(() => ({
  signedIn: false,
  providerKeys: [] as (string | undefined)[],
}));

vi.mock("@clerk/nextjs", () => ({
  ClerkProvider: ({
    children,
    publishableKey,
  }: {
    children?: ReactNode;
    publishableKey?: string;
  }) => {
    clerk.providerKeys.push(publishableKey);
    return <div data-testid="clerk-provider">{children}</div>;
  },
  Show: ({ when, children }: { when: string; children?: ReactNode }) =>
    (when === "signed-in") === clerk.signedIn ? <>{children}</> : null,
  SignInButton: ({ children }: { children?: ReactNode }) => <>{children}</>,
  SignOutButton: ({ children }: { children?: ReactNode }) => <>{children}</>,
  UserButton: () => <div data-testid="user-button" />,
  useUser: () => ({
    user: clerk.signedIn
      ? { primaryEmailAddress: { emailAddress: "someone@example.com" } }
      : null,
  }),
}));

import AccountPanel from "./AccountPanel";
import AuthProvider from "./AuthProvider";
import Header from "./Header";
import HeaderAuth from "./HeaderAuth";

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  clerk.signedIn = false;
  clerk.providerKeys.length = 0;
});

describe("AuthProvider", () => {
  it("passes children through without mounting Clerk when no key is set", () => {
    render(
      <AuthProvider publishableKey={null}>
        <p>app</p>
      </AuthProvider>,
    );

    expect(screen.getByText("app")).toBeTruthy();
    expect(screen.queryByTestId("clerk-provider")).toBeNull();
    expect(clerk.providerKeys).toEqual([]);
  });

  it("mounts ClerkProvider with the publishable key when one is set", () => {
    render(
      <AuthProvider publishableKey="pk_test_key">
        <p>app</p>
      </AuthProvider>,
    );

    expect(screen.getByTestId("clerk-provider")).toBeTruthy();
    expect(screen.getByText("app")).toBeTruthy();
    expect(clerk.providerKeys).toEqual(["pk_test_key"]);
  });
});

describe("Header account control", () => {
  it("renders no account control when Clerk is not configured", () => {
    render(<Header />);

    expect(screen.getByTestId("header")).toBeTruthy();
    expect(screen.queryByTestId("header-auth")).toBeNull();
    expect(screen.queryByRole("button", { name: "Sign in" })).toBeNull();
  });

  it("renders the account control when Clerk is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_key");
    render(<Header />);

    expect(screen.getByTestId("header-auth")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeTruthy();
  });

  it("swaps the sign-in button for the user button once signed in", () => {
    clerk.signedIn = true;
    render(<HeaderAuth />);

    expect(screen.queryByRole("button", { name: "Sign in" })).toBeNull();
    expect(screen.getByTestId("user-button")).toBeTruthy();
  });
});

describe("AccountPanel", () => {
  it("offers sign-in and explains what an account buys, signed out", () => {
    render(<AccountPanel />);

    expect(screen.getByRole("button", { name: "Sign in" })).toBeTruthy();
    expect(screen.getByText(/across devices/)).toBeTruthy();
    expect(screen.queryByTestId("account-email")).toBeNull();
  });

  it("shows the signed-in email and a sign-out control", () => {
    clerk.signedIn = true;
    render(<AccountPanel />);

    expect(screen.getByTestId("account-email").textContent).toContain(
      "someone@example.com",
    );
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Sign in" })).toBeNull();
  });
});
