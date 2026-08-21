import type { ParkEvent } from "./events";
import { getDeviceToken } from "./device-token";

export class SavedApiError extends Error {
  constructor(readonly status: number) {
    super(`Saved API returned HTTP ${status}`);
  }
}

function headers(): HeadersInit {
  return { "X-Device-Token": getDeviceToken() };
}

const PAGE_SIZE = 100;
const MAX_PAGES = 20;

/** Fetch every Saved Event for this device's anonymous Profile. */
export async function fetchSavedEvents(): Promise<ParkEvent[]> {
  const collected: ParkEvent[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const response = await fetch(
      `/api/profile/saved?page=${page}&page_size=${PAGE_SIZE}`,
      { headers: headers(), cache: "no-store" },
    );
    if (!response.ok) throw new SavedApiError(response.status);
    const data = (await response.json()) as {
      events: ParkEvent[];
      total: number;
    };
    collected.push(...data.events);
    if (collected.length >= data.total || data.events.length === 0) break;
  }
  return collected;
}

export async function saveEventRemote(guid: string): Promise<void> {
  const response = await fetch(
    `/api/profile/saved/${encodeURIComponent(guid)}`,
    { method: "PUT", headers: headers() },
  );
  if (!response.ok) throw new SavedApiError(response.status);
}

export async function unsaveEventRemote(guid: string): Promise<void> {
  const response = await fetch(
    `/api/profile/saved/${encodeURIComponent(guid)}`,
    { method: "DELETE", headers: headers() },
  );
  if (!response.ok && response.status !== 404) {
    throw new SavedApiError(response.status);
  }
}
