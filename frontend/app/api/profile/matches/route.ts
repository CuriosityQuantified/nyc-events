import { NextRequest, NextResponse } from "next/server";
import {
  apiBaseUrl,
  apiToUiEvent,
  parseEventResponse,
} from "@/app/data/events";
import { deviceTokenFrom } from "../token";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = deviceTokenFrom(request);
  if (!token) {
    return NextResponse.json(
      { error: "A valid X-Device-Token header is required" },
      { status: 400 },
    );
  }
  const page = request.nextUrl.searchParams.get("page") ?? "1";
  const pageSize = request.nextUrl.searchParams.get("page_size") ?? "20";
  if (!/^\d+$/.test(page) || Number(page) < 1) {
    return NextResponse.json(
      { error: "page must be a positive integer" },
      { status: 400 },
    );
  }
  if (
    !/^\d+$/.test(pageSize) ||
    Number(pageSize) < 1 ||
    Number(pageSize) > 100
  ) {
    return NextResponse.json(
      { error: "page_size must be an integer from 1 to 100" },
      { status: 400 },
    );
  }
  try {
    const upstream = await fetch(
      `${apiBaseUrl()}/profile/matches?page=${page}&page_size=${pageSize}`,
      { headers: { "X-Device-Token": token }, cache: "no-store" },
    );
    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Matches are unavailable" },
        { status: 503 },
      );
    }
    const data = (await upstream.json()) as {
      events: unknown[];
      page: number;
      page_size: number;
      total: number;
    };
    return NextResponse.json({
      events: data.events.map((event) =>
        apiToUiEvent(parseEventResponse(event)),
      ),
      page: data.page,
      pageSize: data.page_size,
      total: data.total,
    });
  } catch {
    return NextResponse.json(
      { error: "Matches are unavailable" },
      { status: 503 },
    );
  }
}
