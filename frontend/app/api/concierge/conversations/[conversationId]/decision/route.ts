import { NextRequest, NextResponse } from "next/server";
import { apiBaseUrl } from "@/app/data/events";
import { deviceTokenFrom } from "@/app/api/profile/token";
import {
  parseUpstreamConciergeResponse,
  upstreamError,
  UUID_PATTERN,
} from "@/app/api/concierge/response";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ conversationId: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const token = deviceTokenFrom(request);
  if (!token) {
    return NextResponse.json(
      { error: "A valid X-Device-Token header is required" },
      { status: 400 },
    );
  }
  const { conversationId } = await params;
  if (!UUID_PATTERN.test(conversationId)) {
    return NextResponse.json(
      { error: "A valid conversation ID is required" },
      { status: 400 },
    );
  }

  let body: { interruptId?: unknown; decision?: unknown; reason?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "A JSON body is required" },
      { status: 400 },
    );
  }
  if (
    typeof body.interruptId !== "string" ||
    body.interruptId.length < 1 ||
    body.interruptId.length > 255 ||
    (body.decision !== "approve" && body.decision !== "reject") ||
    (body.reason !== undefined &&
      (typeof body.reason !== "string" || body.reason.length > 500))
  ) {
    return NextResponse.json(
      {
        error: "A valid interrupt and approve or reject decision are required",
      },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(
      `${apiBaseUrl()}/concierge/conversations/${encodeURIComponent(conversationId)}/decision`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Token": token,
        },
        body: JSON.stringify({
          interrupt_id: body.interruptId,
          decision: body.decision,
          reason: body.reason ?? null,
        }),
        cache: "no-store",
      },
    );
    if (!upstream.ok) return upstreamError(upstream);
    const response = parseUpstreamConciergeResponse(await upstream.json());
    if (!response) {
      return NextResponse.json(
        { error: "The concierge returned an invalid response." },
        { status: 502 },
      );
    }
    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "The concierge is unavailable right now." },
      { status: 503 },
    );
  }
}
