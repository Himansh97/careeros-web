import { GuidedPath } from "@/components/technical-learning/guided-path";

export default async function TechnicalConceptPage({
  searchParams,
}: {
  searchParams: Promise<{ drill?: string }>;
}) {
  const { drill = "" } = await searchParams;
  return <GuidedPath drillId={drill} />;
}
