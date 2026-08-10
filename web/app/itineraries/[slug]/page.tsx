import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FadeIn } from "@/components/fade-in";
import { StopCard } from "@/components/stop-card";
import { TracingBeam } from "@/components/tracing-beam";
import { TripMap, type DayRoutes, type TripMapStop } from "@/components/trip-map";
import routeData from "@/lib/routes.json";
import { formatMonths } from "@/lib/format";
import { getItineraries, getItinerary, getSpotById, getSpotImagePath } from "@/lib/data";
import { categoryMeta } from "@/lib/ui";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return getItineraries().map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const it = getItinerary(slug);
  if (!it) return {};
  return { title: it.title, description: it.notes ?? undefined };
}

const PARTY_LABEL: Record<string, string> = {
  family: "👪 Family-friendly",
  couple: "💑 For couples",
  friends: "🚙 Friends' trip",
  solo: "🎒 Solo-friendly",
  any: "🌍 For anyone",
};

export default async function ItineraryPage({ params }: { params: Params }) {
  const { slug } = await params;
  const it = getItinerary(slug);
  if (!it) notFound();

  const days = Array.from({ length: it.duration_days }, (_, i) => i + 1);

  const mapStops: TripMapStop[] = it.stops
    .map((stop): TripMapStop | null => {
      const spot = getSpotById(stop.spot_id);
      if (!spot) return null;
      const c = spot.location.coordinates;
      return {
        id: spot.id,
        district: spot.district,
        slug: spot.slug,
        name: spot.name.en,
        lat: c.lat,
        lng: c.lng,
        day: stop.day,
        order: stop.order,
        emoji: categoryMeta(spot.category).emoji,
        approx: c.precision !== "exact",
      };
    })
    .filter((s): s is TripMapStop => s !== null);

  // Road geometry baked by scripts/fetch-routes.mjs. JSON keys are strings, and
  // a trip missing from the file simply falls back to straight lines.
  const baked = (routeData.routes as Record<string, Record<string, number[][]>>)[slug];
  const routes: DayRoutes = {};
  for (const [day, points] of Object.entries(baked ?? {})) {
    routes[Number(day)] = points as [number, number][];
  }

  return (
    <article className="relative mx-auto max-w-3xl px-4 py-12">
      <div className="pointer-events-none absolute -top-10 right-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-[90px]" />

      <nav className="text-xs text-stone-500">
        <Link href="/itineraries" className="transition-colors hover:text-emerald-300">
          Trips
        </Link>{" "}
        <span className="text-stone-700">/</span> {it.districts.join(" · ")}
      </nav>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-emerald-400/10 px-3 py-1 font-bold text-emerald-300 ring-1 ring-emerald-400/25">
          {it.duration_days} day{it.duration_days > 1 ? "s" : ""} · {it.stops.length} stops
        </span>
        <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-stone-400">
          {PARTY_LABEL[it.party] ?? it.party}
        </span>
        <span className="rounded-full bg-amber-400/10 px-3 py-1 font-semibold text-amber-300 ring-1 ring-amber-400/25">
          Best: {formatMonths(it.best_months)}
        </span>
        {it.total_drive_km && (
          <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-stone-400">
            ~{it.total_drive_km} km
          </span>
        )}
      </div>

      <h1 className="mt-4 font-serif text-4xl font-black leading-[1.05] tracking-tight text-stone-50 sm:text-5xl">
        {it.title}
      </h1>
      {it.notes && <p className="mt-4 text-lg leading-relaxed text-stone-400">{it.notes}</p>}

      <div className="mt-8">
        <TripMap stops={mapStops} durationDays={it.duration_days} routes={routes} />
      </div>

      <TracingBeam className="mt-12">
        {days.map((day) => {
          const stops = it.stops.filter((s) => s.day === day).sort((a, b) => a.order - b.order);
          const note = it.day_notes.find((n) => n.day === day);
          return (
            <section key={day} className="mb-12">
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-5xl font-black text-stroke">
                  {String(day).padStart(2, "0")}
                </span>
                <h2 className="font-serif text-2xl font-black italic text-stone-100">
                  Day {day}
                </h2>
              </div>
              {note && (
                <p className="mt-3 rounded-2xl border border-amber-400/15 bg-amber-400/[0.05] p-4 text-sm leading-relaxed text-stone-300">
                  {note.note}
                </p>
              )}
              <div className="mt-5 space-y-3">
                {stops.map((stop, idx) => {
                  const spot = getSpotById(stop.spot_id);
                  if (!spot) return null;
                  return (
                    <FadeIn key={`${stop.day}-${stop.order}`} delay={idx * 0.05}>
                      <StopCard
                        stop={{
                          order: stop.order,
                          name: spot.name.en,
                          category: spot.category,
                          durationMin: stop.duration_min,
                          href: `/spots/${spot.district}/${spot.slug}`,
                          image: getSpotImagePath(spot.id),
                          note: stop.note,
                        }}
                      />
                    </FadeIn>
                  );
                })}
              </div>
            </section>
          );
        })}
      </TracingBeam>

      <FadeIn>
        <section className="mt-4 rounded-2xl border border-white/[0.07] bg-gradient-to-br from-emerald-400/[0.07] to-transparent p-6 text-sm text-stone-400">
          <p>
            <strong className="font-semibold text-stone-200">Base:</strong>{" "}
            <span className="capitalize">{it.base_hub.replace(/-/g, " ")}</span>
            {it.total_drive_km && <> · <strong className="font-semibold text-stone-200">Total driving:</strong> ~{it.total_drive_km} km</>}
            {" "}· <strong className="font-semibold text-stone-200">Themes:</strong> {it.themes.join(", ")}
          </p>
          <p className="mt-2 text-xs text-stone-500">
            Every stop links to its full record — timings, fees, seasons, safety and sources.
          </p>
        </section>
      </FadeIn>
    </article>
  );
}
