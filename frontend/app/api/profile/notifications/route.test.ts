import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/app/data/events", () => ({
  apiBaseUrl: () => "https://api.invalid",
}));

import { GET } from "./route";

const token = "device-token-notifications-abcdefghijklmnopqrstuvwxyz";

afterEach(() => vi.restoreAllMocks());

describe("notification same-origin proxy", () => {
  it("forwards only the validated device identity and bounded query", async () => {
    const upstream = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        Response.json({ notifications: [], page: 2, page_size: 10, total: 0 }),
      );
    const response = await GET(
      new NextRequest(
        "http://localhost/api/profile/notifications?page=2&page_size=10",
        {
          headers: {
            "X-Device-Token": token,
            Authorization: "Bearer attacker",
          },
        },
      ),
    );

    expect(response.status).toBe(200);
    expect(upstream).toHaveBeenCalledWith(
      "https://api.invalid/profile/notifications?page=2&page_size=10",
      expect.objectContaining({
        headers: { "X-Device-Token": token },
        cache: "no-store",
      }),
    );
  });

  it("rejects missing identity and invalid pagination without an upstream call", async () => {
    const upstream = vi.spyOn(globalThis, "fetch");
    expect(
      (await GET(new NextRequest("http://localhost/api/profile/notifications")))
        .status,
    ).toBe(400);
    expect(
      (
        await GET(
          new NextRequest(
            "http://localhost/api/profile/notifications?page=../secret",
            {
              headers: { "X-Device-Token": token },
            },
          ),
        )
      ).status,
    ).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });
});
