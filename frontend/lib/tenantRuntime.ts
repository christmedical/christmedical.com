import { DEFAULT_TENANT_ID, getTenantBranding } from "@/lib/tenantConfig";

const STORAGE_KEY = "cm-tenant-id";

function readEnvTenantId(): number {
  const raw = process.env.NEXT_PUBLIC_TENANT_ID;
  if (raw == null || raw === "") return DEFAULT_TENANT_ID;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TENANT_ID;
}

/** Resolve tenant: URL ?tenantId= → localStorage → env default. */
export function getTenantId(): number {
  if (typeof window === "undefined") return readEnvTenantId();

  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("tenantId");
  if (fromUrl != null) {
    const n = Number.parseInt(fromUrl, 10);
    if (Number.isFinite(n) && n > 0) {
      try {
        window.localStorage.setItem(STORAGE_KEY, String(n));
      } catch {
        /* private mode */
      }
      return n;
    }
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored != null) {
      const n = Number.parseInt(stored, 10);
      if (Number.isFinite(n) && n > 0) return n;
    }
  } catch {
    /* ignore */
  }

  return readEnvTenantId();
}

export function getResolvedTenant() {
  const id = getTenantId();
  return { id, branding: getTenantBranding(id) };
}
