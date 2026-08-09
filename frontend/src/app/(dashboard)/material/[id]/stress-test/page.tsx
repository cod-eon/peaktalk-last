import { StressTestSurface } from "@/components/peak/LiveMaterialWorkspace";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function MaterialStressTestPage({ params }: Props) {
  const { id } = await params;
  return <StressTestSurface materialId={id} />;
}
