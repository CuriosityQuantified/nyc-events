export interface NavItem {
  id: string;
  label: string;
  icon: string;
  /** Route the item navigates to; null items are placeholders for now. */
  href: string | null;
}

/**
 * Primary navigation order per issue #20: Explore → Saved → Concierge →
 * Profile, with no separate Calendar destination — the calendar lives inside
 * the Saved tab.
 */
export const coreNavItems: NavItem[] = [
  { id: "explore", label: "Explore", icon: "🔍", href: "/" },
  { id: "saved", label: "Saved", icon: "♥", href: "/saved" },
  { id: "concierge", label: "Concierge", icon: "💬", href: "/concierge" },
  { id: "profile", label: "Profile", icon: "👤", href: "/profile" },
];

/** Desktop sidebar shares the same destinations with longer labels */
export const sidebarNavItems: NavItem[] = [
  { id: "explore", label: "Explore", icon: "🔍", href: "/" },
  { id: "saved", label: "Saved Events", icon: "♥", href: "/saved" },
  { id: "concierge", label: "Concierge", icon: "💬", href: "/concierge" },
  { id: "profile", label: "Profile", icon: "👤", href: "/profile" },
];
