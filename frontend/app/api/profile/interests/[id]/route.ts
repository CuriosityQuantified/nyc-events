import { NextRequest, NextResponse } from "next/server";
import { apiBaseUrl } from "@/app/data/events";
import { deviceTokenFrom } from "../../token";

export const dynamic = "force-dynamic";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = deviceTokenFrom(request);
  if (!token) {
    return NextResponse.json(
      { error: "A valid X-Device-Token header is required" },
      { status: 400 },
    );
  }
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json(
      { error: "id must be an Interest UUID" },
      { status: 400 },
    );
  }
  try {
    const upstream = await fetch(
      `${apiBaseUrl()}/profile/interests/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: { "X-Device-Token": token },
        cache: "no-store",
      },
    );
    if (!upstream.ok && upstream.status !== 404) {
      return NextResponse.json(
        { error: "Unfollowing is unavailable" },
        { status: 503 },
      );
    }
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { error: "Unfollowing is unavailable" },
      { status: 503 },
    );
  }
}
