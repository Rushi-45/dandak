import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FadeIn } from "@/components/fade-in";
import {
  categoryLabel,
  formatMonths,
  getAllSpots,
  getSpot,
  getSpotById,
  type Spot,
} from "@/lib/data";
import { categoryMeta, CONFIDENCE_META } from "@/lib/ui";

type Params = Promise<{ district: string; slug: string }>;

export function generateStaticParams() {
  return getAllSpots().map((s) => ({ district: s.district, slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { district, slug } = await params;
  const spot = getSpot(district, slug);
  if (!spot) return {};
  return {
    title: spot.seo.meta_title ?? spot.name.en,
    description: spot.seo.meta_description ?? spot.summary,
  };
}

const DAY_NAMES: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 backdrop-blur">
      <dt className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-stone-100">{value}</dd>
    </div>
  );
}

function quickFacts(spot: Spot): { label: string; value: string }[] {
  const facts: { label: string; value: string }[] = [];

  facts.push({ label: "Best months", value: formatMonths(spot.seasonality.best_months) });

  if (spot.visit.duration_min) {
    const h = spot.visit.duration_min / 60;
    facts.push({
      label: "Time needed",
      value: h >= 1 ? `~${Math.round(h * 10) / 10} hr` : `${spot.visit.duration_min} min`,
    });
  }

  if (spot.visit.fees === null) {
    facts.push({ label: "Entry", value: "Fee unverified" });
  } else if (spot.visit.fees.length === 0 || spot.visit.fees.every((f) => f.amount_inr === 0)) {
    facts.push({ label: "Entry", value: "Free" });
  } else {
    const entry = spot.visit.fees.find((f) => f.type === "entry") ?? spot.visit.fees[0];
    facts.push({ label: `${categoryLabel(entry.type)} fee`, value: `₹${entry.amount_inr}` });
  }

  if (spot.visit.timings && spot.visit.timings.length > 0) {
    const t = spot.visit.timings[0];
    facts.push({ label: "Hours", value: `${t.open}–${t.close}` });
  } else if (spot.visit.timings?.length === 0) {
    facts.push({ label: "Hours", value: "Open area" });
  }

  if (spot.visit.weekly_closure) {
    facts.push({
      label: "Closed",
      value: `${DAY_NAMES[spot.visit.weekly_closure] ?? spot.visit.weekly_closure}s`,
    });
  }

  if (spot.experience.difficulty) {
    facts.push({ label: "Effort", value: categoryLabel(spot.experience.difficulty) });
  }

  return facts.slice(0, 6);
}

export default async function SpotPage({ params }: { params: Params }) {
  const { district, slug } = await params;
  const spot = getSpot(district, slug);
  if (!spot) notFound();

  const meta = categoryMeta(spot.category);
  const conf = CONFIDENCE_META[spot.provenance.confidence];
  const paragraphs = spot.description?.split("\n\n") ?? [];
  const verified = spot.provenance.last_verified;

  return (
    <article className="relative mx-auto max-w-3xl px-4 py-12">
      {/* page glow */}
      <div className="pointer-events-none absolute -top-10 right-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-[90px]" />

      {/* Header */}
      <nav className="text-xs text-stone-500">
        <Link href="/spots" className="transition-colors hover:text-emerald-300">
          Spots
        </Link>{" "}
        <span className="text-stone-700">/</span> <span className="capitalize">{spot.district}</span>
      </nav>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold ring-1 ${meta.chip}`}>
          <span aria-hidden>{meta.emoji}</span>
          {categoryLabel(spot.category)}
        </span>
        {spot.cluster && (
          <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-stone-400">
            {categoryLabel(spot.cluster)}
          </span>
        )}
        {spot.seasonality.monsoon_dependent && (
          <span className="rounded-full bg-cyan-400/10 px-3 py-1 font-semibold text-cyan-300 ring-1 ring-cyan-400/30">
            ☔ Monsoon-dependent
          </span>
        )}
        <span className={`ml-auto rounded-full px-3 py-1 font-semibold ring-1 ${conf.cls}`}>
          {conf.label}
        </span>
      </div>

      <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-stone-50 sm:text-5xl">
        {spot.name.en}
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-stone-400">{spot.summary}</p>

      {/* Quick facts */}
      <dl className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {quickFacts(spot).map((f) => (
          <Fact key={f.label} label={f.label} value={f.value} />
        ))}
      </dl>

      {spot.visit.booking.required && spot.visit.booking.url && (
        <a
          href={spot.visit.booking.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-bold text-emerald-950 shadow-[0_10px_40px_-10px_rgba(16,185,129,0.6)] transition-shadow hover:shadow-[0_10px_50px_-8px_rgba(16,185,129,0.8)]"
        >
          Book tickets (official) ↗
        </a>
      )}

      {/* Description */}
      {paragraphs.length > 0 && (
        <FadeIn>
          <section className="mt-12">
            {paragraphs.map((p, i) => (
              <p key={i} className="mt-4 leading-relaxed text-stone-300 first:mt-0">
                {p}
              </p>
            ))}
          </section>
        </FadeIn>
      )}

      {/* Highlights */}
      {spot.highlights && spot.highlights.length > 0 && (
        <FadeIn>
          <section className="mt-12 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-300">
              Highlights
            </h2>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {spot.highlights.map((h) => (
                <li key={h} className="flex gap-2.5 text-sm leading-snug text-stone-300">
                  <span className="mt-0.5 text-emerald-400">◆</span>
                  {h}
                </li>
              ))}
            </ul>
          </section>
        </FadeIn>
      )}

      {/* Lore */}
      {spot.history_legend && (
        <FadeIn>
          <section className="mt-12 overflow-hidden rounded-2xl border border-amber-400/15 bg-gradient-to-br from-amber-400/[0.08] to-transparent p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-300">
              History &amp; lore
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-stone-300">{spot.history_legend}</p>
          </section>
        </FadeIn>
      )}

      {/* Tips & warnings */}
      <FadeIn>
        <section className="mt-12 grid gap-4 sm:grid-cols-2">
          {spot.tips.length > 0 && (
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-teal-300">
                Traveller tips
              </h2>
              <ul className="mt-4 space-y-2.5 text-sm leading-snug text-stone-300">
                {spot.tips.map((t) => (
                  <li key={t} className="flex gap-2">
                    <span className="text-teal-400">→</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {spot.safety.warnings.length > 0 && (
            <div className="rounded-2xl border border-red-400/15 bg-gradient-to-br from-red-400/[0.07] to-transparent p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-red-300">Safety</h2>
              <ul className="mt-4 space-y-2.5 text-sm leading-snug text-stone-300">
                {spot.safety.warnings.map((w) => (
                  <li key={w} className="flex gap-2">
                    <span className="text-red-400">⚠</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </FadeIn>

      {/* Getting there */}
      <FadeIn>
        <section className="mt-12 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-300">
            Getting there
          </h2>
          <div className="mt-4 space-y-2.5 text-sm leading-relaxed text-stone-400">
            {spot.access.modes.road && (
              <p>
                <strong className="font-semibold text-stone-200">Road · </strong>
                {spot.access.modes.road}
              </p>
            )}
            {spot.access.modes.rail && (
              <p>
                <strong className="font-semibold text-stone-200">Rail · </strong>
                {spot.access.modes.rail}
              </p>
            )}
            {spot.access.modes.air && (
              <p>
                <strong className="font-semibold text-stone-200">Air · </strong>
                {spot.access.modes.air}
              </p>
            )}
            {spot.access.last_mile && (
              <p>
                <strong className="font-semibold text-stone-200">Last stretch · </strong>
                {spot.access.last_mile}
              </p>
            )}
          </div>
          {Object.keys(spot.location.distances_km).length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {Object.entries(spot.location.distances_km).map(([hub, km]) => (
                <span
                  key={hub}
                  className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-xs text-stone-400"
                >
                  {categoryLabel(hub)} <span className="text-emerald-300">{km} km</span>
                </span>
              ))}
            </div>
          )}
        </section>
      </FadeIn>

      {/* FAQs */}
      {spot.faqs.length > 0 && (
        <FadeIn>
          <section className="mt-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-300">
              Questions people ask
            </h2>
            <div className="mt-4 space-y-4">
              {spot.faqs.map((f) => (
                <div key={f.q} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                  <h3 className="text-sm font-bold text-stone-100">{f.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-400">{f.a}</p>
                </div>
              ))}
            </div>
          </section>
        </FadeIn>
      )}

      {/* Nearby */}
      {spot.nearby.length > 0 && (
        <FadeIn>
          <section className="mt-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-300">Nearby</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {spot.nearby.map((n) => {
                const near = getSpotById(n.id);
                if (!near) return null;
                return (
                  <Link
                    key={n.id}
                    href={`/spots/${near.district}/${near.slug}`}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-sm text-stone-300 transition-all hover:-translate-y-0.5 hover:border-emerald-400/40 hover:text-emerald-200"
                  >
                    {near.name.en} <span className="text-xs text-stone-500">· {n.distance_km} km</span>
                  </Link>
                );
              })}
            </div>
          </section>
        </FadeIn>
      )}

      {/* Provenance */}
      <section className="mt-14 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 text-xs text-stone-500">
        <p>
          Data confidence:{" "}
          <span className={`rounded-full px-2 py-0.5 font-semibold ring-1 ${conf.cls}`}>{conf.label}</span>
          {verified ? ` · facts last verified ${verified}` : " · not yet verified against sources"}
          {spot.provenance.needs_verification.length > 0 &&
            ` · ${spot.provenance.needs_verification.length} field(s) awaiting verification`}
        </p>
        {spot.provenance.sources.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {spot.provenance.sources.map((s) => (
              <li key={s.title}>
                {s.url ? (
                  <a
                    href={s.url}
                    className="underline decoration-stone-700 underline-offset-2 transition-colors hover:text-emerald-300"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {s.title}
                  </a>
                ) : (
                  s.title
                )}
                {s.publisher ? <span className="text-stone-600"> — {s.publisher}</span> : ""}
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}
