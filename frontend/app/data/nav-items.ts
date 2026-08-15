export interface NavItem {
  id: string;
  label: string;
  icon: string;
}

/** Core navigation items shared between mobile bottom-nav and desktop sidebar */
export const coreNavItems: NavItem[] = [
  { id: "explore", label: "Explore", icon: "🔍" },
  { id: "saved", label: "Saved", icon: "♥" },
  { id: "calendar", label: "Calendar", icon: "📅" },
  { id: "profile", label: "Profile", icon: "👤" },
];

/** Desktop sidebar has additional items and longer labels */
export const sidebarNavItems: NavItem[] = [
  { id: "explore", label: "Explore", icon: "🔍" },
  { id: "saved", label: "Saved Events", icon: "♥" },
  { id: "calendar", label: "Calendar", icon: "📅" },
  { id: "profile", label: "Profile", icon: "👤" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];
