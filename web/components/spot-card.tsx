import Image from "next/image";
import Link from "next/link";
import { categoryLabel } from "@/lib/format";
import { categoryMeta } from "@/lib/ui";

/** The slim, serializable slice of a spot the card needs. */
export interface SpotCardData {
  slug: string;
  district: string;
  name: { en: string };
  category: string;
  cluster: string | null;
  tags: string[];
  summary: string;
  seasonality: { monsoon_dependent: boolean | null };
  provenance: { confidence: "high" | "medium" | "low" };
  image?: string | null;
  /** derived from visit.fees, not from tags — see toCardData */
  free?: boolean;
}

const confidenceDot: Record<string, string> = {
  high: "bg-emerald-500",
  medium: "bg-amber-400",
  low: "bg-stone-300",
};

export function SpotCard({ spot }: { spot: SpotCardData }) {
  const meta = categoryMeta(spot.category);
  return (
    <Link
      href={`/spots/${spot.district}/${spot.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/30 hover:bg-white/[0.05] hover:shadow-[0_20px_50px_-20px_rgba(16,185,129,0.35)] group-hover/cards:[&:not(:hover)]:opacity-40 group-hover/cards:[&:not(:hover)]:blur-[1.5px] group-hover/cards:[&:not(:hover)]:scale-[0.98]"
    >
      {/* corner glow on hover */}
      <div className="pointer-events-none absolute -right-16 -top-16 z-10 h-32 w-32 rounded-full bg-emerald-400/0 blur-2xl transition-colors duration-500 group-hover:bg-emerald-400/15" />

      {spot.image && (
        <div className="relative -mx-5 -mt-5 mb-4 h-40 overflow-hidden">
          <Image
            src={spot.image}
            alt=""
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#101513] via-transparent to-transparent" />
        </div>
      )}

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
        <span
          className={`${spot.seasonality.monsoon_dependent ? "" : "ml-auto "}inline-block h-2 w-2 rounded-full ${confidenceDot[spot.provenance.confidence]}`}
          title={`Data confidence: ${spot.provenance.confidence}`}
        />
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
