import { afterEach, describe, expect, it, vi } from "vitest";
import {
  disableWebPush,
  enableWebPush,
  fetchNotifications,
} from "./notifications";

const subscription = {
  toJSON: () => ({
    endpoint: "https://push.example.test/subscription",
    keys: { p256dh: "public-key", auth: "auth-key" },
  }),
  unsubscribe: vi.fn().mockResolvedValue(true),
};

function installBrowser(permission: NotificationPermission) {
  const subscribe = vi.fn().mockResolvedValue(subscription);
  const getSubscription = vi.fn().mockResolvedValue(null);
  const registration = { pushManager: { subscribe, getSubscription } };
  Object.defineProperty(globalThis, "Notification", {
    configurable: true,
    value: { requestPermission: vi.fn().mockResolvedValue(permission) },
  });
  Object.defineProperty(globalThis.navigator, "serviceWorker", {
    configurable: true,
    value: {
      register: vi.fn().mockResolvedValue(registration),
      getRegistration: vi.fn().mockResolvedValue(registration),
    },
  });
  Object.defineProperty(globalThis, "PushManager", {
    configurable: true,
    value: class PushManager {},
  });
  return { subscribe, registration };
}

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("Web Push consent", () => {
  it("uses browser permission as consent and sends no email", async () => {
    installBrowser("granted");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));

    await expect(enableWebPush("AQIDBA")).resolves.toBe(true);
    const init = fetchMock.mock.calls[0]?.[1];
    expect(init?.method).toBe("PUT");
    expect(String(init?.body)).not.toContain("email");
    expect(String(init?.body)).toContain("push.example.test");
  });

  it("keeps the app functional when permission is declined", async () => {
    const { subscribe } = installBrowser("denied");
    const fetchMock = vi.spyOn(globalThis, "fetch");

    await expect(enableWebPush("AQIDBA")).resolves.toBe(false);
    expect(subscribe).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("unsubscribes the browser and backend without changing Interests", async () => {
    const { registration } = installBrowser("granted");
    registration.pushManager.getSubscription.mockResolvedValue(subscription);
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 204 }));

    await disableWebPush();
    expect(subscription.unsubscribe).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/profile/push-subscription",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

describe("in-app notifications", () => {
  it("returns a one-step event URL regardless of push support", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        notifications: [
          {
            event_guid: "event-25",
            title: "Park event",
            url: "/events/event-25",
            created_at: "2026-09-02T00:00:00Z",
            read: false,
          },
        ],
      }),
    );
    await expect(fetchNotifications()).resolves.toEqual([
      expect.objectContaining({ url: "/events/event-25" }),
    ]);
  });
});
