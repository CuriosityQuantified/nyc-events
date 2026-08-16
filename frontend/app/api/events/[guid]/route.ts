import { NextResponse } from "next/server";
import { EventsApiError, getEvent } from "@/app/data/events";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ guid: string }> },
) {
  const { guid } = await params;
  if (!guid || guid.length > 256) {
    return NextResponse.json(
      { error: "guid must contain 1 to 256 characters" },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await getEvent(guid));
  } catch (error) {
    if (error instanceof EventsApiError && error.status === 404) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Event is unavailable" },
      { status: 503 },
    );
  }
}
