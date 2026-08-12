export async function fetchAdminApi(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, init);

  if (
    response.status === 401 &&
    typeof window !== "undefined" &&
    !window.location.pathname.includes("/admin/login")
  ) {
    // Soft navigate via replace once — avoid stacking reloads on login itself.
    window.location.replace("/admin/login");
  }

  return response;
}
