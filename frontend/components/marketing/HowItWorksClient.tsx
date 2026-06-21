"use client";

import { useState } from "react";
import { SchemaErDiagram } from "@/components/marketing/SchemaErDiagram";
import {
  FC_CHIP,
  FC_CHIP_ACTIVE,
  FC_PAGE_STACK,
  FC_SECTION_LABEL,
  FC_SURFACE,
} from "@/components/design/fieldClinical";

type TabId = "journey" | "technical";

const TABS: { id: TabId; label: string }[] = [
  { id: "journey", label: "The Patient Journey" },
  { id: "technical", label: "For technical teams" },
];

/** Public marketing page: pastor-first journey, then technical overview. */
export function HowItWorksClient() {
  const [tab, setTab] = useState<TabId>("journey");

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
      <header className="mb-8 max-w-2xl">
        <p className={FC_SECTION_LABEL}>Christ Medical</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-fc-ink sm:text-4xl">
          How it works
        </h1>
        <p className="mt-3 text-fc-ink-muted">
          One page for ministry leaders and for technical teams building or supporting a
          deployment.
        </p>
      </header>

      <div
        className="mb-8 flex flex-wrap gap-2"
        role="tablist"
        aria-label="How it works audiences"
      >
        {TABS.map(({ id, label }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`how-it-works-panel-${id}`}
              id={`how-it-works-tab-${id}`}
              className={active ? FC_CHIP_ACTIVE : FC_CHIP}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          );
        })}
      </div>

      {tab === "journey" ? (
        <section
          id="how-it-works-panel-journey"
          role="tabpanel"
          aria-labelledby="how-it-works-tab-journey"
          className={FC_PAGE_STACK}
        >
          <p className="max-w-3xl text-base leading-relaxed text-fc-ink-muted">
            On a mission day, a patient arrives at the clinic and is welcomed at registration.
            A nurse captures vitals and prepares the chart; the physician documents the visit,
            orders treatment, and may prescribe medicine. Before the patient leaves, the team
            notes any follow-up needs — including spiritual care and prayer — so nothing important
            is lost between today&apos;s visit and tomorrow&apos;s rounds.
          </p>

          <div className={`${FC_SURFACE} overflow-x-auto p-4 sm:p-6`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/design/usage-journey.svg"
              alt="Swimlane diagram of a patient moving through registration, nursing, physician care, pharmacy, and follow-up including prayer"
              className="h-auto min-w-[min(100%,720px)] w-full max-w-none"
              loading="eager"
              decoding="async"
            />
          </div>
        </section>
      ) : (
        <section
          id="how-it-works-panel-technical"
          role="tabpanel"
          aria-labelledby="how-it-works-tab-technical"
          className={FC_PAGE_STACK}
        >
          <p className="text-base font-medium text-fc-ink">
            Built for unreliable connectivity, multi-tenant by design. Technical teams, start
            here.
          </p>

          <figure className={`${FC_SURFACE} overflow-x-auto p-4 sm:p-6`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/design/deployment-iso.svg"
              alt="Isometric deployment diagram: browser PWA, API, and database with sync paths for mostly-connected field use"
              className="h-auto min-w-[min(100%,640px)] w-full max-w-none"
              loading="lazy"
              decoding="async"
            />
            <figcaption className="mt-4 text-sm text-fc-ink-muted">
              Mostly-connected field model: clinicians work in the browser; writes queue locally
              when the link is down and replay when connectivity returns. Hosting labels on the
              diagram are indicative — confirm production targets with your deployment owner.
            </figcaption>
          </figure>

          <div className={`${FC_SURFACE} space-y-3 p-6 text-sm leading-relaxed text-fc-ink-muted`}>
            <p>
              <strong className="font-medium text-fc-ink">Stack.</strong> The clinical app is a{" "}
              <strong className="font-medium text-fc-ink">Next.js 15</strong> progressive web app
              (hosted on <strong className="font-medium text-fc-ink">Vercel</strong>). The API is{" "}
              <strong className="font-medium text-fc-ink">ASP.NET Core 9</strong> (hosted on{" "}
              <strong className="font-medium text-fc-ink">Railway</strong>). Data lives in{" "}
              <strong className="font-medium text-fc-ink">PostgreSQL</strong>.
            </p>
            <p>
              <strong className="font-medium text-fc-ink">Connectivity.</strong> Christ Medical
              assumes missions are <em>mostly</em> connected, not fully offline-first: the client
              keeps a local write outbox so charting can continue through brief outages, then
              syncs when the network is back.
            </p>
            <p>
              <strong className="font-medium text-fc-ink">Tenancy.</strong> Each mission clinic
              runs on its own subdomain (for example{" "}
              <span className="font-mono text-fc-ink">belize.christmedical.com</span>). Users sign
              in once at the global login host; the session hands off to the clinic they belong
              to.
            </p>
          </div>

          <SchemaErDiagram />
        </section>
      )}
    </div>
  );
}
