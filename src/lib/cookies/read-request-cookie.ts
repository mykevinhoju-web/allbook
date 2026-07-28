/** Read a cookie value from a Request Cookie header (reliable in Route Handlers). */
export function readCookieFromRequest(
  request: Request,
  name: string,
): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  if (!match?.[1]) return null;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}
