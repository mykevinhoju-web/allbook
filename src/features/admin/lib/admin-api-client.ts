export async function fetchAdminApi(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, init);

  if (response.status === 401 && typeof window !== "undefined") {
    window.location.replace("/admin/login");
  }

  return response;
}
