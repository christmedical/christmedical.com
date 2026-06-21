import { type NextRequest, NextResponse } from "next/server";
import { CHRIST_MEDICAL_ICONS } from "@/lib/branding";
import { getTenantBranding } from "@/lib/tenantConfig";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("tenantId");
  const parsed = raw != null ? Number.parseInt(raw, 10) : Number.NaN;
  const tenantId =
    Number.isFinite(parsed) && parsed > 0 ? parsed : 1;

  const b = getTenantBranding(tenantId);

  const manifest = {
    name: `CM - ${b.name}`,
    short_name: b.shortName,
    description: "Christ Medical — mission clinical workspace",
    start_url: `/?tenantId=${tenantId}`,
    scope: "/",
    display: "standalone" as const,
    orientation: "portrait-primary" as const,
    theme_color: b.themeColor,
    background_color: "#faf8f5",
    icons: [
      {
        src: CHRIST_MEDICAL_ICONS.pwa512,
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: CHRIST_MEDICAL_ICONS.pwa192,
        sizes: "192x192",
        type: "image/png",
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
