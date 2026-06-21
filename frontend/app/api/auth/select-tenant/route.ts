import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sessionCookieOptions, SESSION_COOKIE_NAME } from "@/lib/authCookies";
import { normalizeApiBaseUrl } from "@/lib/patientApi";
import { tenantAppOrigin } from "@/lib/subdomain";

export async function POST(request: Request) {
  const body = (await request.json()) as { preAuthToken?: string; tenantId?: number };
  const base = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
  if (!base) {
    return NextResponse.json({ ok: false, message: "API is not configured." }, { status: 500 });
  }

  const host = request.headers.get("host") ?? undefined;
  const apiRes = await fetch(`${base}/v1/auth/select-tenant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      preAuthToken: body.preAuthToken,
      tenantId: body.tenantId,
    }),
  });

  if (!apiRes.ok) {
    return NextResponse.json(
      { ok: false, message: "Invalid session or clinic selection." },
      { status: 400 },
    );
  }

  const data = (await apiRes.json()) as {
    accessToken: string;
    tenantId: number;
    tenantSlug: string;
  };

  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, data.accessToken, sessionCookieOptions(60 * 60 * 12));

  return NextResponse.json({
    ok: true,
    redirectUrl: tenantAppOrigin(data.tenantSlug, host),
  });
}
