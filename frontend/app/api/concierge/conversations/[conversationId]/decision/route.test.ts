import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/app/data/events", () => ({
  apiBaseUrl: () => "http://backend.test",
}));

import { POST } from "./route";

const TOKEN = "b".repeat(64);
const CONVERSATION_ID = "a1d248cb-e745-4831-bb0d-3ba6e97e3af6";

beforeEach(() => {
  vi.restoreAllMocks();
});

function request(body: unknown) {
  return new NextRequest(
    `http://localhost/api/concierge/conversations/${CONVERSATION_ID}/decision`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Device-Token": TOKEN,
      },
      body: JSON.stringify(body),
    },
  );
}

describe("concierge approval proxy", () => {
  it("resumes the exact conversation and interrupt", async () => {
    const upstreamFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        conversation_id: CONVERSATION_ID,
        status: "completed",
        response: "The event is saved.",
        approval: null,
      }),
    );

    const response = await POST(
      request({ interruptId: "interrupt-1", decision: "approve" }),
      { params: Promise.resolve({ conversationId: CONVERSATION_ID }) },
    );

    expect(response.status).toBe(200);
    expect(upstreamFetch).toHaveBeenCalledWith(
      `http://backend.test/concierge/conversations/${CONVERSATION_ID}/decision`,
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

  it("rejects malformed IDs and decisions before upstream access", async () => {
    const upstreamFetch = vi.spyOn(globalThis, "fetch");
    const badConversation = await POST(
      request({ interruptId: "interrupt-1", decision: "approve" }),
      { params: Promise.resolve({ conversationId: "not-a-uuid" }) },
    );
    const badDecision = await POST(
      request({ interruptId: "interrupt-1", decision: "edit" }),
      { params: Promise.resolve({ conversationId: CONVERSATION_ID }) },
    );

    expect(badConversation.status).toBe(400);
    expect(badDecision.status).toBe(400);
    expect(upstreamFetch).not.toHaveBeenCalled();
  });

  it("preserves a stale-approval conflict without leaking backend data", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ detail: "Save approval is stale" }, { status: 409 }),
    );
    const response = await POST(
      request({ interruptId: "old-interrupt", decision: "approve" }),
      { params: Promise.resolve({ conversationId: CONVERSATION_ID }) },
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Save approval is stale",
    });
  });
});
