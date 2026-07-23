"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/dal";
import { slugify } from "@/lib/slugify";

const MATERIAL_PATHS = [
  "/materials",
  "/materials/guides",
  "/materials/courses",
  "/materials/cases",
  "/materials/workshops",
];

function revalidateMaterialPaths() {
  for (const path of MATERIAL_PATHS) revalidatePath(path);
  revalidatePath("/home");
  revalidatePath("/admin");
}

export async function createCourseAction(formData: FormData) {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const type = String(formData.get("type") ?? "COURSE") as
    | "COURSE"
    | "GUIDE"
    | "CASE"
    | "WORKSHOP";
  const level = String(formData.get("level") ?? "BEGINNER") as
    | "BEGINNER"
    | "INTERMEDIATE"
    | "ADVANCED";
  const tag = String(formData.get("tag") ?? "").trim() || null;
  const coverImage = String(formData.get("coverImage") ?? "").trim() || null;
  const content = String(formData.get("content") ?? "").trim() || null;
  const videoUrl = String(formData.get("videoUrl") ?? "").trim() || null;
  if (!title) return;

  const baseSlug = slugify(title) || "material";
  let slug = baseSlug;
  let n = 1;
  while (await prisma.course.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${++n}`;
  }

  const course = await prisma.course.create({
    data: { title, description, slug, type, level, tag, coverImage },
  });

  if (type !== "COURSE") {
    const module_ = await prisma.module.create({
      data: { courseId: course.id, title: "Материал", order: 0 },
    });
    await prisma.lesson.create({
      data: {
        moduleId: module_.id,
        slug: "content",
        title,
        type: videoUrl ? "VIDEO" : "TEXT",
        content,
        videoUrl,
        order: 0,
      },
    });
  }

  revalidateMaterialPaths();
  redirect(`/admin/courses/${course.id}`);
}

export async function toggleCoursePublishedAction(courseId: string) {
  await requireAdmin();
  const course = await prisma.course.findUniqueOrThrow({ where: { id: courseId } });
  const nextPublished = !course.published;

  await prisma.course.update({
    where: { id: courseId },
    data: { published: nextPublished },
  });

  if (course.type !== "COURSE") {
    await prisma.lesson.updateMany({
      where: { module: { courseId } },
      data: { published: nextPublished },
    });
  }

  revalidateMaterialPaths();
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function updateMaterialContentAction(
  lessonId: string,
  courseId: string,
  formData: FormData
) {
  await requireAdmin();

  const content = String(formData.get("content") ?? "").trim() || null;
  const videoUrl = String(formData.get("videoUrl") ?? "").trim() || null;

  await prisma.lesson.update({
    where: { id: lessonId },
    data: { content, videoUrl, type: videoUrl ? "VIDEO" : "TEXT" },
  });

  revalidateMaterialPaths();
  revalidatePath(`/admin/courses/${courseId}`);
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
  const type = String(formData.get("type") ?? "TEXT") as "VIDEO" | "TEXT";
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
  revalidateMaterialPaths();
}
