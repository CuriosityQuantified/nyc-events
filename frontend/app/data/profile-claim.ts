import { getDeviceToken } from "./device-token";

export type ClaimedProfile = {
  profileId: string;
  claimed: boolean;
};

export class ProfileClaimError extends Error {
  constructor(readonly status: number) {
    super(`Profile claim returned HTTP ${status}`);
  }
}

/** Link this device Profile to the current Clerk session without clearing it. */
export async function claimProfile(): Promise<ClaimedProfile> {
  const response = await fetch("/api/profile/claim", {
    method: "POST",
    headers: { "X-Device-Token": getDeviceToken() },
  });
  if (!response.ok) throw new ProfileClaimError(response.status);
  const claimed: unknown = await response.json();
  if (
    !claimed ||
    typeof claimed !== "object" ||
    typeof (claimed as Record<string, unknown>).profileId !== "string" ||
    (claimed as Record<string, unknown>).claimed !== true
  ) {
    throw new ProfileClaimError(502);
  }
  return claimed as ClaimedProfile;
}
