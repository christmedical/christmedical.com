export const SESSION_COOKIE_NAME = "cm_session";

/** Parent-domain cookie for cross-subdomain session handoff. */
export function sessionCookieDomain(): string | undefined {
  if (process.env.NODE_ENV !== "production") return undefined;
  return `.${process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "christmedical.com"}`;
}

export function sessionCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
    domain: sessionCookieDomain(),
  };
}
