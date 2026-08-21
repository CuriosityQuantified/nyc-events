import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/app/data/events", () => ({
  apiBaseUrl: () => "http://backend.test",
}));

import { POST } from "./route";

const token = "d".repeat(64);
const conversationId = "23b77503-d8a6-4178-a849-9bf7c39fefb9";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("concierge decision stream proxy", () => {
  it("resumes the exact approved interrupt as an event stream", async () => {
    const upstreamFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response('event: token\ndata: {"text":"Saved"}\n\n', {
        headers: { "Content-Type": "text/event-stream" },
      }),
    );
    const request = new NextRequest(
      `http://localhost/api/concierge/conversations/${conversationId}/decision/stream`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Token": token,
        },
        body: JSON.stringify({
          interruptId: "interrupt-1",
          decision: "approve",
        }),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ conversationId }),
    });

    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(upstreamFetch).toHaveBeenCalledWith(
      `http://backend.test/concierge/conversations/${conversationId}/decision/stream`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          interrupt_id: "interrupt-1",
          decision: "approve",
          reason: null,
        }),
      }),
    );
  });

  it("preserves a stale-approval conflict", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ detail: "Save approval is stale" }, { status: 409 }),
    );
    const response = await POST(
      new NextRequest(
        `http://localhost/api/concierge/conversations/${conversationId}/decision/stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Device-Token": token,
          },
          body: JSON.stringify({
            interruptId: "old-interrupt",
            decision: "approve",
          }),
        },
      ),
      { params: Promise.resolve({ conversationId }) },
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Save approval is stale",
    });
  });
});
