import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const auth = vi.hoisted(() => vi.fn());
const getToken = vi.hoisted(() => vi.fn());

vi.mock("@clerk/nextjs/server", () => ({ auth }));
vi.mock("@/app/data/clerk", () => ({
  clerkConfiguration: () => ({
    status: "configured",
    publishableKey: "public-test-value",
  }),
}));
vi.mock("@/app/data/events", () => ({
  apiBaseUrl: () => "https://api.invalid",
}));

import { POST } from "./route";

const deviceToken = "d".repeat(64);

function request() {
  return new NextRequest("http://localhost/api/profile/claim", {
    method: "POST",
    headers: { "X-Device-Token": deviceToken },
  });
}

beforeEach(() => {
  getToken.mockReset().mockResolvedValue("session-token");
  auth.mockReset().mockResolvedValue({ getToken });
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => vi.unstubAllGlobals());

describe("POST /api/profile/claim", () => {
  it("rejects a fixture-style client identity without a real Clerk token", async () => {
    getToken.mockResolvedValue(null);

    const response = await POST(request());

    expect(response.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("controls auth provider failures", async () => {
    auth.mockRejectedValue(new Error("provider unavailable"));

    const response = await POST(request());

    expect(response.status).toBe(503);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([401, 403])("preserves upstream HTTP %s", async (status) => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status }));

    const response = await POST(request());

    expect(response.status).toBe(status);
  });

  it("rejects a malformed upstream success body", async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json({ id: 42, claimed: "yes" }),
    );

    const response = await POST(request());

    expect(response.status).toBe(503);
  });

  it("returns only a validated claimed Profile", async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json({ id: "profile-1", claimed: true, ignored: "value" }),
    );

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      profileId: "profile-1",
      claimed: true,
    });
  });
});
