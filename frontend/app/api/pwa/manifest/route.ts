import { type NextRequest, NextResponse } from "next/server";
import { getTenantBranding, tenantIconUrl } from "@/lib/tenantConfig";
import { normalizeApiBaseUrl } from "@/lib/patientApi";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("tenantId");
  const parsed = raw != null ? Number.parseInt(raw, 10) : Number.NaN;
  const tenantId =
    Number.isFinite(parsed) && parsed > 0 ? parsed : 1;

  const b = getTenantBranding(tenantId);
  const apiBase = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
  const iconSrc = apiBase
    ? tenantIconUrl(tenantId, apiBase)
    : `/api/v1/assets/icon?tenantId=${tenantId}`;

  const manifest = {
    name: `CM - ${b.name}`,
    short_name: b.shortName,
    description: "Christ Medical — mission clinical workspace",
    start_url: `/?tenantId=${tenantId}`,
    scope: "/",
    display: "standalone" as const,
    orientation: "portrait-primary" as const,
    theme_color: b.themeColor,
    background_color: b.themeColor,
    icons: [
      {
        src: iconSrc,
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
      {
        src: iconSrc,
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
