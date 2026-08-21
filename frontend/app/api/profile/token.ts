import type { NextRequest } from "next/server";

const TOKEN_PATTERN = /^[A-Za-z0-9._~-]{32,255}$/;

export function deviceTokenFrom(request: NextRequest): string | null {
  const token = request.headers.get("x-device-token");
  return token && TOKEN_PATTERN.test(token) ? token : null;
}
