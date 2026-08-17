export type NavIconName = "explore" | "saved" | "concierge" | "profile";

export interface NavItem {
  id: string;
  label: string;
  icon: NavIconName;
  /** Route the item navigates to; null items are placeholders for now. */
  href: string | null;
}

/**
 * Primary navigation order per issue #20: Explore → Saved → Concierge →
 * Profile, with no separate Calendar destination — the calendar lives inside
 * the Saved tab.
 */
export const coreNavItems: NavItem[] = [
  { id: "explore", label: "Explore", icon: "explore", href: "/" },
  { id: "saved", label: "Saved", icon: "saved", href: "/saved" },
  {
    id: "concierge",
    label: "Concierge",
    icon: "concierge",
    href: "/concierge",
  },
  { id: "profile", label: "Profile", icon: "profile", href: "/profile" },
];

/** Desktop sidebar shares the same destinations with longer labels */
export const sidebarNavItems: NavItem[] = [
  { id: "explore", label: "Explore", icon: "explore", href: "/" },
  { id: "saved", label: "Saved Events", icon: "saved", href: "/saved" },
  {
    id: "concierge",
    label: "Concierge",
    icon: "concierge",
    href: "/concierge",
  },
  { id: "profile", label: "Profile", icon: "profile", href: "/profile" },
];
