/** Public demo clinic sign-in (demo.christmedical.com). */
export const DEMO_TENANT_SLUG = "demo";
export const DEMO_LOGIN_EMAIL = "demo@christmedical.com";
export const DEMO_LOGIN_PASSWORD = "password";

export function isDemoLoginPrefill(tenantParam: string | null, demoParam: string | null): boolean {
  return tenantParam === DEMO_TENANT_SLUG || demoParam === "1";
}
