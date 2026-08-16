import { NextRequest, NextResponse } from "next/server";
import { apiBaseUrl } from "@/app/data/events";
import { deviceTokenFrom } from "../token";

export const dynamic = "force-dynamic";

const FACET_TYPES = new Set(["borough", "category", "registration"]);

function badToken() {
  return NextResponse.json(
    { error: "A valid X-Device-Token header is required" },
    { status: 400 },
  );
}

export async function GET(request: NextRequest) {
  const token = deviceTokenFrom(request);
  if (!token) return badToken();
  try {
    const upstream = await fetch(`${apiBaseUrl()}/profile/interests`, {
      headers: { "X-Device-Token": token },
      cache: "no-store",
    });
    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Interests are unavailable" },
        { status: 503 },
      );
    }
    const data = (await upstream.json()) as {
      interests: Array<{
        id: string;
        facet_type: string;
        facet_value: string;
        alert_enabled: boolean;
        origin: string;
      }>;
      total: number;
    };
    return NextResponse.json({
      interests: data.interests.map((interest) => ({
        id: interest.id,
        facetType: interest.facet_type,
        facetValue: interest.facet_value,
        alertEnabled: interest.alert_enabled,
        origin: interest.origin,
      })),
      total: data.total,
    });
  } catch {
    return NextResponse.json(
      { error: "Interests are unavailable" },
      { status: 503 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const token = deviceTokenFrom(request);
  if (!token) return badToken();
  let body: {
    facet_type?: unknown;
    facet_value?: unknown;
    alert_enabled?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "A JSON body is required" },
      { status: 400 },
    );
  }
  if (
    typeof body.facet_type !== "string" ||
    !FACET_TYPES.has(body.facet_type) ||
    typeof body.facet_value !== "string" ||
    body.facet_value.length < 1 ||
    body.facet_value.length > 100
  ) {
    return NextResponse.json(
      { error: "facet_type and facet_value are required" },
      { status: 400 },
    );
  }
  try {
    const upstream = await fetch(`${apiBaseUrl()}/profile/interests`, {
      method: "PUT",
      headers: {
        "X-Device-Token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        facet_type: body.facet_type,
        facet_value: body.facet_value,
        alert_enabled: body.alert_enabled !== false,
      }),
      cache: "no-store",
    });
    if (upstream.status === 422) {
      const detail = (await upstream.json()) as { detail?: string };
      return NextResponse.json(
        { error: detail.detail ?? "Interest was rejected" },
        { status: 422 },
      );
    }
    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Following is unavailable" },
        { status: 503 },
      );
    }
    const interest = (await upstream.json()) as {
      id: string;
      facet_type: string;
      facet_value: string;
      alert_enabled: boolean;
      origin: string;
    };
    return NextResponse.json({
      id: interest.id,
      facetType: interest.facet_type,
      facetValue: interest.facet_value,
      alertEnabled: interest.alert_enabled,
      origin: interest.origin,
    });
  } catch {
    return NextResponse.json(
      { error: "Following is unavailable" },
      { status: 503 },
    );
  }
}
