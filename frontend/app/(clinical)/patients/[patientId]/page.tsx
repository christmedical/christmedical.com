import { Suspense } from "react";
import { PatientChart } from "@/components/PatientChart";

type Props = {
  params: Promise<{ patientId: string }>;
};

export default async function PatientChartPage({ params }: Props) {
  const { patientId } = await params;
  return (
    <Suspense fallback={<p className="text-sm text-fc-ink-muted">Loading chart…</p>}>
      <PatientChart patientId={patientId} />
    </Suspense>
  );
}
