import { NextRequest, NextResponse } from "next/server";
import { getFilteredEvents } from "@/app/data/events";
import { parseStrictFilterSearchParams } from "@/app/data/filters";

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
    const filters = parseStrictFilterSearchParams(request.nextUrl.searchParams);
    return NextResponse.json(await getFilteredEvents(filters, Number(value)));
  } catch (error) {
    if (error instanceof TypeError && error.message.startsWith("Invalid ")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Events are unavailable" },
      { status: 503 },
    );
  }
}
