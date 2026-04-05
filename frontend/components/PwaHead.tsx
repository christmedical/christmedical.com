"use client";

import { useEffect } from "react";
import { normalizeApiBaseUrl } from "@/lib/patientApi";
import { tenantIconUrl } from "@/lib/tenantConfig";
import { getResolvedTenant } from "@/lib/tenantRuntime";

function upsertMetaByName(name: string, content: string) {
  if (typeof document === "undefined") return;
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/** Client-side PWA head: dynamic manifest, Apple meta, theme color, document title. */
export function PwaHead() {
  useEffect(() => {
    const { id, branding } = getResolvedTenant();

    document.title = `${branding.shortName} · Christ Medical`;

    upsertMetaByName("theme-color", branding.themeColor);
    upsertMetaByName("apple-mobile-web-app-capable", "yes");
    upsertMetaByName("apple-mobile-web-app-status-bar-style", "default");
    upsertMetaByName("apple-mobile-web-app-title", branding.shortName);

    const manifestHref = `/api/pwa/manifest?tenantId=${id}`;
    let link = document.querySelector('link[rel="manifest"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "manifest");
      document.head.appendChild(link);
    }
    link.setAttribute("href", manifestHref);

    const api = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
    if (api) {
      const href = tenantIconUrl(id, api);
      let apple = document.querySelector('link[rel="apple-touch-icon"]');
      if (!apple) {
        apple = document.createElement("link");
        apple.setAttribute("rel", "apple-touch-icon");
        document.head.appendChild(apple);
      }
      apple.setAttribute("href", href);
    }
  }, []);

  return null;
}
