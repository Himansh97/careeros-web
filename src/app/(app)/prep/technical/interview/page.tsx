import { InterviewConfig } from "@/components/technical-learning/interview-config";
import { InterviewWorkspace } from "@/components/technical-learning/interview-workspace";

export default async function TechnicalInterviewPage({ searchParams }: { searchParams: Promise<{ session?: string }> }) {
  const { session } = await searchParams;
  return session ? <InterviewWorkspace sessionId={session} /> : <InterviewConfig />;
}
