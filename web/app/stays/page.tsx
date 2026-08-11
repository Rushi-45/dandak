import type { Metadata } from "next";
import Link from "next/link";
import { FadeIn } from "@/components/fade-in";
import { getSpotById, getStays, type Stay } from "@/lib/data";
import { CONFIDENCE_META, PRICE_BAND_LABEL, stayTypeMeta } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Where to sleep",
  description:
    "Every documented bed across Dang and Narmada — Forest Department campsites with their official tariffs, the Statue of Unity tent cities, village homestays and the town lodges in between.",
};

const DISTRICT_LABEL: Record<string, string> = { dang: "Dang", narmada: "Narmada" };

/** Character first: the forest beds are the reason to come, the hotels are the fallback. */
const TYPE_ORDER = [
  "eco-campsite",
  "homestay",
  "guesthouse",
  "dharamshala",
  "resort",
  "tent-city",
  "hotel",
];
const typeRank = (t: string) => {
  const i = TYPE_ORDER.indexOf(t);
  return i < 0 ? TYPE_ORDER.length : i;
};

function StayCard({ stay }: { stay: Stay }) {
  const type = stayTypeMeta(stay.type);
  const conf = CONFIDENCE_META[stay.provenance.confidence];
  const official = stay.booking.url?.includes("ecotourismforest.gujarat.gov.in");

  return (
    <article
      id={stay.id}
      /* scroll-mt clears the sticky header when a /stays#id link lands here */
      className="relative scroll-mt-24 overflow-hidden rounded-[1.75rem] border border-white/[0.07] bg-white/[0.02] p-6 target:border-emerald-400/40 target:bg-emerald-400/[0.05] sm:p-7"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-400/[0.06] blur-2xl"
      />
      <div className="relative z-10">
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span
            className={`rounded-full px-2.5 py-1 font-bold uppercase tracking-wide ring-1 ${type.chip}`}
          >
            {type.emoji} {type.label}
          </span>
          <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-semibold text-stone-300">
            {PRICE_BAND_LABEL[stay.price_band] ?? stay.price_band}
          </span>
          {official && (
            <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 font-semibold text-emerald-300 ring-1 ring-emerald-400/25">
              Government run
            </span>
          )}
          <span className={`ml-auto rounded-full px-2.5 py-1 font-semibold ring-1 ${conf.cls}`}>
            {conf.label}
          </span>
        </div>

        <h3 className="mt-3 font-serif text-2xl font-black leading-tight text-stone-100">
          {stay.name}
        </h3>
        {stay.notes && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-400">{stay.notes}</p>
        )}
        {stay.booking.notes && (
          <p className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5 text-xs leading-relaxed text-stone-400">
            {stay.booking.notes}
          </p>
        )}

        {stay.amenities.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {stay.amenities.map((a) => (
              <li
                key={a}
                className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-[11px] text-stone-500"
              >
                {a}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          {stay.booking.url && (
            <a
              href={stay.booking.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 font-bold text-emerald-200 transition-colors hover:bg-emerald-400/20"
            >
              {official ? "Book on the Forest Department portal ↗" : "Booking ↗"}
            </a>
          )}
          {stay.contact && <span className="text-stone-500">{stay.contact}</span>}
          {!stay.booking.url && !stay.contact && (
            <span className="text-stone-600">
              {stay.booking.mode === "walk-in" ? "Walk-in — nothing listed online" : "Ask locally"}
            </span>
          )}
        </div>

        {stay.nearest_spots.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-4 text-xs">
            <span className="text-stone-600">Puts you near</span>
            {stay.nearest_spots.map((n) => {
              const spot = getSpotById(n.id);
              if (!spot) return null;
              return (
                <Link
                  key={n.id}
                  href={`/spots/${spot.district}/${spot.slug}`}
                  className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-stone-300 transition-all hover:-translate-y-0.5 hover:border-emerald-400/40 hover:text-emerald-200"
                >
                  {spot.name.en}
                  {n.distance_km > 0 && (
                    <span className="text-stone-500"> · {n.distance_km} km</span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
}

export default function StaysPage() {
  const stays = getStays();
  const government = stays.filter((s) =>
    s.booking.url?.includes("ecotourismforest.gujarat.gov.in")
  ).length;

  const byDistrict = (["dang", "narmada"] as const).map((district) => ({
    district,
    list: stays
      .filter((s) => s.district === district)
      .sort((a, b) => typeRank(a.type) - typeRank(b.type) || a.name.localeCompare(b.name)),
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-300">
        A roof in the forest
      </p>
      <h1 className="mt-2 font-serif text-5xl font-black tracking-tight text-stone-100">
        Where to{" "}
        <span className="bg-gradient-to-r from-emerald-200 to-teal-200 bg-clip-text italic text-transparent">
          sleep.
        </span>
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-500">
        {stays.length} beds across both districts, {government} of them Forest Department campsites
        that you book on the state&rsquo;s own portal. The rest run from a tent city under the
        Statue of Unity to village rooms that appear on no booking site at all — and we say plainly
        which is which.
      </p>

      <p className="mt-6 rounded-2xl border border-amber-400/15 bg-amber-400/[0.05] p-4 text-xs leading-relaxed text-stone-400">
        Tariffs are the ones the Forest Department publishes, and they change. Treat them as the
        floor for a night, confirm before you travel, and read the confidence label on each card —
        an <strong className="font-semibold text-stone-200">Explorer-grade</strong> bed is one we
        have found evidence of but could not verify against an official listing.
      </p>

      {byDistrict.map(({ district, list }) => (
        <section key={district} className="mt-12">
          <h2 className="flex items-baseline gap-3 font-serif text-2xl font-black italic text-stone-200">
            {DISTRICT_LABEL[district]}
            <span className="font-sans text-xs font-bold not-italic tracking-widest text-stone-600">
              {list.length} {list.length === 1 ? "BED" : "BEDS"}
            </span>
          </h2>
          <div className="mt-5 space-y-5">
            {list.map((stay, i) => (
              <FadeIn key={stay.id} delay={i * 0.03}>
                <StayCard stay={stay} />
              </FadeIn>
            ))}
          </div>
        </section>
      ))}

      <section className="mt-14 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 text-sm text-stone-400">
        <p>
          <strong className="font-semibold text-stone-200">Planning a trip around a bed?</strong>{" "}
          The <Link href="/plan" className="font-semibold text-emerald-300 hover:text-emerald-200">trip planner</Link>{" "}
          suggests where to sleep at the end of each day it builds, and every{" "}
          <Link href="/spots" className="font-semibold text-emerald-300 hover:text-emerald-200">place record</Link>{" "}
          lists the beds nearest to it.
        </p>
      </section>
    </div>
  );
}
