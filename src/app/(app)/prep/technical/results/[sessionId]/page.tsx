import { ResultsPage } from "@/components/technical-learning/results-page";

export default async function TechnicalResultsPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  return <ResultsPage sessionId={sessionId} />;
}
