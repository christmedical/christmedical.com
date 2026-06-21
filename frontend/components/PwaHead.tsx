"use client";

import { useEffect } from "react";
import { CHRIST_MEDICAL_ICONS } from "@/lib/branding";
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

function upsertLink(rel: string, href: string, sizes?: string) {
  if (typeof document === "undefined") return;
  const selector = sizes
    ? `link[rel="${rel}"][sizes="${sizes}"]`
    : `link[rel="${rel}"]`;
  let link = document.querySelector(selector);
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", rel);
    if (sizes) link.setAttribute("sizes", sizes);
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
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

    upsertLink("manifest", `/api/pwa/manifest?tenantId=${id}`);
    upsertLink("apple-touch-icon", CHRIST_MEDICAL_ICONS.appleTouch);
    upsertLink("icon", CHRIST_MEDICAL_ICONS.favicon32, "32x32");
  }, []);

  return null;
}
