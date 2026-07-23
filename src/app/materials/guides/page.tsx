import { MaterialTypeListing } from "@/components/MaterialTypeListing";

export default async function GuidesPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  return <MaterialTypeListing type="GUIDE" activeTag={tag} />;
}
