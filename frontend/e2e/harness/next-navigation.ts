export function usePathname() {
  return "/profile";
}

export function useRouter() {
  return {
    push: (href: string) => window.history.pushState({}, "", href),
  };
}
