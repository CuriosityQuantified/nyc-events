import type { ParkEvent } from "./events";
import { getDeviceToken } from "./device-token";

/** Client for Interests and Matches (#22), keyed by the anonymous Profile. */

export type FacetType = "borough" | "category" | "registration";

export type InterestFacet = {
  facetType: FacetType;
  facetValue: string;
};

export type Interest = {
  id: string;
  facetType: FacetType | "composite";
  facetValue: string;
  /** Every member Facet; a single-facet Interest has exactly one. */
  facets: InterestFacet[];
  alertEnabled: boolean;
  origin: string;
};

export class PreferencesApiError extends Error {
  constructor(readonly status: number) {
    super(`Preferences API returned HTTP ${status}`);
  }
}

function headers(extra: HeadersInit = {}): HeadersInit {
  return { "X-Device-Token": getDeviceToken(), ...extra };
}

export async function fetchInterests(): Promise<Interest[]> {
  const response = await fetch("/api/profile/interests", {
    headers: headers(),
    cache: "no-store",
  });
  if (!response.ok) throw new PreferencesApiError(response.status);
  const data = (await response.json()) as { interests: Interest[] };
  return data.interests;
}

export async function followInterest(
  facetType: FacetType,
  facetValue: string,
): Promise<Interest> {
  const response = await fetch("/api/profile/interests", {
    method: "PUT",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      facet_type: facetType,
      facet_value: facetValue,
      alert_enabled: true,
    }),
  });
  if (!response.ok) throw new PreferencesApiError(response.status);
  return (await response.json()) as Interest;
}

/** Follow a combination of Facets as one Interest (AND semantics). */
export async function followCompositeInterest(
  facets: InterestFacet[],
): Promise<Interest> {
  const response = await fetch("/api/profile/interests", {
    method: "PUT",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      facets: facets.map((facet) => ({
        facet_type: facet.facetType,
        facet_value: facet.facetValue,
      })),
      alert_enabled: true,
    }),
  });
  if (!response.ok) throw new PreferencesApiError(response.status);
  return (await response.json()) as Interest;
}

export async function unfollowInterest(interestId: string): Promise<void> {
  const response = await fetch(
    `/api/profile/interests/${encodeURIComponent(interestId)}`,
    { method: "DELETE", headers: headers() },
  );
  if (!response.ok && response.status !== 404) {
    throw new PreferencesApiError(response.status);
  }
}

const PAGE_SIZE = 100;
const MAX_PAGES = 10;

/** Fetch this Profile's active Matches — automatic suggestions, not Saved. */
export async function fetchMatches(): Promise<ParkEvent[]> {
  const collected: ParkEvent[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const response = await fetch(
      `/api/profile/matches?page=${page}&page_size=${PAGE_SIZE}`,
      { headers: headers(), cache: "no-store" },
    );
    if (!response.ok) throw new PreferencesApiError(response.status);
    const data = (await response.json()) as {
      events: ParkEvent[];
      total: number;
    };
    collected.push(...data.events);
    if (collected.length >= data.total || data.events.length === 0) break;
  }
  return collected;
}

/** Promote a Match into Saved; the Match leaves the active list. */
export async function promoteMatch(guid: string): Promise<void> {
  const response = await fetch(
    `/api/profile/matches/${encodeURIComponent(guid)}`,
    { method: "PUT", headers: headers() },
  );
  if (!response.ok) throw new PreferencesApiError(response.status);
}

export async function dismissMatch(guid: string): Promise<void> {
  const response = await fetch(
    `/api/profile/matches/${encodeURIComponent(guid)}`,
    { method: "DELETE", headers: headers() },
  );
  if (!response.ok && response.status !== 404) {
    throw new PreferencesApiError(response.status);
  }
}
