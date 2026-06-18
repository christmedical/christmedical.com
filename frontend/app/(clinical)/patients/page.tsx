import { Suspense } from "react";
import { PatientList } from "@/components/PatientList";

export default function PatientsPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading patient list…</p>
      }
    >
      <PatientList embedded />
    </Suspense>
  );
}
