import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FadeIn } from "@/components/fade-in";
import { SpotCard } from "@/components/spot-card";
import { RealMap, type SpotMarker } from "@/components/leaflet-map";
import { MONTHS, categoryLabel } from "@/lib/format";
import { getAllSpots, getDistrict, getEvents, getFoodImagePath, getFoods, getSpotById, toCardData } from "@/lib/data";
import { AREAS } from "@/lib/areas";
import { categoryMeta } from "@/lib/ui";

type Params = Promise<{ id: string }>;

export function generateStaticParams() {
  return [{ id: "dang" }, { id: "narmada" }];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  if (id !== "dang" && id !== "narmada") return {};
  const d = getDistrict(id);
  return {
    title: `${d.name.en} District`,
    description: d.headline,
    alternates: { canonical: `/districts/${id}` },
  };
}

const RAIN_STYLE: Record<string, string> = {
  none: "bg-stone-600",
  low: "bg-sky-400",
  moderate: "bg-blue-400",
  heavy: "bg-cyan-300",
};

export default async function DistrictPage({ params }: { params: Params }) {
  const { id } = await params;
  if (id !== "dang" && id !== "narmada") notFound();
  const d = getDistrict(id);
  const events = getEvents().filter((e) => d.festivals.includes(e.id));
  const foods = getFoods().filter((f) => d.foods.includes(f.id));
  const accent = id === "dang" ? "text-emerald-300" : "text-amber-300";

  const markers: SpotMarker[] = getAllSpots()
    .filter((s) => s.district === id)
    .map((s) => ({
      id: s.id,
      district: s.district,
      slug: s.slug,
      name: s.name.en,
      lat: s.location.coordinates.lat,
      lng: s.location.coordinates.lng,
      category: s.category,
      emoji: categoryMeta(s.category).emoji,
    }));
  const counts = new Map<string, number>();
  for (const m of markers) counts.set(m.category, (counts.get(m.category) ?? 0) + 1);
  const categories = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({
      key,
      label: categoryLabel(key),
      emoji: categoryMeta(key).emoji,
      count,
    }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <p className={`text-[11px] font-semibold uppercase tracking-[0.3em] ${accent}`}>
        District · Gujarat
      </p>
      <h1 className="mt-2 font-serif text-6xl font-black italic tracking-tight text-stone-50 sm:text-7xl">
        {d.name.en}
      </h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-stone-400">{d.headline}</p>

      {/* Overview */}
      <FadeIn>
        <section className="mt-10 max-w-3xl">
          {d.overview.split("\n\n").map((p, i) => (
            <p key={i} className="mt-4 leading-relaxed text-stone-300 first:mt-0">
              {p}
            </p>
          ))}
        </section>
      </FadeIn>

      {/* Hero spots */}
      <FadeIn>
        <section className="mt-14">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-300">
            The essentials
          </h2>
          <div className="group/cards mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {d.hero_spots.map((sid) => {
              const spot = getSpotById(sid);
              return spot ? <SpotCard key={sid} spot={toCardData(spot)} /> : null;
            })}
          </div>
          <Link
            href={`/spots#${id}`}
            className="mt-5 inline-block text-sm font-semibold text-emerald-300 hover:text-emerald-200"
          >
            All {d.name.en} spots →
          </Link>
        </section>
      </FadeIn>

      {/* Areas, every spot belongs to exactly one, so this covers the district
          with no overlap and gives the deeper pages their inbound links. */}
      <FadeIn>
        <section className="mt-14">
          <h2 className={`text-xs font-bold uppercase tracking-widest ${accent}`}>
            {d.name.en} by area
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {AREAS.filter((a) => a.district === id).map((a) => {
              const n = getAllSpots().filter(
                (s) => s.cluster && a.clusters.includes(s.cluster)
              ).length;
              return (
                <Link
                  key={a.slug}
                  href={`/areas/${a.slug}`}
                  className="group rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition-all hover:-translate-y-0.5 hover:border-emerald-400/30 hover:bg-white/[0.04]"
                >
                  <p className="font-serif text-lg font-black text-stone-100 group-hover:text-emerald-200">
                    {a.title}
                  </p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-stone-600">
                    {n} places
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-stone-400">{a.blurb}</p>
                </Link>
              );
            })}
          </div>
        </section>
      </FadeIn>

      {/* District map */}
      <section className="mt-14">
        <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-300">
          {d.name.en} on the map
        </h2>
        <div className="mt-5">
          <RealMap markers={markers} categories={categories} />
        </div>
      </section>

      {/* Weather */}
      <FadeIn>
        <section className="mt-14">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-300">
            The year, month by month
          </h2>
          <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {d.weather_by_month.map((w) => (
              <div
                key={w.month}
                className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-center"
                title={w.notes ?? undefined}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                  {MONTHS[w.month - 1]}
                </p>
                <p className="mt-1 text-sm font-semibold text-stone-200">
                  {w.temp_min_c}–{w.temp_max_c}°
                </p>
                <p className="mt-1.5 flex items-center justify-center gap-1 text-[10px] text-stone-500">
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${RAIN_STYLE[w.rain]}`} />
                  {w.rain}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-stone-500">{d.best_season}</p>
        </section>
      </FadeIn>

      {/* Getting there + practical */}
      <FadeIn>
        <section className="mt-14 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-300">
              Getting there
            </h2>
            <div className="mt-4 space-y-2.5 text-sm leading-relaxed text-stone-400">
              <p><strong className="font-semibold text-stone-200">Road · </strong>{d.getting_there.road}</p>
              <p><strong className="font-semibold text-stone-200">Rail · </strong>{d.getting_there.rail}</p>
              <p><strong className="font-semibold text-stone-200">Air · </strong>{d.getting_there.air}</p>
              <p><strong className="font-semibold text-stone-200">On the ground · </strong>{d.local_transport}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-teal-300">
              Know before you go
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm leading-snug text-stone-300">
              {d.tips.map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="text-teal-400">→</span>
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-white/[0.06] pt-3 text-xs text-stone-500">
              Emergency: {d.emergency.police} · Ambulance {d.emergency.ambulance} ·{" "}
              {d.emergency.hospitals[0]}
            </p>
          </div>
        </section>
      </FadeIn>

      {/* Festivals */}
      {events.length > 0 && (
        <FadeIn>
          <section className="mt-14">
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-300">
              When {d.name.en} celebrates
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {events.map((e) => (
                <div key={e.id} className="rounded-2xl border border-amber-400/10 bg-gradient-to-br from-amber-400/[0.06] to-transparent p-5">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="rounded-full bg-amber-400/10 px-2 py-0.5 font-bold uppercase tracking-wide text-amber-300 ring-1 ring-amber-400/25">
                      {e.type}
                    </span>
                    <span className="text-stone-500">
                      {e.timing.typical_months.map((m) => MONTHS[m - 1]).join(" · ")}
                    </span>
                  </div>
                  <h3 className="mt-2 font-serif text-xl font-black text-stone-100">{e.name.en}</h3>
                  <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-stone-400">
                    {e.description}
                  </p>
                </div>
              ))}
            </div>
            <Link href="/events" className="mt-5 inline-block text-sm font-semibold text-amber-300 hover:text-amber-200">
              All events →
            </Link>
          </section>
        </FadeIn>
      )}

      {/* Food */}
      {foods.length > 0 && (
        <FadeIn>
          <section className="mt-14">
            <h2 className="text-xs font-bold uppercase tracking-widest text-rose-300">
              Eat like a local
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {foods.map((f) => {
                const img = getFoodImagePath(f.id);
                const credit = f.media?.images?.[0]?.credit;
                return (
                  <div
                    key={f.id}
                    className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] transition-colors hover:border-rose-300/25"
                  >
                    {img && (
                      <div className="relative h-36 w-full">
                        <Image
                          src={img}
                          alt={f.name.en}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                        {credit && (
                          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/45 px-1.5 py-0.5 text-[9px] text-stone-300 backdrop-blur-md">
                            📷 {credit}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="p-4">
                      <p className="font-serif text-lg font-black leading-snug text-stone-100">
                        {f.veg ? "🌿" : "🍗"} {f.name.en}
                      </p>
                      {f.season && (
                        <p className="mt-1 text-[11px] text-stone-500">
                          {f.season.split("(")[0].trim().split(";")[0]}
                        </p>
                      )}
                      <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-stone-400">
                        {f.description}
                      </p>
                      {f.where_to_try.length > 0 && (
                        <p className="mt-2 text-[11px] leading-snug text-stone-500">
                          <span className="text-rose-300/70">Try at:</span>{" "}
                          {f.where_to_try.slice(0, 2).map((w) => w.name).join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </FadeIn>
      )}
    </div>
  );
}
