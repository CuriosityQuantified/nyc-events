import { beforeEach, describe, expect, it, vi } from "vitest";

const { getEvent, EventsApiError } = vi.hoisted(() => ({
  getEvent: vi.fn(),
  EventsApiError: class EventsApiError extends Error {
    constructor(readonly status: number) {
      super(`Events API returned HTTP ${status}`);
    }
  },
}));

vi.mock("@/app/data/events", () => ({ getEvent, EventsApiError }));

import { GET } from "./route";

beforeEach(() => {
  getEvent.mockReset();
  getEvent.mockResolvedValue({ guid: "event-1" });
});

describe("event detail route", () => {
  it("retrieves one source event by guid", async () => {
    const response = await GET(
      new Request("http://localhost/api/events/event-1"),
      {
        params: Promise.resolve({ guid: "event-1" }),
      },
    );

    expect(response.status).toBe(200);
    expect(getEvent).toHaveBeenCalledWith("event-1");
    await expect(response.json()).resolves.toEqual({ guid: "event-1" });
  });

  it("preserves a backend not-found response", async () => {
    getEvent.mockRejectedValueOnce(new EventsApiError(404));
    const response = await GET(
      new Request("http://localhost/api/events/missing"),
      {
        params: Promise.resolve({ guid: "missing" }),
      },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Event not found",
    });
  });

  it("rejects invalid identifiers before upstream access", async () => {
    for (const guid of ["", "x".repeat(257)]) {
      const response = await GET(
        new Request("http://localhost/api/events/test"),
        {
          params: Promise.resolve({ guid }),
        },
      );
      expect(response.status).toBe(400);
    }
    expect(getEvent).not.toHaveBeenCalled();
  });

  it("fails closed when the event service is unavailable", async () => {
    getEvent.mockRejectedValueOnce(new Error("network failure"));
    const response = await GET(
      new Request("http://localhost/api/events/event-1"),
      {
        params: Promise.resolve({ guid: "event-1" }),
      },
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Event is unavailable",
    });
  });
});
