import { StressTestReport } from "@/components/peak/LiveMaterialWorkspace";

type Props = {
  params: Promise<{ id: string; sessionId: string }>;
};

export default async function MaterialStressTestReportPage({ params }: Props) {
  const { id } = await params;
  return <StressTestReport materialId={id} />;
}
