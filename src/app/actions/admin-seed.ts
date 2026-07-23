"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/dal";
import { seedDemoContent } from "@/lib/demo-content";

export async function runDemoSeedAction() {
  await requireAdmin();

  await seedDemoContent(prisma);

  revalidatePath("/admin");
  revalidatePath("/home");
  revalidatePath("/materials");
  revalidatePath("/materials/guides");
  revalidatePath("/materials/courses");
  revalidatePath("/materials/cases");
  revalidatePath("/materials/workshops");
}
