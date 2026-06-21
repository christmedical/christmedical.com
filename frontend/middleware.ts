import { NextResponse, type NextRequest } from "next/server";
import {
  loginOrigin,
  parseHost,
  type ParsedHost,
} from "@/lib/subdomain";
import { SESSION_COOKIE_NAME } from "@/lib/authCookies";
import { normalizeApiBaseUrl } from "@/lib/patientApi";

const PUBLIC_FILE = /\.(.*)$/;

async function resolveTenant(slug: string): Promise<{ id: number; slug: string } | null> {
  const base = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
  if (!base) return null;

  try {
    const res = await fetch(`${base}/v1/tenants/by-slug/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { id: number; slug: string };
    return { id: data.id, slug: data.slug };
  } catch {
    return null;
  }
}

function withTenantHeaders(
  response: NextResponse,
  tenant: { id: number; slug: string },
): NextResponse {
  response.headers.set("x-tenant-id", String(tenant.id));
  response.headers.set("x-tenant-slug", tenant.slug);
  return response;
}

function redirectToLogin(request: NextRequest, returnPath: string): NextResponse {
  const host = request.headers.get("host") ?? "";
  const login = loginOrigin(host);
  const url = new URL("/login", login);
  url.searchParams.set("returnTo", returnPath);
  return NextResponse.redirect(url);
}

function isAuthApi(pathname: string): boolean {
  return pathname.startsWith("/api/auth");
}

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/manifest") ||
    PUBLIC_FILE.test(pathname)
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") ?? "";
  const parsed = parseHost(host);

  if (isStaticAsset(pathname)) return NextResponse.next();

  if (parsed.kind === "unknown") {
    return NextResponse.rewrite(new URL("/unknown-clinic", request.url));
  }

  if (parsed.kind === "reserved") {
    return NextResponse.rewrite(new URL("/unknown-clinic", request.url));
  }

  if (parsed.kind === "marketing") {
    if (pathname.startsWith("/api")) return NextResponse.next();
    if (pathname === "/marketing" || pathname.startsWith("/marketing/")) {
      const target = pathname === "/marketing" ? "/" : pathname.replace(/^\/marketing/, "") || "/";
      return NextResponse.redirect(new URL(target, request.url));
    }
    if (
      pathname.startsWith("/queue") ||
      pathname.startsWith("/patients") ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/feedback-review")
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (parsed.kind === "login") {
    if (isAuthApi(pathname) || pathname.startsWith("/api/pwa")) return NextResponse.next();
    if (pathname === "/" || pathname === "")
      return NextResponse.rewrite(new URL("/login", request.url));
    if (
      pathname.startsWith("/queue") ||
      pathname.startsWith("/patients") ||
      pathname.startsWith("/dashboard")
    ) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  return handleTenantHost(request, parsed, pathname);
}

async function handleTenantHost(
  request: NextRequest,
  parsed: Extract<ParsedHost, { kind: "tenant" }>,
  pathname: string,
): Promise<NextResponse> {
  const tenant = await resolveTenant(parsed.tenantSlug);
  if (!tenant) {
    return NextResponse.rewrite(new URL("/unknown-clinic", request.url));
  }

  if (pathname === "/" || pathname === "") {
    const redirect = NextResponse.redirect(new URL("/queue", request.url));
    return withTenantHeaders(redirect, tenant);
  }

  const session = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const needsAuth =
    !isAuthApi(pathname) &&
    !pathname.startsWith("/unknown-clinic") &&
    !pathname.startsWith("/api/pwa");

  if (needsAuth && !session) {
    const returnTo = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    return withTenantHeaders(redirectToLogin(request, returnTo), tenant);
  }

  const response = NextResponse.next();
  return withTenantHeaders(response, tenant);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
