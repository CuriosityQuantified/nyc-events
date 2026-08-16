import { NextRequest, NextResponse } from "next/server";
import { apiBaseUrl } from "@/app/data/events";
import { deviceTokenFrom } from "@/app/api/profile/token";
import {
  parseUpstreamConciergeResponse,
  upstreamError,
  UUID_PATTERN,
} from "@/app/api/concierge/response";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const token = deviceTokenFrom(request);
  if (!token) {
    return NextResponse.json(
      { error: "A valid X-Device-Token header is required" },
      { status: 400 },
    );
  }

  let body: { message?: unknown; conversationId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "A JSON body is required" },
      { status: 400 },
    );
  }
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const conversationId = body.conversationId;
  if (
    message.length < 1 ||
    message.length > 2000 ||
    (conversationId !== null &&
      conversationId !== undefined &&
      (typeof conversationId !== "string" ||
        !UUID_PATTERN.test(conversationId)))
  ) {
    return NextResponse.json(
      { error: "message must contain 1 to 2000 characters" },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(`${apiBaseUrl()}/concierge/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Device-Token": token,
      },
      body: JSON.stringify({
        message,
        conversation_id: conversationId ?? null,
      }),
      cache: "no-store",
    });
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
