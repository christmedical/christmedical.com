import { DEFAULT_TENANT_ID, getTenantBranding, getTenantIdBySlug } from "@/lib/tenantConfig";
import { parseHost } from "@/lib/subdomain";

const STORAGE_KEY = "cm-tenant-id";

function readEnvTenantId(): number {
  const raw = process.env.NEXT_PUBLIC_TENANT_ID;
  if (raw == null || raw === "") return DEFAULT_TENANT_ID;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TENANT_ID;
}

function tenantIdFromHost(): number | null {
  if (typeof window === "undefined") return null;
  const parsed = parseHost(window.location.host);
  if (parsed.kind !== "tenant") return null;
  return getTenantIdBySlug(parsed.tenantSlug);
}

/** Resolve tenant: subdomain slug → localStorage → env default. */
export function getTenantId(): number {
  const fromHost = tenantIdFromHost();
  if (fromHost != null) return fromHost;

  if (typeof window === "undefined") return readEnvTenantId();

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

export function getTenantSlug(): string | null {
  if (typeof window === "undefined") return null;
  const parsed = parseHost(window.location.host);
  return parsed.kind === "tenant" ? parsed.tenantSlug : null;
}
