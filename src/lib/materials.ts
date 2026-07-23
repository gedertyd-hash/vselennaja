import { IconBook, IconCap, IconBriefcase, IconUsers } from "@/components/icons";

export const MATERIAL_TYPE_META = {
  GUIDE: { label: "Гайды", singular: "гайд", href: "/materials/guides", icon: IconBook },
  COURSE: { label: "Курсы", singular: "курс", href: "/materials/courses", icon: IconCap },
  CASE: { label: "Юзкейсы", singular: "юзкейс", href: "/materials/cases", icon: IconBriefcase },
  WORKSHOP: { label: "Воркшопы", singular: "воркшоп", href: "/materials/workshops", icon: IconUsers },
} as const;

export const MATERIAL_TYPE_ORDER = ["GUIDE", "COURSE", "CASE", "WORKSHOP"] as const;

export const LEVEL_LABEL = {
  BEGINNER: "Новичок",
  INTERMEDIATE: "Средний",
  ADVANCED: "Продвинутый",
} as const;

export const LEVEL_CLASSES = {
  BEGINNER: "bg-sage text-sage-ink",
  INTERMEDIATE: "bg-yolk text-yolk-ink",
  ADVANCED: "bg-paprika text-paprika-ink",
} as const;

export function pluralizeCount(count: number, singular: string) {
  if (count === 1) return `1 ${singular}`;
  if (singular === "гайд") return `${count} ${count % 10 === 1 && count % 100 !== 11 ? "гайд" : "гайдов"}`;
  return `${count} ${singular}${count === 1 ? "" : "ов"}`;
}

export function isNewMaterial(date: Date, days = 14) {
  return Date.now() - date.getTime() < days * 24 * 60 * 60 * 1000;
}

export function formatRelativeDate(date: Date) {
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "сегодня";
  if (days === 1) return "вчера";
  if (days === 2) return "позавчера";
  if (days < 7) return `${days} дней назад`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} ${weeks === 1 ? "неделю" : weeks < 5 ? "недели" : "недель"} назад`;
  }
  const months = Math.floor(days / 30);
  return `${months} ${months === 1 ? "месяц" : months < 5 ? "месяца" : "месяцев"} назад`;
}
