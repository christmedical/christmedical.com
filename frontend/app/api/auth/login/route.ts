import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sessionCookieOptions, SESSION_COOKIE_NAME } from "@/lib/authCookies";
import { normalizeApiBaseUrl } from "@/lib/patientApi";
import { tenantAppOrigin } from "@/lib/subdomain";

type LoginResponse = {
  memberships: Array<{
    tenantId: number;
    slug: string;
    name: string;
    shortName: string;
    themeColorHex: string;
    role: string;
  }>;
  accessToken?: string;
  preAuthToken?: string;
  tenantId?: number;
  tenantSlug?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const base = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
  if (!base) {
    return NextResponse.json({ ok: false, message: "API is not configured." }, { status: 500 });
  }

  const host = request.headers.get("host") ?? undefined;
  const apiRes = await fetch(`${base}/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: body.email, password: body.password }),
  });

  if (!apiRes.ok) {
    const err = (await apiRes.json().catch(() => ({}))) as { message?: string };
    return NextResponse.json(
      { ok: false, message: err.message ?? "Invalid email or password." },
      { status: 401 },
    );
  }

  const data = (await apiRes.json()) as LoginResponse;

  if (data.accessToken && data.tenantSlug) {
    const jar = await cookies();
    jar.set(SESSION_COOKIE_NAME, data.accessToken, sessionCookieOptions(60 * 60 * 12));
    return NextResponse.json({
      ok: true,
      redirectUrl: tenantAppOrigin(data.tenantSlug, host),
      memberships: data.memberships,
    });
  }

  if (data.preAuthToken && data.memberships.length > 1) {
    return NextResponse.json({
      ok: true,
      pickTenant: true,
      preAuthToken: data.preAuthToken,
      memberships: data.memberships,
    });
  }

  return NextResponse.json(
    { ok: false, message: "No clinic access is assigned to this account." },
    { status: 401 },
  );
}
