import { Suspense } from "react";
import { PatientBrowse } from "@/components/PatientList";

export default function PatientsPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-zinc-600">Loading patients…</p>
      }
    >
      <PatientBrowse embedded />
    </Suspense>
  );
}
