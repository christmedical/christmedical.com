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
