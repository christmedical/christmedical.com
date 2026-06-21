import Link from "next/link";
import { FC_BTN_SECONDARY, FC_PAGE_STACK, FC_SURFACE, FC_SURFACE_BODY } from "@/components/design/fieldClinical";

export default function UnknownClinicPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-fc-paper px-4 py-12">
      <div className={`w-full max-w-md text-center ${FC_SURFACE} ${FC_PAGE_STACK}`}>
        <div className={`${FC_SURFACE_BODY} space-y-4`}>
          <h1 className="font-display text-2xl font-semibold text-fc-ink">Unknown clinic</h1>
          <p className="text-sm text-fc-ink-muted">
            This subdomain is not registered as a Christ Medical mission clinic, or it uses a
            reserved name.
          </p>
          <Link href="https://www.christmedical.com" className={FC_BTN_SECONDARY}>
            Back to christmedical.com
          </Link>
        </div>
      </div>
    </main>
  );
}
