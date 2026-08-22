import { announceProfileChanged } from "./profile-sync";

const STORAGE_KEY = "eventmatch-device-token";
const TOKEN_PATTERN = /^[A-Za-z0-9._~-]{32,255}$/;

let memoryToken: string | null = null;
let listeningForRotation = false;

function listenForRotation(): void {
  if (listeningForRotation || typeof window === "undefined") return;
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    memoryToken =
      event.newValue && TOKEN_PATTERN.test(event.newValue)
        ? event.newValue
        : null;
    announceProfileChanged();
  });
  listeningForRotation = true;
}

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

/** Return this browser's anonymous device token, creating it on first use. */
export function getDeviceToken(): string {
  listenForRotation();
  if (memoryToken) return memoryToken;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && TOKEN_PATTERN.test(stored)) {
      memoryToken = stored;
      return stored;
    }
    const created = generateToken();
    window.localStorage.setItem(STORAGE_KEY, created);
    memoryToken = created;
    return created;
  } catch {
    memoryToken = generateToken();
    return memoryToken;
  }
}

export type DeviceTokenRestoreResult =
  | { restored: true }
  | { restored: false; isolationVerified: boolean };

export type DeviceTokenRotationResult =
  | {
      ok: true;
      replacement: string;
      restore: () => DeviceTokenRestoreResult;
    }
  | { ok: false; previousRestored: boolean };

function persistAndVerify(token: string): boolean {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // setItem can still overwrite the old value when removal is blocked.
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // The requested token can already be present. Verification is authoritative.
  }
  try {
    return window.localStorage.getItem(STORAGE_KEY) === token;
  } catch {
    return false;
  }
}

function storedTokenIs(token: string): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === token;
  } catch {
    return false;
  }
}

/**
 * Persist and read back a replacement before the caller ends its account
 * session. The returned restore operation is for a later Clerk sign-out
 * failure. A false result means persistent isolation was not proved.
 */
export function prepareDeviceTokenRotation(): DeviceTokenRotationResult {
  const previous = getDeviceToken();
  try {
    window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return { ok: false, previousRestored: false };
  }

  const replacement = generateToken();
  if (!persistAndVerify(replacement)) {
    const previousRestored = persistAndVerify(previous);
    memoryToken = previousRestored ? previous : null;
    return { ok: false, previousRestored };
  }

  memoryToken = replacement;
  return {
    ok: true,
    replacement,
    restore: () => {
      if (persistAndVerify(previous)) {
        memoryToken = previous;
        return { restored: true };
      }
      const isolationVerified = storedTokenIs(replacement);
      memoryToken = isolationVerified ? replacement : null;
      return { restored: false, isolationVerified };
    },
  };
}

/** Test-only reset of module state. It does not alter browser storage. */
export function resetDeviceTokenMemoryForTest(): void {
  memoryToken = null;
}
