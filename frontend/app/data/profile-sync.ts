const PROFILE_CHANGED_EVENT = "eventmatch:profile-changed";

/** Tell mounted Profile and Saved views to read the canonical device Profile. */
export function announceProfileChanged(): void {
  window.dispatchEvent(new Event(PROFILE_CHANGED_EVENT));
}

export function onProfileChanged(listener: () => void): () => void {
  window.addEventListener(PROFILE_CHANGED_EVENT, listener);
  return () => window.removeEventListener(PROFILE_CHANGED_EVENT, listener);
}
