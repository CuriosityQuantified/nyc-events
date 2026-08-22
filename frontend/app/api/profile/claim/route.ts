import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { apiBaseUrl } from "@/app/data/events";
import { clerkConfiguration } from "@/app/data/clerk";
import { deviceTokenFrom } from "../token";

export const dynamic = "force-dynamic";

function validClaimedProfile(
  value: unknown,
): value is { id: string; claimed: true } {
  if (!value || typeof value !== "object") return false;
  const profile = value as Record<string, unknown>;
  return (
    typeof profile.id === "string" &&
    profile.id.length > 0 &&
    profile.id.length <= 128 &&
    profile.claimed === true
  );
}

function unavailable() {
  return NextResponse.json(
    { error: "Profile claiming is unavailable" },
    { status: 503 },
  );
}

export async function POST(request: NextRequest) {
  if (clerkConfiguration().status !== "configured") {
    return NextResponse.json(
      { error: "Account claiming is unavailable" },
      { status: 503 },
    );
  }

  const deviceToken = deviceTokenFrom(request);
  if (!deviceToken) {
    return NextResponse.json(
      { error: "A valid X-Device-Token header is required" },
      { status: 400 },
    );
  }

  let sessionToken: string | null;
  try {
    const session = await auth();
    sessionToken = await session.getToken();
  } catch {
    return unavailable();
  }
  if (!sessionToken) {
    return NextResponse.json(
      { error: "Sign in before claiming" },
      { status: 401 },
    );
  }

  try {
    const upstream = await fetch(`${apiBaseUrl()}/profile/claim`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        "X-Device-Token": deviceToken,
      },
      cache: "no-store",
    });
    if (!upstream.ok) {
      if (upstream.status === 401 || upstream.status === 403) {
        return NextResponse.json(
          { error: "Account authorization was rejected" },
          { status: upstream.status },
        );
      }
      if (upstream.status === 409) {
        return NextResponse.json(
          { error: "This Profile is already linked to another account" },
          { status: 409 },
        );
      }
      return unavailable();
    }

    const profile: unknown = await upstream.json();
    if (!validClaimedProfile(profile)) return unavailable();
    return NextResponse.json({
      profileId: profile.id,
      claimed: profile.claimed,
    });
  } catch {
    return unavailable();
  }
}
