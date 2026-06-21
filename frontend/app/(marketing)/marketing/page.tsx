import Link from "next/link";
import { FC_BTN_PRIMARY, FC_PAGE_STACK, FC_SURFACE, FC_SURFACE_BODY } from "@/components/design/fieldClinical";

export default function MarketingPage() {
  return (
    <main className="min-h-dvh bg-fc-paper text-fc-ink">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
        <header className="space-y-3">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-fc-accent">
            Christ Medical
          </p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-fc-ink">
            Mission clinical workspace
          </h1>
          <p className="max-w-xl text-lg text-fc-ink-muted">
            Field-ready EMR for short-term medical missions — offline-capable, multi-clinic,
            spiritually aware.
          </p>
        </header>

        <section className={`${FC_SURFACE} ${FC_PAGE_STACK}`}>
          <div className={FC_SURFACE_BODY}>
            <p className="text-sm text-fc-ink-muted">
              Clinicians sign in at the global login portal. Each mission clinic runs on its own
              subdomain with branded theming.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="https://login.christmedical.com" className={FC_BTN_PRIMARY}>
                Clinician sign in
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
