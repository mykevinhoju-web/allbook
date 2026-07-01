export function isPlatformNavActive(href: string, pathname: string): boolean {
  if (href === "/platform") {
    return pathname === "/platform";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getPlatformBreadcrumbs(
  pathname: string,
): { label: string; href?: string }[] {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) {
    return [{ label: "Dashboard" }];
  }

  const crumbs: { label: string; href?: string }[] = [
    { label: "Dashboard", href: "/platform" },
  ];

  const pageSegment = segments[1];
  const label = pageSegment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  crumbs.push({ label });

  return crumbs;
}

export function formatPlatformDate(date: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}
