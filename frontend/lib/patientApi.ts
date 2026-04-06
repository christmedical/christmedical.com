/** Strips trailing slashes; empty string when unset. */
export function normalizeApiBaseUrl(raw: string | undefined): string {
  return raw?.replace(/\/*$/, "") ?? "";
}

export type PatientsQuery = {
  tenantId?: number;
  /** Server caps at 2000 for offline IndexedDB sync. */
  limit?: number;
};

/** Full URL for GET /v1/patients (base should already be normalized). */
export function patientsListUrl(base: string, query?: PatientsQuery): string {
  if (!base) return "";
  const q = new URLSearchParams();
  if (query?.tenantId != null) q.set("tenantId", String(query.tenantId));
  if (query?.limit != null) q.set("limit", String(query.limit));
  const qs = q.toString();
  return qs ? `${base}/v1/patients?${qs}` : `${base}/v1/patients`;
}

/** Full URL for PATCH /v1/patients/{id} (last write wins). */
export function patientsPatchUrl(
  base: string,
  patientId: string,
  tenantId: number,
): string {
  if (!base) return "";
  const q = new URLSearchParams({ tenantId: String(tenantId) });
  return `${base}/v1/patients/${encodeURIComponent(patientId)}?${q}`;
}

export type PatientsSearchQuery = {
  tenantId?: number;
  /** Name or legacy id; two words = first + last (also phonetic). */
  q?: string;
  spiritual?: "all" | "heard" | "hope" | "none";
  limit?: number;
};

/** GET /v1/patients/search */
export function patientsSearchUrl(base: string, query: PatientsSearchQuery): string {
  if (!base) return "";
  const p = new URLSearchParams();
  if (query.tenantId != null) p.set("tenantId", String(query.tenantId));
  if (query.q != null && query.q.trim() !== "") p.set("q", query.q.trim());
  if (query.spiritual != null) p.set("spiritual", query.spiritual);
  if (query.limit != null) p.set("limit", String(query.limit));
  const qs = p.toString();
  return qs ? `${base}/v1/patients/search?${qs}` : `${base}/v1/patients/search`;
}

/** GET /v1/dashboard/summary */
export function dashboardSummaryUrl(base: string, tenantId: number): string {
  if (!base) return "";
  return `${base}/v1/dashboard/summary?tenantId=${tenantId}`;
}
