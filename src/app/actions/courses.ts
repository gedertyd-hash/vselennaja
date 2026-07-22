"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/dal";
import { slugify } from "@/lib/slugify";

export async function createCourseAction(formData: FormData) {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title) return;

  const baseSlug = slugify(title) || "course";
  let slug = baseSlug;
  let n = 1;
  while (await prisma.course.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${++n}`;
  }

  const course = await prisma.course.create({
    data: { title, description, slug },
  });

  revalidatePath("/admin");
  redirect(`/admin/courses/${course.id}`);
}

export async function toggleCoursePublishedAction(courseId: string) {
  await requireAdmin();
  const course = await prisma.course.findUniqueOrThrow({ where: { id: courseId } });
  await prisma.course.update({
    where: { id: courseId },
    data: { published: !course.published },
  });
  revalidatePath("/admin");
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/courses");
}

export async function createModuleAction(formData: FormData) {
  await requireAdmin();

  const courseId = String(formData.get("courseId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!courseId || !title) return;

  const lastModule = await prisma.module.findFirst({
    where: { courseId },
    orderBy: { order: "desc" },
  });

  await prisma.module.create({
    data: { courseId, title, order: (lastModule?.order ?? -1) + 1 },
  });

  revalidatePath(`/admin/courses/${courseId}`);
}

export async function createLessonAction(formData: FormData) {
  await requireAdmin();

  const moduleId = String(formData.get("moduleId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "TEXT") as
    | "VIDEO"
    | "TEXT"
    | "GUIDE"
    | "WORKSHOP";
  const content = String(formData.get("content") ?? "").trim() || null;
  const videoUrl = String(formData.get("videoUrl") ?? "").trim() || null;
  if (!moduleId || !title) return;

  const baseSlug = slugify(title) || "lesson";
  let slug = baseSlug;
  let n = 1;
  while (
    await prisma.lesson.findUnique({ where: { moduleId_slug: { moduleId, slug } } })
  ) {
    slug = `${baseSlug}-${++n}`;
  }

  const lastLesson = await prisma.lesson.findFirst({
    where: { moduleId },
    orderBy: { order: "desc" },
  });

  await prisma.lesson.create({
    data: {
      moduleId,
      title,
      slug,
      type,
      content,
      videoUrl,
      order: (lastLesson?.order ?? -1) + 1,
    },
  });

  revalidatePath(`/admin/courses/${courseId}`);
}

export async function toggleLessonPublishedAction(
  lessonId: string,
  courseId: string
) {
  await requireAdmin();
  const lesson = await prisma.lesson.findUniqueOrThrow({ where: { id: lessonId } });
  await prisma.lesson.update({
    where: { id: lessonId },
    data: { published: !lesson.published },
  });
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/courses");
}
