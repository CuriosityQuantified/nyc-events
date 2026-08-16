import { NextRequest, NextResponse } from "next/server";
import { apiBaseUrl } from "@/app/data/events";
import { deviceTokenFrom } from "../../token";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ guid: string }> };

function badToken() {
  return NextResponse.json(
    { error: "A valid X-Device-Token header is required" },
    { status: 400 },
  );
}

function badGuid() {
  return NextResponse.json(
    { error: "guid must contain 1 to 255 characters" },
    { status: 400 },
  );
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const token = deviceTokenFrom(request);
  if (!token) return badToken();
  const { guid } = await params;
  if (!guid || guid.length > 255) return badGuid();
  try {
    const upstream = await fetch(
      `${apiBaseUrl()}/profile/saved/${encodeURIComponent(guid)}`,
      {
        method: "PUT",
        headers: { "X-Device-Token": token },
        cache: "no-store",
      },
    );
    if (upstream.status === 404) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Saving is unavailable" },
        { status: 503 },
      );
    }
    return NextResponse.json(await upstream.json());
  } catch {
    return NextResponse.json(
      { error: "Saving is unavailable" },
      { status: 503 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const token = deviceTokenFrom(request);
  if (!token) return badToken();
  const { guid } = await params;
  if (!guid || guid.length > 255) return badGuid();
  try {
    const upstream = await fetch(
      `${apiBaseUrl()}/profile/saved/${encodeURIComponent(guid)}`,
      {
        method: "DELETE",
        headers: { "X-Device-Token": token },
        cache: "no-store",
      },
    );
    if (!upstream.ok && upstream.status !== 404) {
      return NextResponse.json(
        { error: "Removing is unavailable" },
        { status: 503 },
      );
    }
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { error: "Removing is unavailable" },
      { status: 503 },
    );
  }
}
