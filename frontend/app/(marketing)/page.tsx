import Link from "next/link";
import { ChristMedicalLogo } from "@/components/ChristMedicalLogo";
import { FC_BTN_PRIMARY, FC_SURFACE } from "@/components/design/fieldClinical";
import { DEMO_TENANT_SLUG } from "@/lib/demoAuth";
import { loginOrigin, tenantAppOrigin } from "@/lib/subdomain";

const FEATURES = [
  {
    title: "Built for the field",
    body: "Short-term medical missions need software that works when connectivity does not. Christ Medical is a progressive web app clinicians can run from a browser or home screen.",
  },
  {
    title: "One login, many clinics",
    body: "Sign in once at the global portal, then work in your mission clinic on its own subdomain — Belize, demo, or cornerstone — with tenant-aware branding and data isolation.",
  },
  {
    title: "Whole-person charting",
    body: "Clinical workflows meet mission context: vitals, encounters, medications, and spiritual-care flags in one chart designed for the doctors who lead the trips.",
  },
  {
    title: "Review while you build",
    body: "In-app feedback pins let owners and reviewers mark UX notes directly on live screens — so product iteration stays close to the people in the field.",
  },
] as const;

export default function MarketingHomePage() {
  const signInHref = loginOrigin();
  const demoSiteHref = tenantAppOrigin(DEMO_TENANT_SLUG);

  return (
    <>
      <section
        className="relative overflow-hidden border-b border-fc-border"
        style={{
          background: `linear-gradient(165deg, var(--cm-brand-navy) 0%, var(--cm-brand-navy-soft) 42%, var(--fc-paper) 72%)`,
        }}
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-20 blur-3xl" style={{ background: "var(--cm-brand-gold)" }} />
        <div className="pointer-events-none absolute -bottom-16 left-1/4 h-48 w-48 rounded-full opacity-10 blur-3xl" style={{ background: "var(--fc-accent-glow)" }} />

        <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-8 px-6 py-20 text-center sm:py-28">
          <ChristMedicalLogo
            size={96}
            className="rounded-2xl shadow-lg ring-1 ring-white/20"
            priority
          />
          <div className="max-w-2xl space-y-4">
            <p
              className="font-display text-xs font-semibold uppercase tracking-[0.25em]"
              style={{ color: "var(--cm-brand-gold-soft)" }}
            >
              Mission clinical workspace
            </p>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Field-ready EMR for medical missions
            </h1>
            <p className="text-lg leading-relaxed text-white/80">
              Christ Medical helps volunteer clinicians register patients, document visits, and
              coordinate spiritual follow-up — online or mostly-connected — across mission clinics
              around the world.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href={signInHref} className={`${FC_BTN_PRIMARY} px-8 py-3 text-base shadow-lg`}>
              Clinician sign in
            </a>
            <a
              href={demoSiteHref}
              className="inline-flex min-h-11 items-center rounded-lg border border-white/25 bg-white/10 px-6 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/15"
            >
              Try demo site
            </a>
            <Link
              href="/about"
              className="inline-flex min-h-11 items-center rounded-lg border border-white/25 bg-white/10 px-6 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/15"
            >
              Learn more
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <div className="mb-12 max-w-2xl">
          <h2 className="font-display text-2xl font-semibold text-fc-ink sm:text-3xl">
            Software shaped by the mission
          </h2>
          <p className="mt-3 text-fc-ink-muted">
            Requirements trace back to physician-led trips in Belize — not a generic hospital EMR
            shrunk onto a tablet. Christ Medical keeps what matters at the point of care.
          </p>
        </div>

        <ul className="grid gap-6 sm:grid-cols-2">
          {FEATURES.map((item) => (
            <li key={item.title} className={`${FC_SURFACE} p-6`}>
              <h3 className="font-display text-lg font-semibold text-fc-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fc-ink-muted">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-fc-border bg-fc-accent-tint/40">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <div className={`${FC_SURFACE} p-8 sm:p-10`}>
            <h2 className="font-display text-xl font-semibold text-fc-ink">How clinics connect</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fc-ink-muted">
              The product site lives at{" "}
              <span className="font-mono text-fc-ink">christmedical.com</span>. Clinicians sign in
              at{" "}
              <span className="font-mono text-fc-ink">login.christmedical.com</span>, then land on
              their clinic — for example{" "}
              <span className="font-mono text-fc-ink">belize.christmedical.com</span>.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/how-it-works" className="text-sm font-medium text-fc-accent hover:text-fc-accent-strong">
                How it works →
              </Link>
              <Link href="/about" className="text-sm font-medium text-fc-accent hover:text-fc-accent-strong">
                About the project →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
