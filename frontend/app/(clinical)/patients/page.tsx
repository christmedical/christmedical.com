import { Suspense } from "react";
import { PatientSearch } from "@/components/PatientSearch";

export default function PatientsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-fc-ink-muted">Loading patients…</p>}>
      <PatientSearch />
    </Suspense>
  );
}
