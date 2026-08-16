import { afterEach, describe, expect, it, vi } from "vitest";
import { streamConciergeMessage } from "./concierge";

const conversationId = "4e47687d-bc1a-4d09-94b1-fc81d181c4b4";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("concierge SSE client", () => {
  it("delivers token chunks before the final response completes", async () => {
    const encoder = new TextEncoder();
    let streamController: ReadableStreamDefaultController<Uint8Array>;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        streamController = controller;
        controller.enqueue(
          encoder.encode(
            `event: conversation\ndata: {"conversation_id":"${conversationId}"}\n\n` +
              'event: token\ndata: {"text":"First "}\n\n',
          ),
        );
      },
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(body, {
        headers: { "Content-Type": "text/event-stream" },
      }),
    );
    const tokens: string[] = [];
    const conversations: string[] = [];

    const completion = streamConciergeMessage("What is on?", null, {
      onConversation: (value) => conversations.push(value),
      onToken: (value) => tokens.push(value),
    });
    await vi.waitFor(() => expect(tokens).toEqual(["First "]));
    expect(conversations).toEqual([conversationId]);

    streamController!.enqueue(
      encoder.encode(
        'event: token\ndata: {"text":"answer"}\n\n' +
          `event: done\ndata: {"conversation_id":"${conversationId}","status":"completed","response":"First answer","approval":null}\n\n`,
      ),
    );
    streamController!.close();

    await expect(completion).resolves.toEqual({
      conversationId,
      status: "completed",
      response: "First answer",
      approval: null,
    });
    expect(tokens).toEqual(["First ", "answer"]);
  });

  it("turns an SSE error into a safe client error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        'event: error\ndata: {"error":"The concierge is unavailable right now."}\n\n',
        { headers: { "Content-Type": "text/event-stream" } },
      ),
    );

    await expect(streamConciergeMessage("What is on?", null)).rejects.toThrow(
      "The concierge is unavailable right now.",
    );
  });
});
