import "server-only";

export type ClerkConfiguration =
  | { status: "disabled" }
  | { status: "unavailable" }
  | { status: "configured"; publishableKey: string };

/**
 * Read both optional Clerk keys from the live server environment. The public
 * key is passed to ClerkProvider as public UI configuration. The secret key
 * stays in this server-only module and is never a build argument.
 */
export function clerkConfiguration(): ClerkConfiguration {
  // Test-only fail-closed switch. It can disable optional account UI but can
  // never grant identity, create a Clerk token, or authorize a server route.
  if (process.env.EVENTMATCH_DISABLE_CLERK === "1") {
    return { status: "disabled" };
  }

  const runtimeVariable = (segments: string[]) =>
    process.env[segments.join("_")]?.trim();
  const publishableKey = runtimeVariable([
    "NEXT",
    "PUBLIC",
    "CLERK",
    "PUBLISHABLE",
    "KEY",
  ]);
  const secretKey = runtimeVariable(["CLERK", "SECRET", "KEY"]);
  if (!publishableKey && !secretKey) return { status: "disabled" };
  if (!publishableKey || !secretKey) return { status: "unavailable" };
  return { status: "configured", publishableKey };
}
