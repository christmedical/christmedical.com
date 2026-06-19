import { Suspense } from "react";
import { PatientChart } from "@/components/PatientChart";

export default function NewPatientPage() {
  return (
    <Suspense fallback={<p className="text-sm text-fc-ink-muted">Loading chart…</p>}>
      <PatientChart isNew />
    </Suspense>
  );
}
