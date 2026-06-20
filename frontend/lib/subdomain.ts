/** Reserved subdomains — keep in sync with API `ReservedSubdomains`. */
export const RESERVED_SUBDOMAINS = new Set([
  "www",
  "login",
  "signin",
  "api",
  "admin",
  "app",
]);

export type HostKind = "marketing" | "login" | "tenant" | "reserved" | "unknown";

export type ParsedHost =
  | { kind: "marketing" }
  | { kind: "login" }
  | { kind: "tenant"; tenantSlug: string }
  | { kind: "reserved"; subdomain: string }
  | { kind: "unknown" };

export function baseDomain(): string {
  return process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "christmedical.com";
}

/** Parses Host header (or window.location.host) into routing kind + tenant slug. */
export function parseHost(host: string): ParsedHost {
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  const domain = baseDomain();

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    const devSlug = process.env.DEV_TENANT_SLUG;
    if (devSlug && !RESERVED_SUBDOMAINS.has(devSlug))
      return { kind: "tenant", tenantSlug: devSlug };
    return { kind: "marketing" };
  }

  if (hostname.endsWith(".localhost")) {
    const sub = hostname.slice(0, -".localhost".length);
    if (sub === "login" || sub === "signin") return { kind: "login" };
    if (sub === "www" || sub === "") return { kind: "marketing" };
    if (RESERVED_SUBDOMAINS.has(sub)) return { kind: "reserved", subdomain: sub };
    return { kind: "tenant", tenantSlug: sub };
  }

  if (hostname === domain || hostname === `www.${domain}`) return { kind: "marketing" };

  if (hostname === `login.${domain}` || hostname === `signin.${domain}`)
    return { kind: "login" };

  const suffix = `.${domain}`;
  if (hostname.endsWith(suffix)) {
    const sub = hostname.slice(0, -suffix.length);
    if (!sub || sub.includes(".")) return { kind: "unknown" };
    if (RESERVED_SUBDOMAINS.has(sub)) return { kind: "reserved", subdomain: sub };
    return { kind: "tenant", tenantSlug: sub };
  }

  return { kind: "unknown" };
}

export function tenantAppOrigin(slug: string, hostHeader?: string): string {
  const port = hostHeader?.includes(":") ? `:${hostHeader.split(":")[1]}` : "";
  const domain = baseDomain();

  if (process.env.NODE_ENV === "development") {
    return `http://${slug}.localhost${port || ":3000"}`;
  }

  return `https://${slug}.${domain}`;
}

export function loginOrigin(hostHeader?: string): string {
  const port = hostHeader?.includes(":") ? `:${hostHeader.split(":")[1]}` : "";
  const domain = baseDomain();

  if (process.env.NODE_ENV === "development") {
    return `http://login.localhost${port || ":3000"}`;
  }

  return `https://login.${domain}`;
}
