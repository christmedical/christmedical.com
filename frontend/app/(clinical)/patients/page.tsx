import { Suspense } from "react";
import { PatientBrowse } from "@/components/PatientList";

export default function PatientsPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-zinc-600">Loading patients…</p>
      }
    >
      <div className="-m-6 flex min-h-[calc(100dvh-10rem)] flex-col overflow-hidden">
        <PatientBrowse embedded />
      </div>
    </Suspense>
  );
}
