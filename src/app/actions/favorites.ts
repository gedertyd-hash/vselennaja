"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/dal";

export async function toggleFavoriteAction(courseId: string) {
  const session = await requireSession();

  const existing = await prisma.favorite.findUnique({
    where: { userId_courseId: { userId: session.userId, courseId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
  } else {
    await prisma.favorite.create({ data: { userId: session.userId, courseId } });
  }

  revalidatePath("/materials");
  revalidatePath("/materials/guides");
  revalidatePath("/materials/courses");
  revalidatePath("/materials/cases");
  revalidatePath("/materials/workshops");
  revalidatePath("/favorites");
  revalidatePath("/home");
}
