import Link from "next/link";
import type { Spot } from "@/lib/data";
import { categoryLabel } from "@/lib/data";
import { categoryMeta } from "@/lib/ui";

export function SpotCard({ spot }: { spot: Spot }) {
  const meta = categoryMeta(spot.category);
  return (
    <Link
      href={`/spots/${spot.district}/${spot.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/30 hover:bg-white/[0.05] hover:shadow-[0_20px_50px_-20px_rgba(16,185,129,0.35)] group-hover/cards:[&:not(:hover)]:opacity-40 group-hover/cards:[&:not(:hover)]:blur-[1.5px] group-hover/cards:[&:not(:hover)]:scale-[0.98]"
    >
      {/* corner glow on hover */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-emerald-400/0 blur-2xl transition-colors duration-500 group-hover:bg-emerald-400/15" />

      <div className="mb-3 flex items-center gap-2 text-xs">
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-medium ring-1 ${meta.chip}`}>
          <span aria-hidden>{meta.emoji}</span>
          {categoryLabel(spot.category)}
        </span>
        <span className="capitalize text-stone-500">{spot.district}</span>
        {spot.seasonality.monsoon_dependent && (
          <span className="ml-auto text-cyan-300/80" title="Monsoon-dependent">
            ☔
          </span>
        )}
      </div>

      <h3 className="font-serif text-lg font-black leading-snug text-stone-100 transition-colors group-hover:text-emerald-200">
        {spot.name.en}
      </h3>
      <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-stone-400">{spot.summary}</p>

      <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
        {spot.tags.slice(0, 4).map((t) => (
          <span
            key={t}
            className="rounded-md border border-white/[0.06] bg-white/[0.03] px-1.5 py-0.5 text-[11px] text-stone-500"
          >
            {t}
          </span>
        ))}
      </div>
    </Link>
  );
}
