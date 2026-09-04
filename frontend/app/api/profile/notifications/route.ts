import { NextRequest, NextResponse } from "next/server";
import { apiBaseUrl } from "@/app/data/events";
import { deviceTokenFrom } from "../token";

export const dynamic = "force-dynamic";

function badToken() {
  return NextResponse.json(
    { error: "A valid X-Device-Token header is required" },
    { status: 400 },
  );
}

export async function GET(request: NextRequest) {
  const token = deviceTokenFrom(request);
  if (!token) return badToken();

  const page = request.nextUrl.searchParams.get("page") ?? "1";
  const pageSize = request.nextUrl.searchParams.get("page_size") ?? "20";
  if (!/^\d+$/.test(page) || !/^\d+$/.test(pageSize)) {
    return NextResponse.json({ error: "Invalid pagination" }, { status: 400 });
  }

  try {
    const upstream = await fetch(
      `${apiBaseUrl()}/profile/notifications?page=${encodeURIComponent(page)}&page_size=${encodeURIComponent(pageSize)}`,
      {
        headers: { "X-Device-Token": token },
        cache: "no-store",
      },
    );
    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Notifications are unavailable" },
        { status: 503 },
      );
    }
    return NextResponse.json(await upstream.json());
  } catch {
    return NextResponse.json(
      { error: "Notifications are unavailable" },
      { status: 503 },
    );
  }
}
