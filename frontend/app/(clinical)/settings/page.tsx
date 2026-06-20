import { EmrCard } from "@/components/emr/EmrCard";
import { EMR_PAGE_STACK } from "@/components/emr/EmrCard";

export default function SettingsPage() {
  return (
    <div className={EMR_PAGE_STACK}>
      <EmrCard title="Trip settings">
        <p className="text-sm text-fc-ink-muted">
          Formulary, site locations, and team roles will be configured here before the
          next mission trip.
        </p>
      </EmrCard>
    </div>
  );
}
