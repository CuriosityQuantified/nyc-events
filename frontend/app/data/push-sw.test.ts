// @vitest-environment node
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const source = readFileSync(
  new URL("../../public/push-sw.js", import.meta.url),
  "utf8",
);

type Handler = (event: {
  notification: { data?: { url?: string }; close: () => void };
  waitUntil: (promise: Promise<unknown>) => void;
}) => void;

function installWorker() {
  const handlers = new Map<string, Handler>();
  const openWindow = vi.fn().mockResolvedValue(undefined);
  const context = {
    URL,
    Promise,
    self: {
      location: { origin: "https://events.example" },
      registration: { showNotification: vi.fn() },
      addEventListener: (name: string, handler: Handler) =>
        handlers.set(name, handler),
    },
    clients: {
      matchAll: vi.fn().mockResolvedValue([]),
      openWindow,
    },
  };
  runInNewContext(source, context);
  return { handlers, openWindow };
}

async function click(handler: Handler, url: string) {
  let pending: Promise<unknown> = Promise.resolve();
  handler({
    notification: { data: { url }, close: vi.fn() },
    waitUntil: (promise) => {
      pending = promise;
    },
  });
  await pending;
}

describe("push service worker notification action", () => {
  it("opens the same-origin Event in one step", async () => {
    const { handlers, openWindow } = installWorker();
    await click(handlers.get("notificationclick")!, "/events/event-25");
    expect(openWindow).toHaveBeenCalledWith(
      "https://events.example/events/event-25",
    );
  });

  it("does not open a cross-origin or non-Event payload", async () => {
    for (const target of [
      "https://attacker.example/events/event-25",
      "/admin",
    ]) {
      const { handlers, openWindow } = installWorker();
      await click(handlers.get("notificationclick")!, target);
      expect(openWindow).toHaveBeenCalledWith("https://events.example/saved");
    }
  });
});
