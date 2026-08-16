import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/app/data/events", () => ({
  apiBaseUrl: () => "http://backend.test",
}));

import { POST } from "./route";

const token = "c".repeat(64);
const eventBody =
  'event: token\ndata: {"text":"Hello"}\n\n' +
  'event: done\ndata: {"status":"completed"}\n\n';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("concierge message stream proxy", () => {
  it("forwards and preserves the unbuffered event stream", async () => {
    const upstreamFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(eventBody, {
        headers: { "Content-Type": "text/event-stream" },
      }),
    );
    const request = new NextRequest(
      "http://localhost/api/concierge/messages/stream",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Token": token,
        },
        body: JSON.stringify({ message: "Hello", conversationId: null }),
      },
    );

    const response = await POST(request);

    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(response.headers.get("x-accel-buffering")).toBe("no");
    await expect(response.text()).resolves.toBe(eventBody);
    expect(upstreamFetch).toHaveBeenCalledWith(
      "http://backend.test/concierge/messages/stream",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ message: "Hello", conversation_id: null }),
      }),
    );
  });

  it("rejects invalid input before opening an upstream stream", async () => {
    const upstreamFetch = vi.spyOn(globalThis, "fetch");
    const response = await POST(
      new NextRequest("http://localhost/api/concierge/messages/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Token": token,
        },
        body: JSON.stringify({ message: "" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(upstreamFetch).not.toHaveBeenCalled();
  });
});
