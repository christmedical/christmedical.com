import { bootstrapAccessToken } from "@/lib/authSession";
import { getTenantId } from "@/lib/tenantRuntime";

export async function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const token = await bootstrapAccessToken();
  const tenantId = getTenantId();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  headers.set("X-Tenant-Id", String(tenantId));
  return fetch(url, { ...init, headers });
}
