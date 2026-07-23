import { MaterialTypeListing } from "@/components/MaterialTypeListing";

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  return <MaterialTypeListing type="COURSE" activeTag={tag} />;
}
