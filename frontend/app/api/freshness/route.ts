import { NextResponse } from "next/server";
import { getFreshness } from "@/app/data/events";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getFreshness());
  } catch {
    return NextResponse.json(
      { error: "Freshness is unavailable" },
      { status: 503 },
    );
  }
}
