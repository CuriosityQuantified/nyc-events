const STORAGE_KEY = "eventmatch-device-token";
const TOKEN_PATTERN = /^[A-Za-z0-9._~-]{32,255}$/;

let memoryToken: string | null = null;

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

/**
 * Return this browser's anonymous device token, creating it on first use.
 * Falls back to an in-memory token when storage is unavailable (private
 * browsing), so saving still works for the current visit.
 */
export function getDeviceToken(): string {
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
