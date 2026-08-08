import { BarChart3 } from "lucide-react";
import { StubPage } from "@/components/stub-page";

export default function AnalyticsPage() {
  return (
    <StubPage
      title="Analytics"
      description="Funnel conversion, response rates, and observational insights across your applications."
      icon={BarChart3}
      emptyTitle="Nothing to analyze yet"
      emptyDescription="Analytics need real application outcomes to be meaningful — this fills in once applications start moving through the pipeline."
    />
  );
}
