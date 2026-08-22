import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

const clerk = vi.hoisted(() => ({
  signedIn: false,
  loaded: true,
  providerKeys: [] as (string | undefined)[],
  signOut: vi.fn(),
}));
const claimProfile = vi.hoisted(() => vi.fn());
const prepareDeviceTokenRotation = vi.hoisted(() => vi.fn());
const restoreDeviceToken = vi.hoisted(() => vi.fn());
const announceProfileChanged = vi.hoisted(() => vi.fn());

vi.mock("@/app/data/profile-claim", () => ({ claimProfile }));
vi.mock("@/app/data/device-token", () => ({ prepareDeviceTokenRotation }));
vi.mock("@/app/data/profile-sync", () => ({ announceProfileChanged }));
vi.mock("@/app/components/auth-client", () => {
  const accountClient = {
    SignInButton: ({ children }: { children?: ReactNode }) => <>{children}</>,
    SignUpButton: ({ children }: { children?: ReactNode }) => <>{children}</>,
    UserButton: () => <button aria-label="Account menu" />,
    useAccountSession: () => ({
      isLoaded: clerk.loaded,
      isSignedIn: clerk.signedIn,
      email: clerk.signedIn ? "someone@example.com" : undefined,
      signOut: clerk.signOut,
    }),
  };
  return {
    AccountAuthProvider: ({
      children,
      publishableKey,
    }: {
      children?: ReactNode;
      publishableKey?: string;
    }) => {
      clerk.providerKeys.push(publishableKey);
      return <div data-testid="clerk-provider">{children}</div>;
    },
    clerkAuthClient: accountClient,
  };
});

import AccountPanel from "./ClerkAccountPanel";
import AuthProvider from "./AuthProvider";
import Header from "./Header";

beforeEach(() => {
  clerk.signOut.mockReset().mockResolvedValue(undefined);
  claimProfile.mockReset().mockResolvedValue({
    profileId: "profile-1",
    claimed: true,
  });
  restoreDeviceToken.mockReset().mockReturnValue({ restored: true });
  prepareDeviceTokenRotation.mockReset().mockReturnValue({
    ok: true,
    replacement: "b".repeat(64),
    restore: restoreDeviceToken,
  });
  announceProfileChanged.mockReset();
});

afterEach(() => {
  cleanup();
  clerk.signedIn = false;
  clerk.loaded = true;
  clerk.providerKeys.length = 0;
});

describe("AuthProvider", () => {
  it("passes through without Clerk when configuration is not complete", () => {
    render(
      <AuthProvider>
        <p>app</p>
      </AuthProvider>,
    );
    expect(screen.getByText("app")).toBeTruthy();
    expect(screen.queryByTestId("clerk-provider")).toBeNull();
  });

  it("mounts Clerk with the server-approved publishable key", () => {
    render(
      <AuthProvider publishableKey="pk_test_key">
        <p>app</p>
      </AuthProvider>,
    );
    expect(screen.getByTestId("clerk-provider")).toBeTruthy();
    expect(clerk.providerKeys).toEqual(["pk_test_key"]);
  });
});

describe("account placement", () => {
  it("keeps exact primary header behavior without account controls", () => {
    render(<Header />);
    expect(screen.getByTestId("header")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Sign in" })).toBeNull();
  });

  it("shows an explicit loading state instead of an empty Account card", () => {
    clerk.loaded = false;
    render(<AccountPanel />);
    expect(screen.getByRole("status").textContent).toContain(
      "Loading account controls",
    );
  });

  it("offers sign-up and sign-in while preserving anonymous use", () => {
    render(<AccountPanel />);
    expect(screen.getByRole("button", { name: "Sign in" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign up" })).toBeTruthy();
    expect(screen.getByText(/keeps working without one/i)).toBeTruthy();
  });

  it("keeps the signed-in identity control inside Profile", () => {
    clerk.signedIn = true;
    render(<AccountPanel />);
    expect(screen.getByRole("button", { name: "Account menu" })).toBeTruthy();
    expect(screen.getByTestId("account-email").textContent).toContain(
      "someone@example.com",
    );
  });
});

describe("claim and sign-out isolation", () => {
  it("refreshes canonical Profile and Saved state after claim", async () => {
    clerk.signedIn = true;
    render(<AccountPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Claim this profile" }));

    await waitFor(() => expect(claimProfile).toHaveBeenCalledOnce());
    expect(announceProfileChanged).toHaveBeenCalledOnce();
    expect(screen.getByRole("status").textContent).toContain("were refreshed");
  });

  it("keeps a retry-safe claim action after a failure", async () => {
    clerk.signedIn = true;
    claimProfile.mockRejectedValueOnce(new Error("offline"));
    render(<AccountPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Claim this profile" }));
    await screen.findByRole("alert");
    expect(
      screen.getByRole("button", { name: "Try claiming again" }),
    ).toBeTruthy();
  });

  it("verifies persistent rotation before Clerk sign-out starts", async () => {
    clerk.signedIn = true;
    render(<AccountPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(clerk.signOut).toHaveBeenCalledOnce());
    expect(prepareDeviceTokenRotation).toHaveBeenCalledOnce();
    expect(prepareDeviceTokenRotation.mock.invocationCallOrder[0]).toBeLessThan(
      clerk.signOut.mock.invocationCallOrder[0],
    );
    expect(announceProfileChanged).toHaveBeenCalledOnce();
  });

  it("stops before Clerk sign-out when persistent isolation is not proved", async () => {
    clerk.signedIn = true;
    prepareDeviceTokenRotation.mockReturnValue({
      ok: false,
      previousRestored: true,
    });
    render(<AccountPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Sign-out stopped",
    );
    expect(clerk.signOut).not.toHaveBeenCalled();
    expect(announceProfileChanged).not.toHaveBeenCalled();
  });

  it("restores and refreshes the previous Profile when Clerk sign-out fails", async () => {
    clerk.signedIn = true;
    clerk.signOut.mockRejectedValueOnce(new Error("session service down"));
    render(<AccountPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "safely restored",
    );
    expect(restoreDeviceToken).toHaveBeenCalledOnce();
    expect(announceProfileChanged).toHaveBeenCalledTimes(2);
  });
});
