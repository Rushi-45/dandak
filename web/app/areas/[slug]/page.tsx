import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FadeIn } from "@/components/fade-in";
import { JsonLd } from "@/components/json-ld";
import { SpotCard, type SpotCardData } from "@/components/spot-card";
import { AREAS, areaBySlug } from "@/lib/areas";
import {
  getAllSpots,
  getItineraries,
  getSpotImagePath,
  getStays,
  toCardData,
  type Spot,
} from "@/lib/data";
import { MONTHS, categoryLabel } from "@/lib/format";
import { abs } from "@/lib/site";
import { categoryMeta, stayTypeMeta } from "@/lib/ui";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return AREAS.map((a) => ({ slug: a.slug }));
}

/** Slugs come from a hand-written manifest, so an unknown one is a 404, not a render. */
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const area = areaBySlug(slug);
  if (!area) return {};
  const spots = spotsOf(area.clusters);
  const title = `${area.title} — ${spots.length} places, mapped and verified`;
  const description = `${area.blurb} Every documented place in ${area.title}, with seasons, road access and what it costs.`;
  const hero = spots.map((s) => getSpotImagePath(s.id)).find(Boolean) ?? null;
  const path = `/areas/${area.slug}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      url: path,
      title,
      description,
      images: hero ? [{ url: hero, alt: area.title }] : undefined,
    },
    twitter: {
      card: hero ? "summary_large_image" : "summary",
      title,
      description,
      images: hero ? [hero] : undefined,
    },
  };
}

const spotsOf = (clusters: string[]) =>
  getAllSpots().filter((s) => s.cluster && clusters.includes(s.cluster));

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <FadeIn>
      <section className="mt-14">
        <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-300">{title}</h2>
        {children}
      </section>
    </FadeIn>
  );
}

/**
 * First sentence only, with the rest on the spot's own page.
 *
 * The spot page is the canonical home for a spot's prose — it is about that
 * spot. Printing these notes in full here as well would put the same paragraphs
 * at two URLs and make the site compete with itself, which is the thing every
 * facet page gets wrong. An excerpt plus a link is the honest shape: enough to
 * be useful in aggregate, and a reason to open the record.
 */
function excerpt(text: string, max = 180): string {
  const stop = text.search(/[.!?](\s|$)/);
  const first = stop > 0 ? text.slice(0, stop + 1) : text;
  return first.length > max ? `${first.slice(0, max).trimEnd()}…` : first;
}

function NoteList({ items }: { items: { spot: Spot; text: string }[] }) {
  return (
    <div className="mt-4 space-y-2.5">
      {items.map(({ spot, text }) => (
        <Link
          key={spot.id}
          href={`/spots/${spot.district}/${spot.slug}`}
          className="group block rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 transition-colors hover:border-emerald-400/30 hover:bg-white/[0.04]"
        >
          <span className="font-serif text-base font-black text-stone-100 group-hover:text-emerald-200">
            {spot.name.en}
          </span>
          <span className="mt-1 block text-sm leading-relaxed text-stone-400">
            {excerpt(text)}
          </span>
        </Link>
      ))}
    </div>
  );
}

export default async function AreaPage({ params }: { params: Params }) {
  const { slug } = await params;
  const area = areaBySlug(slug);
  if (!area) notFound();

  const spots = spotsOf(area.clusters);
  const cards: SpotCardData[] = spots.map(toCardData);
  const path = `/areas/${area.slug}`;

  // Facts only this dataset can state. All derived, none written by hand.
  const free = spots.filter((s) => s.visit.fees !== null && !s.visit.fees.some((f) => f.amount_inr > 0));
  const monsoon = spots.filter((s) => s.seasonality.monsoon_dependent);
  const totalMin = spots.reduce((sum, s) => sum + (s.visit.duration_min ?? 0), 0);
  const byCategory = [...spots.reduce((m, s) => m.set(s.category, (m.get(s.category) ?? 0) + 1), new Map<string, number>())]
    .sort((a, b) => b[1] - a[1]);
  const monthHistogram = MONTHS.map((label, i) => ({
    label,
    count: spots.filter((s) => s.seasonality.best_months.includes(i + 1)).length,
  }));
  const peak = Math.max(...monthHistogram.map((m) => m.count), 1);

  // Written prose that renders nowhere else on the site
  const notes = (pick: (s: Spot) => string | null | undefined) =>
    spots
      .map((s) => ({ spot: s, text: (pick(s) ?? "").trim() }))
      .filter((n) => n.text.length > 0);
  const roadNotes = notes((s) => s.access?.road_condition);
  const photoNotes = notes((s) => s.experience?.photography_notes);
  const seasonNotes = notes((s) => s.seasonality?.notes);

  const stays = getStays().filter((s) => s.cluster && area.clusters.includes(s.cluster));
  const spotIds = new Set(spots.map((s) => s.id));
  const trips = getItineraries().filter((i) => i.stops.some((st) => spotIds.has(st.spot_id)));
  const aliases = [...new Set(spots.flatMap((s) => s.aliases ?? []))];
  const neighbours = AREAS.filter((a) => a.slug !== area.slug && a.district === area.district);

  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "ItemList",
              name: area.title,
              description: area.blurb,
              url: abs(path),
              numberOfItems: spots.length,
              itemListElement: spots.map((s, i) => ({
                "@type": "ListItem",
                position: i + 1,
                item: {
                  "@type": "TouristAttraction",
                  name: s.name.en,
                  url: abs(`/spots/${s.district}/${s.slug}`),
                },
              })),
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Spots", item: abs("/spots") },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: area.district === "dang" ? "Dang" : "Narmada",
                  item: abs(`/districts/${area.district}`),
                },
                { "@type": "ListItem", position: 3, name: area.title, item: abs(path) },
              ],
            },
          ],
        }}
      />

      <nav className="text-xs text-stone-500">
        <Link href="/spots" className="transition-colors hover:text-emerald-300">
          Spots
        </Link>{" "}
        <span className="text-stone-700">/</span>{" "}
        <Link
          href={`/districts/${area.district}`}
          className="capitalize transition-colors hover:text-emerald-300"
        >
          {area.district}
        </Link>
      </nav>

      <h1 className="mt-4 font-serif text-5xl font-black leading-[1.05] tracking-tight text-stone-50">
        {area.title}
      </h1>
      <div className="mt-5 max-w-2xl space-y-4">
        {area.intro.map((p, i) => (
          <p key={i} className="leading-relaxed text-stone-400">
            {p}
          </p>
        ))}
      </div>

      {/* By the numbers — derived, and not copyable without the dataset */}
      <dl className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { label: "Places", value: String(spots.length) },
          { label: "Free to enter", value: `${free.length} of ${spots.length}` },
          { label: "Monsoon-fed", value: `${monsoon.length} of ${spots.length}` },
          { label: "All of it takes", value: `~${Math.round(totalMin / 60)} hr` },
        ].map((f) => (
          <div key={f.label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
            <dt className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">
              {f.label}
            </dt>
            <dd className="mt-1 font-serif text-xl font-black text-stone-100">{f.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {byCategory.map(([cat, n]) => (
          <span
            key={cat}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${categoryMeta(cat).chip}`}
          >
            {categoryMeta(cat).emoji} {categoryLabel(cat)} · {n}
          </span>
        ))}
      </div>

      {/* When this area peaks */}
      <Section title="When it peaks">
        <p className="mt-2 max-w-2xl text-sm text-stone-500">
          How many of these {spots.length} places are at their best in each month, counted from
          every record&rsquo;s own season window.
        </p>
        <div className="mt-4 flex items-end gap-1.5 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
          {monthHistogram.map((m) => (
            <div key={m.label} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-[10px] font-bold text-stone-500">{m.count || ""}</span>
              <div
                className="w-full rounded-t bg-gradient-to-t from-emerald-500/30 to-emerald-400/70"
                style={{ height: `${Math.round((m.count / peak) * 96) + 2}px` }}
              />
              <span className="text-[10px] text-stone-600">{m.label}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* The list */}
      <Section title={`Every place in ${area.title}`}>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <SpotCard key={c.slug} spot={c} />
          ))}
        </div>
      </Section>

      {roadNotes.length > 0 && (
        <Section title="Getting around">
          <p className="mt-2 max-w-2xl text-sm text-stone-500">
            What the roads are actually like, per place.
          </p>
          <NoteList items={roadNotes} />
        </Section>
      )}

      {seasonNotes.length > 0 && (
        <Section title="Season notes">
          <NoteList items={seasonNotes} />
        </Section>
      )}

      {photoNotes.length > 0 && (
        <Section title="For photographers">
          <NoteList items={photoNotes} />
        </Section>
      )}

      {stays.length > 0 && (
        <Section title="Where to sleep here">
          <div className="mt-4 flex flex-wrap gap-2">
            {stays.map((s) => (
              <Link
                key={s.id}
                href={`/stays#${s.id}`}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-sm text-stone-300 transition-all hover:-translate-y-0.5 hover:border-emerald-400/40 hover:text-emerald-200"
              >
                {stayTypeMeta(s.type).emoji} {s.name}
                <span className="text-xs text-stone-500"> · {s.price_band}</span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {trips.length > 0 && (
        <Section title="Routes through here">
          <div className="mt-4 flex flex-wrap gap-2">
            {trips.map((t) => (
              <Link
                key={t.slug}
                href={`/itineraries/${t.slug}`}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-sm text-stone-300 transition-all hover:-translate-y-0.5 hover:border-emerald-400/40 hover:text-emerald-200"
              >
                {t.title}
                <span className="text-xs text-stone-500"> · {t.duration_days}d</span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {aliases.length > 0 && (
        <Section title="Also known as">
          <p className="mt-3 text-sm leading-relaxed text-stone-500">
            Local and alternative spellings you may see on signs, in vlogs or on other maps:{" "}
            {aliases.join(" · ")}.
          </p>
        </Section>
      )}

      <Section title="Nearby areas">
        <div className="mt-4 flex flex-wrap gap-2">
          {neighbours.map((n) => (
            <Link
              key={n.slug}
              href={`/areas/${n.slug}`}
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-sm text-stone-300 transition-all hover:-translate-y-0.5 hover:border-emerald-400/40 hover:text-emerald-200"
            >
              {n.title}
            </Link>
          ))}
          <Link
            href={`/districts/${area.district}`}
            className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-sm text-stone-300 transition-all hover:-translate-y-0.5 hover:border-emerald-400/40 hover:text-emerald-200"
          >
            All of {area.district === "dang" ? "Dang" : "Narmada"} →
          </Link>
        </div>
      </Section>
    </div>
  );
}
