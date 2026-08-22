import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getDeviceToken,
  prepareDeviceTokenRotation,
  resetDeviceTokenMemoryForTest,
} from "./device-token";

beforeEach(() => {
  window.localStorage.clear();
  resetDeviceTokenMemoryForTest();
});

afterEach(() => vi.restoreAllMocks());

describe("checked device token rotation", () => {
  it("establishes and verifies a replacement before success", () => {
    const original = getDeviceToken();
    const rotation = prepareDeviceTokenRotation();

    expect(rotation.ok).toBe(true);
    if (!rotation.ok) return;
    expect(rotation.replacement).not.toBe(original);
    expect(window.localStorage.getItem("eventmatch-device-token")).toBe(
      rotation.replacement,
    );
    expect(getDeviceToken()).toBe(rotation.replacement);
  });

  it("succeeds when removeItem fails but overwrite and readback work", () => {
    const original = getDeviceToken();
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    const rotation = prepareDeviceTokenRotation();
    expect(rotation.ok).toBe(true);
    if (!rotation.ok) return;
    expect(rotation.replacement).not.toBe(original);
    expect(window.localStorage.getItem("eventmatch-device-token")).toBe(
      rotation.replacement,
    );
  });

  it("does not report success when both removeItem and setItem fail", () => {
    const original = getDeviceToken();
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    const rotation = prepareDeviceTokenRotation();
    expect(rotation).toEqual({ ok: false, previousRestored: true });
    expect(window.localStorage.getItem("eventmatch-device-token")).toBe(
      original,
    );
  });

  it("restores and verifies the old token after a replacement write fails", () => {
    const original = getDeviceToken();
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    setItem.mockImplementationOnce(() => {
      throw new Error("replacement blocked");
    });

    const rotation = prepareDeviceTokenRotation();
    expect(rotation).toEqual({ ok: false, previousRestored: true });
    expect(window.localStorage.getItem("eventmatch-device-token")).toBe(
      original,
    );
  });

  it("fails closed when persistent storage cannot be read", () => {
    getDeviceToken();
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(prepareDeviceTokenRotation()).toEqual({
      ok: false,
      previousRestored: false,
    });
  });

  it("restores and verifies the previous token after later sign-out failure", () => {
    const original = getDeviceToken();
    const rotation = prepareDeviceTokenRotation();
    expect(rotation.ok).toBe(true);
    if (!rotation.ok) return;

    expect(rotation.restore()).toEqual({ restored: true });
    expect(window.localStorage.getItem("eventmatch-device-token")).toBe(
      original,
    );
    expect(getDeviceToken()).toBe(original);
  });

  it("updates memory and announces profile refresh after another tab rotates", () => {
    const original = getDeviceToken();
    const replacement = "b".repeat(64);
    const changed = vi.fn();
    window.addEventListener("eventmatch:profile-changed", changed);

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "eventmatch-device-token",
        oldValue: original,
        newValue: replacement,
      }),
    );

    expect(getDeviceToken()).toBe(replacement);
    expect(changed).toHaveBeenCalledOnce();
    window.removeEventListener("eventmatch:profile-changed", changed);
  });
});
