import { MaterialTypeListing } from "@/components/MaterialTypeListing";

export default async function WorkshopsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  return <MaterialTypeListing type="WORKSHOP" activeTag={tag} />;
}
