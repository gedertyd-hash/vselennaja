"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/dal";

export async function completeLessonAction(lessonId: string, courseSlug: string) {
  const session = await requireSession();

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: session.userId, lessonId } },
    update: {},
    create: { userId: session.userId, lessonId },
  });

  revalidatePath(`/courses/${courseSlug}`);
  revalidatePath(`/lessons/${lessonId}`);
}

export async function uncompleteLessonAction(lessonId: string, courseSlug: string) {
  const session = await requireSession();

  await prisma.lessonProgress
    .delete({
      where: { userId_lessonId: { userId: session.userId, lessonId } },
    })
    .catch(() => null);

  revalidatePath(`/courses/${courseSlug}`);
  revalidatePath(`/lessons/${lessonId}`);
}
