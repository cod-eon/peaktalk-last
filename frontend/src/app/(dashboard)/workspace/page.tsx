import { WorkspaceHome } from "@/components/peak/LiveMaterialWorkspace";

type Props = {
  searchParams?: Promise<{ upload?: string }>;
};

export default async function WorkspacePage({ searchParams }: Props) {
  const params = await searchParams;
  return <WorkspaceHome mode={params?.upload ? "upload" : "empty"} />;
}
