import type { NavIconName } from "@/app/data/nav-items";

const PATHS: Record<NavIconName, React.ReactNode> = {
  explore: (
    <>
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ),
  saved: (
    <path d="M12 20.3 4.9 13a4.6 4.6 0 0 1 6.5-6.5l.6.6.6-.6A4.6 4.6 0 1 1 19.1 13Z" />
  ),
  concierge: (
    <>
      <path d="M20 12.4c0 3.9-3.6 7-8 7a9 9 0 0 1-2.6-.4L4 21l1.5-3.6A6.6 6.6 0 0 1 4 12.4c0-3.9 3.6-7 8-7s8 3.1 8 7Z" />
      <path d="M9 12h.01M12 12h.01M15 12h.01" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8.5" r="3.6" />
      <path d="M5 19.4a7.2 7.2 0 0 1 14 0" />
    </>
  ),
};

/** One stroke set for both navigations, so a destination reads the same
 *  on the phone dock and the desktop rail. */
export default function NavIcon({ name }: { name: NavIconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
