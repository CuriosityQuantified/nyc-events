import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/app/data/events", () => ({
  apiBaseUrl: () => "https://api.invalid",
}));

import { DELETE, GET, PUT } from "./route";

const token = "device-token-push-subscription-abcdefghijklmnopqrstuvwxyz";
const payload = {
  endpoint: "https://fcm.googleapis.com/fcm/send/subscription",
  keys: { p256dh: "p".repeat(32), auth: "a".repeat(16) },
};

afterEach(() => vi.restoreAllMocks());

function request(method: string, body?: unknown, headers = true) {
  return new NextRequest("http://localhost/api/profile/push-subscription", {
    method,
    headers: headers
      ? {
          "X-Device-Token": token,
          "Content-Type": "application/json",
          Authorization: "Bearer attacker",
        }
      : undefined,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("push-subscription same-origin proxy", () => {
  it("forwards GET, PUT, and DELETE with only the device identity", async () => {
    const upstream = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        Response.json({ enabled: false, vapid_public_key: "key" }),
      )
      .mockResolvedValueOnce(Response.json({ enabled: true }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    expect((await GET(request("GET"))).status).toBe(200);
    expect((await PUT(request("PUT", payload))).status).toBe(200);
    expect((await DELETE(request("DELETE"))).status).toBe(204);

    for (const call of upstream.mock.calls) {
      expect(call[0]).toBe("https://api.invalid/profile/push-subscription");
      expect(
        (call[1]?.headers as Record<string, string>)["X-Device-Token"],
      ).toBe(token);
      expect(
        (call[1]?.headers as Record<string, string>).Authorization,
      ).toBeUndefined();
    }
    expect(upstream.mock.calls[1]?.[1]?.body).toBe(JSON.stringify(payload));
  });

  it("rejects missing identity and malformed JSON before an upstream call", async () => {
    const upstream = vi.spyOn(globalThis, "fetch");
    expect((await GET(request("GET", undefined, false))).status).toBe(400);
    expect(
      (
        await PUT(
          new NextRequest("http://localhost/api/profile/push-subscription", {
            method: "PUT",
            headers: { "X-Device-Token": token },
            body: "not-json",
          }),
        )
      ).status,
    ).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });
});
