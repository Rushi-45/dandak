import type { Metadata } from "next";
import Link from "next/link";
import { FadeIn } from "@/components/fade-in";
import { RouteThumb, type RouteThumbStop } from "@/components/route-thumb";
import { formatMonths } from "@/lib/format";
import { getItineraries, getSpotById } from "@/lib/data";

export const metadata: Metadata = {
  title: "Trips & Itineraries",
  description:
    "Ready-made routes through Dang and Narmada, monsoon waterfall circuits, Statue of Unity days, Ramayana trails and offbeat forest loops.",
  alternates: { canonical: "/itineraries" },
};

const PARTY_LABEL: Record<string, string> = {
  family: "👪 Family",
  couple: "💑 Couples",
  friends: "🚙 Friends",
  solo: "🎒 Solo",
  any: "🌍 Anyone",
};

export default function ItinerariesPage() {
  const itineraries = getItineraries();

  const thumbStops = (slug: string): RouteThumbStop[] =>
    (itineraries.find((i) => i.slug === slug)?.stops ?? [])
      .map((stop) => {
        const spot = getSpotById(stop.spot_id);
        if (!spot) return null;
        const c = spot.location.coordinates;
        return { lat: c.lat, lng: c.lng, day: stop.day, order: stop.order };
      })
      .filter((s): s is RouteThumbStop => s !== null);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-300">
        Ready-made routes
      </p>
      <h1 className="mt-2 font-serif text-5xl font-black tracking-tight text-stone-100">
        Pick a{" "}
        <span className="bg-gradient-to-r from-emerald-300 to-amber-200 bg-clip-text italic text-transparent">
          trip.
        </span>
      </h1>
      <p className="mt-3 max-w-xl text-sm text-stone-500">
        {itineraries.length} itineraries built from the dataset, every stop links to a documented
        place with timings, fees and seasons.
      </p>

      <FadeIn>
        <div className="group/cards mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {itineraries.map((it) => (
            <Link
              key={it.slug}
              href={`/itineraries/${it.slug}`}
              className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-white/[0.07] bg-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/30 hover:bg-white/[0.05] hover:shadow-[0_20px_50px_-20px_rgba(16,185,129,0.35)] group-hover/cards:[&:not(:hover)]:opacity-40 group-hover/cards:[&:not(:hover)]:blur-[1.5px]"
            >
              <div className="pointer-events-none absolute -right-14 -top-14 h-28 w-28 rounded-full bg-emerald-400/0 blur-2xl transition-colors duration-500 group-hover:bg-emerald-400/15" />
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 font-bold text-emerald-300 ring-1 ring-emerald-400/25">
                  {it.duration_days} day{it.duration_days > 1 ? "s" : ""}
                </span>
                <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-stone-400">
                  {it.stops.length} stops
                </span>
                <span className="ml-auto text-stone-500">{PARTY_LABEL[it.party] ?? it.party}</span>
              </div>
              <div className="mt-4 h-20 overflow-hidden rounded-xl border border-white/[0.05] bg-black/25 transition-colors duration-300 group-hover:border-emerald-400/20">
                <RouteThumb stops={thumbStops(it.slug)} />
              </div>
              <h2 className="mt-4 font-serif text-2xl font-black leading-snug text-stone-100 transition-colors group-hover:text-emerald-200">
                {it.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-400">{it.notes}</p>
              <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-5 text-[11px]">
                <span className="rounded-md bg-amber-400/10 px-2 py-0.5 font-semibold text-amber-300">
                  Best: {formatMonths(it.best_months)}
                </span>
                {it.total_drive_km && (
                  <span className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-stone-500">
                    ~{it.total_drive_km} km drive
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </FadeIn>
    </div>
  );
}
