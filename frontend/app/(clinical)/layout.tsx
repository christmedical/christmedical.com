import { EmrLayout } from "@/components/emr/EmrLayout";
import type { ReactNode } from "react";

export default function ClinicalWorkflowLayout({ children }: { children: ReactNode }) {
  return <EmrLayout>{children}</EmrLayout>;
}
