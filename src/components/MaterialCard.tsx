import Link from "next/link";
import { IconStar } from "@/components/icons";
import { toggleFavoriteAction } from "@/app/actions/favorites";
import { LEVEL_CLASSES, LEVEL_LABEL, formatRelativeDate } from "@/lib/materials";

const TYPE_GLOW: Record<string, string> = {
  GUIDE: "var(--yolk)",
  COURSE: "var(--sage)",
  CASE: "var(--paprika)",
  WORKSHOP: "var(--cream)",
};

export type MaterialCardData = {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: string;
  level: string;
  createdAt: Date;
  isNew: boolean;
  isFavorited: boolean;
  coverImage?: string | null;
};

export function MaterialCard({ material }: { material: MaterialCardData }) {
  const glow = TYPE_GLOW[material.type] ?? "var(--yolk)";

  return (
    <div className="group relative rounded-2xl border border-border bg-bg-elevated overflow-hidden hover:border-yolk/40 transition">
      <Link href={`/materials/${material.slug}`} className="block">
        <div
          className="relative min-h-[148px] flex items-center p-4 pt-11 overflow-hidden"
          style={
            material.coverImage
              ? {
                  backgroundImage: `linear-gradient(180deg, rgba(10,8,4,0.1) 0%, rgba(10,8,4,0.35) 55%, rgba(10,8,4,0.8) 100%), url(${material.coverImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : {
                  background: `radial-gradient(120% 120% at 15% 0%, ${glow}33 0%, transparent 60%), var(--bg-elevated-2)`,
                }
          }
        >
          {material.isNew && (
            <span className="absolute top-3 left-3 rounded-full bg-yolk text-yolk-ink text-[11px] font-semibold px-2.5 py-1 tracking-wide">
              НОВОЕ
            </span>
          )}
          <p className="font-display text-xl font-semibold leading-snug text-cream text-balance line-clamp-3">
            {material.title}
          </p>
        </div>
      </Link>

      <form action={toggleFavoriteAction.bind(null, material.id)} className="absolute top-3 right-3">
        <button
          type="submit"
          aria-label={material.isFavorited ? "Убрать из избранного" : "Добавить в избранное"}
          className={`p-1.5 rounded-full backdrop-blur-sm transition ${
            material.isFavorited
              ? "text-yolk bg-bg/60"
              : "text-cream/70 bg-bg/40 hover:text-yolk"
          }`}
        >
          <IconStar className="w-4 h-4" filled={material.isFavorited} />
        </button>
      </form>

      <Link href={`/materials/${material.slug}`} className="block p-4 pt-3">
        <p className="text-sm text-text-muted line-clamp-2 min-h-[2.5em]">
          {material.description}
        </p>
        <div className="flex items-center justify-between mt-3">
          <span
            className={`text-[11px] font-semibold px-2 py-1 rounded-full ${LEVEL_CLASSES[material.level as keyof typeof LEVEL_CLASSES]}`}
          >
            {LEVEL_LABEL[material.level as keyof typeof LEVEL_LABEL]}
          </span>
          <span className="text-xs text-text-faint">
            {formatRelativeDate(material.createdAt)}
          </span>
        </div>
      </Link>
    </div>
  );
}
