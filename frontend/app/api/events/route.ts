import { NextRequest, NextResponse } from "next/server";
import { getEvents } from "@/app/data/events";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const value = request.nextUrl.searchParams.get("page") ?? "1";
  if (!/^\d+$/.test(value) || Number(value) < 1) {
    return NextResponse.json(
      { error: "page must be a positive integer" },
      { status: 400 },
    );
  }
  try {
    return NextResponse.json(await getEvents(Number(value)));
  } catch {
    return NextResponse.json(
      { error: "Events are unavailable" },
      { status: 503 },
    );
  }
}
