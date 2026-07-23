"use client";

import { useState } from "react";
import { createCourseAction } from "@/app/actions/courses";
import { MATERIAL_TYPE_META, LEVEL_LABEL } from "@/lib/materials";

const inputClass =
  "w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-cream focus:border-yolk outline-none transition";

export function CreateMaterialForm() {
  const [type, setType] = useState<"COURSE" | "GUIDE" | "CASE" | "WORKSHOP">("GUIDE");

  return (
    <form action={createCourseAction} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <select name="type" value={type} onChange={(e) => setType(e.target.value as typeof type)} className={inputClass}>
          {(Object.keys(MATERIAL_TYPE_META) as (keyof typeof MATERIAL_TYPE_META)[]).map((key) => (
            <option key={key} value={key}>
              {MATERIAL_TYPE_META[key].singular}
            </option>
          ))}
        </select>
        <select name="level" defaultValue="BEGINNER" className={inputClass}>
          {(Object.keys(LEVEL_LABEL) as (keyof typeof LEVEL_LABEL)[]).map((key) => (
            <option key={key} value={key}>
              {LEVEL_LABEL[key]}
            </option>
          ))}
        </select>
      </div>

      <input name="title" placeholder="Название" required className={inputClass} />
      <textarea name="description" placeholder="Короткое описание (для карточки)" rows={2} className={inputClass} />
      <input name="tag" placeholder="Тег / категория (например Claude) — необязательно" className={inputClass} />

      {type !== "COURSE" && (
        <>
          <input name="videoUrl" placeholder="Ссылка на видео (embed) — необязательно" className={inputClass} />
          <textarea
            name="content"
            placeholder="Текст материала (поддерживается Markdown: **жирный**, ## заголовок, - списки)"
            rows={4}
            className={inputClass}
          />
        </>
      )}

      <button
        type="submit"
        className="rounded-full bg-yolk text-yolk-ink px-6 py-2 text-sm font-semibold hover:bg-yolk-bright transition"
      >
        Создать
      </button>
    </form>
  );
}
