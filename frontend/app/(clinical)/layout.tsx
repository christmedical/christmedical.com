import { EmrLayout } from "@/components/emr/EmrLayout";
import { AuthBootstrap } from "@/components/auth/AuthBootstrap";
import type { ReactNode } from "react";

export default function ClinicalWorkflowLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthBootstrap />
      <EmrLayout>{children}</EmrLayout>
    </>
  );
}
