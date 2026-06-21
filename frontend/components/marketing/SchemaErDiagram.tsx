"use client";

import { useEffect, useRef, useState } from "react";
import { FC_MUTED_NOTE, FC_SURFACE } from "@/components/design/fieldClinical";

type MermaidApi = {
  initialize: (config: Record<string, unknown>) => void;
  render: (id: string, source: string) => Promise<{ svg: string }>;
};

declare global {
  interface Window {
    mermaid?: MermaidApi;
  }
}

let mermaidLoader: Promise<MermaidApi> | null = null;

function loadMermaid(): Promise<MermaidApi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("no window"));
  }

  if (window.mermaid) {
    return Promise.resolve(window.mermaid);
  }

  if (!mermaidLoader) {
    mermaidLoader = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js";
      script.async = true;
      script.onload = () => {
        const api = window.mermaid;
        if (!api) {
          reject(new Error("mermaid failed to load"));
          return;
        }

        api.initialize({
          startOnLoad: false,
          theme: "base",
          themeVariables: {
            primaryColor: "#FAF7F0",
            primaryTextColor: "#2E2A26",
            primaryBorderColor: "#B94700",
            lineColor: "#685C53",
            tertiaryColor: "#F4EFE6",
          },
          er: { useMaxWidth: false },
          securityLevel: "loose",
        });
        resolve(api);
      };
      script.onerror = () => reject(new Error("mermaid script failed"));
      document.head.appendChild(script);
    });
  }

  return mermaidLoader;
}

/** Renders the auto-generated PostgreSQL ER diagram (public marketing / technical tab). */
export function SchemaErDiagram() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/design/schema-er.mmd");
        if (!res.ok) throw new Error("diagram missing");
        const source = await res.text();
        const mermaid = await loadMermaid();
        if (cancelled) return;

        const id = `schema-er-${Math.random().toString(36).slice(2)}`;
        const { svg } = await mermaid.render(id, source);
        if (cancelled) return;

        host.innerHTML = svg;
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <figure className={`${FC_SURFACE} p-4 sm:p-6`}>
      <figcaption className="mb-3 font-display text-sm font-medium text-fc-ink">
        Database schema
      </figcaption>
      <div
        ref={hostRef}
        className="min-h-[12rem] overflow-x-auto [&_svg]:h-auto [&_svg]:max-w-none"
        aria-busy={status === "loading"}
        aria-label="Entity-relationship diagram of PostgreSQL tables"
      />
      {status === "loading" ? <p className={`${FC_MUTED_NOTE} mt-2`}>Loading diagram…</p> : null}
      {status === "error" ? (
        <p className={`${FC_MUTED_NOTE} mt-2`}>
          Diagram unavailable in this environment. Regenerate with{" "}
          <code className="font-mono text-fc-ink">make schema-docs</code>.
        </p>
      ) : null}
      <p className="mt-3 text-sm text-fc-ink-muted">
        Generated from the live PostgreSQL schema (tbls). Per-table column detail is kept in{" "}
        <code className="font-mono text-fc-ink">docs/schema/</code> in the repository.
      </p>
    </figure>
  );
}
