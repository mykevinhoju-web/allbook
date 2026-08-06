export async function fetchStaffApi(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, init);

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      const next = window.location.pathname + window.location.search;
      const url = new URL("/staff/login", window.location.origin);
      url.searchParams.set("next", next);
      window.location.replace(url.toString());
    }
  }

  return response;
}
