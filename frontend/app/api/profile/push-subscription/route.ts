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
  try {
    const upstream = await fetch(`${apiBaseUrl()}/profile/push-subscription`, {
      headers: { "X-Device-Token": token },
      cache: "no-store",
    });
    if (!upstream.ok) throw new Error("upstream rejected request");
    return NextResponse.json(await upstream.json());
  } catch {
    return NextResponse.json(
      { error: "Push settings are unavailable" },
      { status: 503 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const token = deviceTokenFrom(request);
  if (!token) return badToken();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "A JSON body is required" },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(`${apiBaseUrl()}/profile/push-subscription`, {
      method: "PUT",
      headers: {
        "X-Device-Token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await upstream.json();
    if (upstream.status === 409 || upstream.status === 422) {
      return NextResponse.json(data, { status: upstream.status });
    }
    if (!upstream.ok) throw new Error("upstream rejected request");
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Push settings are unavailable" },
      { status: 503 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const token = deviceTokenFrom(request);
  if (!token) return badToken();
  try {
    const upstream = await fetch(`${apiBaseUrl()}/profile/push-subscription`, {
      method: "DELETE",
      headers: { "X-Device-Token": token },
      cache: "no-store",
    });
    if (!upstream.ok) throw new Error("upstream rejected request");
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { error: "Push settings are unavailable" },
      { status: 503 },
    );
  }
}
