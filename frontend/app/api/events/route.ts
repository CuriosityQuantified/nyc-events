import { NextRequest, NextResponse } from "next/server";
import { getFilteredEvents } from "@/app/data/events";
import { parseStrictFilterSearchParams } from "@/app/data/filters";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const value = request.nextUrl.searchParams.get("page") ?? "1";
  const pageSizeValue = request.nextUrl.searchParams.get("page_size") ?? "12";
  if (!/^\d+$/.test(value) || Number(value) < 1) {
    return NextResponse.json(
      { error: "page must be a positive integer" },
      { status: 400 },
    );
  }
  if (
    !/^\d+$/.test(pageSizeValue) ||
    Number(pageSizeValue) < 1 ||
    Number(pageSizeValue) > 100
  ) {
    return NextResponse.json(
      { error: "page_size must be an integer from 1 to 100" },
      { status: 400 },
    );
  }
  try {
    const filters = parseStrictFilterSearchParams(request.nextUrl.searchParams);
    return NextResponse.json(
      await getFilteredEvents(filters, Number(value), Number(pageSizeValue)),
    );
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
