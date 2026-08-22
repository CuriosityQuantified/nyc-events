import { afterEach, describe, expect, it, vi } from "vitest";
import { clerkConfiguration } from "./clerk";

afterEach(() => vi.unstubAllEnvs());

describe("clerkConfiguration", () => {
  it("fails closed when the disable-only test switch is set", () => {
    vi.stubEnv("EVENTMATCH_DISABLE_CLERK", "1");
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_key");
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_key");
    expect(clerkConfiguration()).toEqual({ status: "disabled" });
  });

  it("is disabled when both keys are absent", () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");
    vi.stubEnv("CLERK_SECRET_KEY", "");
    expect(clerkConfiguration()).toEqual({ status: "disabled" });
  });

  it.each([
    ["pk_test_key", ""],
    ["", "sk_test_key"],
  ])("is unavailable for partial configuration", (publishable, secret) => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", publishable);
    vi.stubEnv("CLERK_SECRET_KEY", secret);
    expect(clerkConfiguration()).toEqual({ status: "unavailable" });
  });

  it("is configured only when both keys are present", () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_key");
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_key");
    expect(clerkConfiguration()).toEqual({
      status: "configured",
      publishableKey: "pk_test_key",
    });
  });
});
