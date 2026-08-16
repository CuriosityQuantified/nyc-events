/**
 * Accounts are optional (#24). Clerk is enabled only when the publishable key
 * is present; without it the app renders exactly as it did before, with no
 * Clerk component mounted and no Clerk request made.
 *
 * `NEXT_PUBLIC_` values are inlined by `next build`, so the key must be set in
 * the build environment (see frontend/Dockerfile) and a rotation needs a
 * redeploy.
 */
export function clerkPublishableKey(): string | null {
  return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || null;
}
