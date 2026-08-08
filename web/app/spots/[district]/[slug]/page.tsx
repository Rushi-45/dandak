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
    <div className="rounded-xl border border-stone-200 bg-white p-3">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-stone-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-stone-800">{value}</dd>
    </div>
  );
}

function quickFacts(spot: Spot): { label: string; value: string }[] {
  const facts: { label: string; value: string }[] = [];

  facts.push({ label: "Best months", value: formatMonths(spot.seasonality.best_months) });

  if (spot.visit.duration_min) {
    const h = spot.visit.duration_min / 60;
    facts.push({ label: "Time needed", value: h >= 1 ? `~${Math.round(h * 10) / 10} hr` : `${spot.visit.duration_min} min` });
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
    facts.push({ label: "Closed", value: `${DAY_NAMES[spot.visit.weekly_closure] ?? spot.visit.weekly_closure}s` });
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

  const paragraphs = spot.description?.split("\n\n") ?? [];
  const verified = spot.provenance.last_verified;

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      {/* Header */}
      <nav className="text-xs text-stone-400">
        <Link href="/spots" className="hover:text-emerald-800">
          Spots
        </Link>{" "}
        / <span className="capitalize">{spot.district}</span>
      </nav>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-medium text-emerald-800">
          {categoryLabel(spot.category)}
        </span>
        {spot.cluster && (
          <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-stone-500">
            {categoryLabel(spot.cluster)}
          </span>
        )}
        {spot.seasonality.monsoon_dependent && (
          <span className="rounded-full bg-sky-50 px-2.5 py-0.5 font-medium text-sky-700">
            Monsoon-dependent
          </span>
        )}
      </div>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
        {spot.name.en}
      </h1>
      <p className="mt-3 text-lg leading-relaxed text-stone-600">{spot.summary}</p>

      {/* Quick facts */}
      <dl className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {quickFacts(spot).map((f) => (
          <Fact key={f.label} label={f.label} value={f.value} />
        ))}
      </dl>

      {spot.visit.booking.required && spot.visit.booking.url && (
        <a
          href={spot.visit.booking.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block rounded-xl bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Book tickets (official) ↗
        </a>
      )}

      {/* Description */}
      {paragraphs.length > 0 && (
        <FadeIn>
          <section className="prose-stone mt-10">
            {paragraphs.map((p, i) => (
              <p key={i} className="mt-4 leading-relaxed text-stone-700">
                {p}
              </p>
            ))}
          </section>
        </FadeIn>
      )}

      {/* Highlights */}
      {spot.highlights && spot.highlights.length > 0 && (
        <FadeIn>
          <section className="mt-10">
            <h2 className="text-lg font-bold text-stone-900">Highlights</h2>
            <ul className="mt-3 space-y-2">
              {spot.highlights.map((h) => (
                <li key={h} className="flex gap-2 text-sm text-stone-700">
                  <span className="mt-0.5 text-emerald-700">✓</span>
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
          <section className="mt-10 rounded-2xl border border-amber-100 bg-amber-50/60 p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-amber-800">
              History &amp; lore
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-700">{spot.history_legend}</p>
          </section>
        </FadeIn>
      )}

      {/* Tips & warnings */}
      <FadeIn>
        <section className="mt-10 grid gap-4 sm:grid-cols-2">
          {spot.tips.length > 0 && (
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <h2 className="text-sm font-bold text-stone-900">Traveller tips</h2>
              <ul className="mt-3 space-y-2 text-sm text-stone-600">
                {spot.tips.map((t) => (
                  <li key={t}>• {t}</li>
                ))}
              </ul>
            </div>
          )}
          {spot.safety.warnings.length > 0 && (
            <div className="rounded-2xl border border-red-100 bg-red-50/50 p-5">
              <h2 className="text-sm font-bold text-red-900">Safety</h2>
              <ul className="mt-3 space-y-2 text-sm text-stone-700">
                {spot.safety.warnings.map((w) => (
                  <li key={w}>⚠ {w}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </FadeIn>

      {/* Getting there */}
      <FadeIn>
        <section className="mt-10">
          <h2 className="text-lg font-bold text-stone-900">Getting there</h2>
          <div className="mt-3 space-y-2 text-sm text-stone-600">
            {spot.access.modes.road && <p><strong className="text-stone-800">Road:</strong> {spot.access.modes.road}</p>}
            {spot.access.modes.rail && <p><strong className="text-stone-800">Rail:</strong> {spot.access.modes.rail}</p>}
            {spot.access.modes.air && <p><strong className="text-stone-800">Air:</strong> {spot.access.modes.air}</p>}
            {spot.access.last_mile && <p><strong className="text-stone-800">Last stretch:</strong> {spot.access.last_mile}</p>}
          </div>
          {Object.keys(spot.location.distances_km).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(spot.location.distances_km).map(([hub, km]) => (
                <span key={hub} className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs text-stone-600">
                  {categoryLabel(hub)} · {km} km
                </span>
              ))}
            </div>
          )}
        </section>
      </FadeIn>

      {/* FAQs */}
      {spot.faqs.length > 0 && (
        <FadeIn>
          <section className="mt-10">
            <h2 className="text-lg font-bold text-stone-900">Questions people ask</h2>
            <div className="mt-3 space-y-4">
              {spot.faqs.map((f) => (
                <div key={f.q}>
                  <h3 className="text-sm font-semibold text-stone-800">{f.q}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-stone-600">{f.a}</p>
                </div>
              ))}
            </div>
          </section>
        </FadeIn>
      )}

      {/* Nearby */}
      {spot.nearby.length > 0 && (
        <FadeIn>
          <section className="mt-10">
            <h2 className="text-lg font-bold text-stone-900">Nearby</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {spot.nearby.map((n) => {
                const near = getSpotById(n.id);
                if (!near) return null;
                return (
                  <Link
                    key={n.id}
                    href={`/spots/${near.district}/${near.slug}`}
                    className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 hover:border-emerald-300 hover:text-emerald-800"
                  >
                    {near.name.en} <span className="text-xs text-stone-400">· {n.distance_km} km</span>
                  </Link>
                );
              })}
            </div>
          </section>
        </FadeIn>
      )}

      {/* Provenance */}
      <section className="mt-12 rounded-2xl border border-stone-200 bg-white p-5 text-xs text-stone-500">
        <p>
          Data confidence:{" "}
          <strong className="capitalize text-stone-700">{spot.provenance.confidence}</strong>
          {verified ? ` · facts last verified ${verified}` : " · not yet verified against sources"}
          {spot.provenance.needs_verification.length > 0 &&
            ` · ${spot.provenance.needs_verification.length} field(s) awaiting verification`}
        </p>
        {spot.provenance.sources.length > 0 && (
          <ul className="mt-2 space-y-1">
            {spot.provenance.sources.map((s) => (
              <li key={s.title}>
                {s.url ? (
                  <a href={s.url} className="underline hover:text-emerald-800" target="_blank" rel="noopener noreferrer">
                    {s.title}
                  </a>
                ) : (
                  s.title
                )}
                {s.publisher ? ` — ${s.publisher}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}
