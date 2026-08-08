import Link from "next/link";
import type { Spot } from "@/lib/data";
import { categoryLabel } from "@/lib/data";

const confidenceDot: Record<string, string> = {
  high: "bg-emerald-500",
  medium: "bg-amber-400",
  low: "bg-stone-300",
};

export function SpotCard({ spot }: { spot: Spot }) {
  return (
    <Link
      href={`/spots/${spot.district}/${spot.slug}`}
      className="group flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="mb-2 flex items-center gap-2 text-xs">
        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-medium text-emerald-800">
          {categoryLabel(spot.category)}
        </span>
        <span className="text-stone-400 capitalize">{spot.district}</span>
        <span
          className={`ml-auto inline-block h-2 w-2 rounded-full ${confidenceDot[spot.provenance.confidence]}`}
          title={`Data confidence: ${spot.provenance.confidence}`}
        />
      </div>
      <h3 className="text-base font-semibold text-stone-900 group-hover:text-emerald-800">
        {spot.name.en}
      </h3>
      <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-stone-600">{spot.summary}</p>
      <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
        {spot.tags.slice(0, 4).map((t) => (
          <span key={t} className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[11px] text-stone-500">
            {t}
          </span>
        ))}
      </div>
    </Link>
  );
}
