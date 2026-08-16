import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/app/data/events", () => ({
  apiBaseUrl: () => "http://backend.test",
}));

import { POST } from "./route";

const TOKEN = "a".repeat(64);
const CONVERSATION_ID = "1d390a08-01e8-4bfd-b1ae-f27f9316af9b";

beforeEach(() => {
  vi.restoreAllMocks();
});

function request(body: unknown, token = TOKEN) {
  return new NextRequest("http://localhost/api/concierge/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Device-Token": token,
    },
    body: JSON.stringify(body),
  });
}

describe("concierge message proxy", () => {
  it("forwards trusted identity and returns a bounded client response", async () => {
    const upstreamFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          conversation_id: CONVERSATION_ID,
          status: "approval_required",
          response: "I found the event.",
          approval: {
            interrupt_id: "interrupt-1",
            action_requests: [
              {
                name: "save_event",
                args: { event_id: "event-guid-1" },
                description: "Save this exact event.",
              },
            ],
            ignored_private_field: "never forwarded",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const response = await POST(
      request({ message: "Save it", conversationId: CONVERSATION_ID }),
    );

    expect(response.status).toBe(200);
    expect(upstreamFetch).toHaveBeenCalledWith(
      "http://backend.test/concierge/messages",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Token": TOKEN,
        },
        body: JSON.stringify({
          message: "Save it",
          conversation_id: CONVERSATION_ID,
        }),
      }),
    );
    await expect(response.json()).resolves.toEqual({
      conversationId: CONVERSATION_ID,
      status: "approval_required",
      response: "I found the event.",
      approval: {
        interruptId: "interrupt-1",
        eventId: "event-guid-1",
        description: "Save this exact event.",
      },
    });
  });

  it("rejects missing identity and invalid input before upstream access", async () => {
    const upstreamFetch = vi.spyOn(globalThis, "fetch");
    const missingToken = await POST(request({ message: "hello" }, "short"));
    const oversized = await POST(request({ message: "x".repeat(2001) }));

    expect(missingToken.status).toBe(400);
    expect(oversized.status).toBe(400);
    expect(upstreamFetch).not.toHaveBeenCalled();
  });

  it("fails closed on a malformed backend response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ status: "completed", response: "missing thread" }),
    );
    const response = await POST(request({ message: "hello" }));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "The concierge returned an invalid response.",
    });
  });
});
