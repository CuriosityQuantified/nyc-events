import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

const event = {
  coordinates: {
    value: [{ latitude: 40.71234567, longitude: -73.91234567 }],
  },
};

beforeEach(() => {
  getEvent.mockReset();
  getEvent.mockResolvedValue(event);
  vi.stubEnv("GOOGLE_MAPS_STATIC_API_KEY", "server-secret-key");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function request(query: string): Request {
  return new Request(`http://localhost/api/maps/thumbnail?${query}`);
}

describe("Issue #26 server-only Static Maps endpoint", () => {
  it("uses only validated coordinates and a fixed rendering variant", async () => {
    const fetchMock = vi.fn<
      (input: string | URL | Request) => Promise<Response>
    >(
      async () =>
        new Response(new Uint8Array([1, 2, 3]), {
          headers: { "content-type": "image/png" },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(
      request("guid=2%2C146%2C733&variant=compact&location=0"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(getEvent).toHaveBeenCalledWith("2,146,733");
    const upstream = new URL(fetchMock.mock.calls[0][0].toString());
    expect(upstream.origin).toBe("https://maps.googleapis.com");
    expect(upstream.searchParams.get("center")).toBe("40.712346,-73.912346");
    expect(upstream.searchParams.get("size")).toBe("640x360");
    expect(upstream.searchParams.get("zoom")).toBe("14");
    expect(upstream.searchParams.get("scale")).toBe("2");
    expect(upstream.searchParams.get("key")).toBe("server-secret-key");
  });

  it("rejects malformed ids, variants, indexes, and query injection", async () => {
    for (const query of [
      "guid=%3Cscript%3E&variant=compact&location=0",
      "guid=event-1&variant=huge&location=0",
      "guid=event-1&variant=compact&location=99",
      "guid=event-1&variant=compact&location=0&url=https://evil.test",
      "guid=event-1&variant=compact&location=0&zoom=1",
    ]) {
      expect((await GET(request(query))).status).toBe(400);
    }
    expect(getEvent).not.toHaveBeenCalled();
  });

  it("never contacts Google for invalid or null-island coordinates", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    for (const coordinates of [
      [],
      [{ latitude: 0, longitude: 0 }],
      [{ latitude: 91, longitude: 2 }],
    ]) {
      getEvent.mockResolvedValueOnce({ coordinates: { value: coordinates } });
      const response = await GET(
        request("guid=event-1&variant=compact&location=0"),
      );
      expect(response.status).toBe(404);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("indexes the same validated, de-duplicated coordinates as the browser", async () => {
    const fetchMock = vi.fn<
      (input: string | URL | Request) => Promise<Response>
    >(
      async () =>
        new Response(new Uint8Array([1, 2, 3]), {
          headers: { "content-type": "image/png" },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    getEvent.mockResolvedValue({
      coordinates: {
        value: [
          { latitude: 0, longitude: 0 },
          { latitude: 40.7, longitude: -73.9 },
          { latitude: 40.7, longitude: -73.9 },
          { latitude: 40.8, longitude: -73.8 },
        ],
      },
    });

    expect(
      (await GET(request("guid=event-1&variant=detail&location=0"))).status,
    ).toBe(200);
    expect(
      (await GET(request("guid=event-1&variant=detail&location=1"))).status,
    ).toBe(200);
    expect(
      (await GET(request("guid=event-1&variant=detail&location=2"))).status,
    ).toBe(404);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(
      new URL(fetchMock.mock.calls[0][0].toString()).searchParams.get("center"),
    ).toBe("40.700000,-73.900000");
    expect(
      new URL(fetchMock.mock.calls[1][0].toString()).searchParams.get("center"),
    ).toBe("40.800000,-73.800000");
  });

  it("fails once without reflecting credentials or upstream details", async () => {
    const fetchMock = vi.fn<
      (input: string | URL | Request) => Promise<Response>
    >(
      async () =>
        new Response("rate limited: server-secret-key", { status: 429 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(
      request("guid=event-1&variant=detail&location=0"),
    );
    const body = await response.text();

    expect(response.status).toBe(502);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(body).not.toContain("server-secret-key");
    expect(body).not.toContain("rate limited");
  });

  it("does not expose a client URL when the server key is missing", async () => {
    vi.stubEnv("GOOGLE_MAPS_STATIC_API_KEY", "");
    const response = await GET(
      request("guid=event-1&variant=compact&location=0"),
    );
    expect(response.status).toBe(503);
    expect(getEvent).not.toHaveBeenCalled();
    expect(await response.text()).not.toContain("maps.googleapis.com");
  });
});
