/** Mission branding — keep in sync with API `TenantBranding` (primary colors, names). */
export type TenantBranding = {
  id: number;
  /** Full mission name */
  name: string;
  /** Short label (home screen, manifest short_name) */
  shortName: string;
  themeColor: string;
};

export const TENANTS: Record<number, TenantBranding> = {
  1: { id: 1, name: "Belize", shortName: "Belize", themeColor: "#0d9488" },
  2: { id: 2, name: "Demo Mission", shortName: "Demo", themeColor: "#2563eb" },
};

export const DEFAULT_TENANT_ID = 1;

export function getTenantBranding(tenantId: number): TenantBranding {
  return TENANTS[tenantId] ?? TENANTS[DEFAULT_TENANT_ID]!;
}

/** Icon URL on the API (absolute when NEXT_PUBLIC_API_URL is set). */
export function tenantIconUrl(tenantId: number, apiBase: string): string {
  const base = apiBase.replace(/\/*$/, "");
  return `${base}/v1/assets/icon?tenantId=${tenantId}`;
}
