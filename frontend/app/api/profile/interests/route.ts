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
        facets?: Array<{ facet_type: string; facet_value: string }>;
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
        facets: (
          interest.facets ?? [
            {
              facet_type: interest.facet_type,
              facet_value: interest.facet_value,
            },
          ]
        ).map((member) => ({
          facetType: member.facet_type,
          facetValue: member.facet_value,
        })),
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
    facets?: unknown;
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
  function isFacetMember(
    value: unknown,
  ): value is { facet_type: string; facet_value: string } {
    if (typeof value !== "object" || value === null) return false;
    const member = value as { facet_type?: unknown; facet_value?: unknown };
    return (
      typeof member.facet_type === "string" &&
      FACET_TYPES.has(member.facet_type) &&
      typeof member.facet_value === "string" &&
      member.facet_value.length >= 1 &&
      member.facet_value.length <= 100
    );
  }
  const isComposite =
    Array.isArray(body.facets) &&
    body.facets.length >= 2 &&
    body.facets.length <= 3 &&
    body.facets.every(isFacetMember);
  const isSingle =
    typeof body.facet_type === "string" &&
    FACET_TYPES.has(body.facet_type) &&
    typeof body.facet_value === "string" &&
    body.facet_value.length >= 1 &&
    body.facet_value.length <= 100;
  if (!isComposite && !isSingle) {
    return NextResponse.json(
      { error: "Provide facet_type and facet_value, or 2-3 facets" },
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
      body: JSON.stringify(
        isComposite
          ? { facets: body.facets, alert_enabled: body.alert_enabled !== false }
          : {
              facet_type: body.facet_type,
              facet_value: body.facet_value,
              alert_enabled: body.alert_enabled !== false,
            },
      ),
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
      facets?: Array<{ facet_type: string; facet_value: string }>;
      alert_enabled: boolean;
      origin: string;
    };
    return NextResponse.json({
      id: interest.id,
      facetType: interest.facet_type,
      facetValue: interest.facet_value,
      facets: (
        interest.facets ?? [
          {
            facet_type: interest.facet_type,
            facet_value: interest.facet_value,
          },
        ]
      ).map((member) => ({
        facetType: member.facet_type,
        facetValue: member.facet_value,
      })),
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
