/** Strips trailing slashes; empty string when unset. */
export function normalizeApiBaseUrl(raw: string | undefined): string {
  return raw?.replace(/\/*$/, "") ?? "";
}

/** Full URL for GET /v1/patients (base should already be normalized). */
export function patientsListUrl(base: string): string {
  if (!base) return "";
  return `${base}/v1/patients`;
}
