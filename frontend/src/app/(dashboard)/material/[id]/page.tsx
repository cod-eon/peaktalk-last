import { MaterialWorkspace } from "@/components/peak/LiveMaterialWorkspace";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ layer?: string }>;
};

export default async function MaterialPage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  return <MaterialWorkspace materialId={id} initialLayerId={query?.layer} />;
}
