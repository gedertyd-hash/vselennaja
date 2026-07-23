import { MaterialTypeListing } from "@/components/MaterialTypeListing";

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  return <MaterialTypeListing type="CASE" activeTag={tag} />;
}
