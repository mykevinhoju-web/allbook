export function isAdminNavActive(href: string, pathname: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getAdminBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) {
    return [{ label: "Dashboard" }];
  }

  const crumbs: { label: string; href?: string }[] = [
    { label: "Dashboard", href: "/admin" },
  ];

  const pageSegment = segments[1];
  const subSegment = segments[2];

  if (pageSegment === "staff" && subSegment === "new") {
    crumbs.push({ label: "Staff", href: "/admin/staff" });
    crumbs.push({ label: "Add Staff" });
    return crumbs;
  }

  const label = pageSegment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  crumbs.push({ label });

  return crumbs;
}
