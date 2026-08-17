import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FadeIn } from "@/components/fade-in";
import { JsonLd } from "@/components/json-ld";
import { SectionHeading } from "@/components/section-heading";
import { MONTHS } from "@/lib/format";
import { getEvent, getEvents, getSpotById, getSpotImagePath } from "@/lib/data";
import { abs } from "@/lib/site";

type Params = Promise<{ slug: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return getEvents().map((e) => ({ slug: e.slug }));
}

const TYPE_STYLE: Record<string, string> = {
  festival: "bg-amber-400/10 text-amber-300 ring-amber-400/25",
  fair: "bg-rose-400/10 text-rose-300 ring-rose-400/25",
  show: "bg-purple-400/10 text-purple-300 ring-purple-400/25",
  "season-window": "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25",
};

const SCALE_LABEL: Record<string, string> = {
  local: "Local",
  regional: "Regional draw",
  national: "National draw",
};

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const e = getEvent(slug);
  if (!e) return {};
  const months = e.timing.typical_months.map((m) => MONTHS[m - 1]).join("–");
  const description = `${e.name.en} (${months}, ${e.district}): timing, crowd reality and every tip the dataset carries.`;
  const image = e.spot_id ? getSpotImagePath(e.spot_id) : null;
  const path = `/events/${e.slug}`;
  return {
    title: e.name.en,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      url: path,
      title: e.name.en,
      description,
      images: image ? [{ url: image, alt: e.name.en }] : undefined,
    },
    twitter: { card: image ? "summary_large_image" : "summary", title: e.name.en, description },
  };
}

export default async function EventDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const e = getEvent(slug);
  if (!e) notFound();

  const spot = e.spot_id ? getSpotById(e.spot_id) : undefined;
  const img = e.spot_id ? getSpotImagePath(e.spot_id) : null;
  const path = `/events/${e.slug}`;
  const months = e.timing.typical_months.map((m) => MONTHS[m - 1]).join(" – ");

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      {/* Honest Event markup: these recur by month on lunar or seasonal dates,
          so there is no startDate to claim. eventSchedule with byMonth states
          exactly what the dataset knows and nothing more. */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Event",
              name: e.name.en,
              description: e.description,
              url: abs(path),
              ...(img ? { image: abs(img) } : {}),
              eventSchedule: {
                "@type": "Schedule",
                repeatFrequency: "P1Y",
                byMonth: e.timing.typical_months,
                ...(e.timing.duration_days ? { duration: `P${e.timing.duration_days}D` } : {}),
              },
              location: {
                "@type": "Place",
                name: spot?.name.en ?? e.place ?? `${e.district} district`,
                address: { "@type": "PostalAddress", addressRegion: "Gujarat", addressCountry: "IN" },
              },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Events", item: abs("/events") },
                { "@type": "ListItem", position: 2, name: e.name.en, item: abs(path) },
              ],
            },
          ],
        }}
      />

      <nav className="text-xs text-stone-500">
        <Link href="/events" className="transition-colors hover:text-amber-300">
          Events
        </Link>{" "}
        / <span className="text-stone-400">{e.name.en}</span>
      </nav>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px]">
        <span className={`rounded-full px-2.5 py-1 font-bold uppercase tracking-wide ring-1 ${TYPE_STYLE[e.type]}`}>
          {e.type.replace("-", " ")}
        </span>
        <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-semibold text-stone-300">
          {months}
        </span>
        <span className="text-stone-500">{SCALE_LABEL[e.scale]}</span>
        <span className="ml-auto capitalize text-stone-500">{e.district}</span>
      </div>

      <h1 className="mt-4 font-serif text-4xl font-black leading-[1.05] tracking-tight text-stone-50 sm:text-5xl">
        {e.name.en}
      </h1>
      <p className="mt-3 text-sm text-stone-500">{e.timing.recurrence}</p>

      {img && (
        <div className="relative mt-8 h-64 w-full overflow-hidden rounded-[2rem] ring-1 ring-white/10 sm:h-80">
          <Image src={img} alt={spot?.name.en ?? e.name.en} fill priority sizes="(min-width: 768px) 736px, 100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080c0b]/60 via-transparent to-transparent" />
        </div>
      )}

      <FadeIn>
        <p className="mt-8 max-w-[68ch] text-[1.0625rem] leading-[1.75] text-stone-200">
          {e.description}
        </p>
      </FadeIn>

      <FadeIn>
        <section className="mt-10 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">When</p>
            <p className="mt-1 text-sm font-semibold text-stone-100">{months}</p>
          </div>
          {e.timing.duration_days && (
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">Runs for</p>
              <p className="mt-1 text-sm font-semibold text-stone-100">
                ~{e.timing.duration_days} day{e.timing.duration_days > 1 ? "s" : ""}
              </p>
            </div>
          )}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">Where</p>
            <p className="mt-1 text-sm font-semibold text-stone-100">
              {spot?.name.en ?? e.place ?? `${e.district} district`}
            </p>
          </div>
        </section>
      </FadeIn>

      {e.crowd_impact && (
        <FadeIn>
          <p className="mt-6 rounded-2xl border border-rose-400/15 bg-rose-400/[0.06] p-5 text-sm leading-relaxed text-stone-300">
            <strong className="font-bold text-rose-300">Crowd reality · </strong>
            {e.crowd_impact}
          </p>
        </FadeIn>
      )}

      {e.tips.length > 0 && (
        <FadeIn>
          <section className="mt-10">
            <SectionHeading>Go prepared</SectionHeading>
            <ul className="mt-5 space-y-2.5">
              {e.tips.map((t) => (
                <li key={t} className="flex gap-2.5 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-5 py-3.5 text-sm leading-relaxed text-stone-300">
                  <span className="text-amber-300">💡</span>
                  {t}
                </li>
              ))}
            </ul>
          </section>
        </FadeIn>
      )}

      {spot && (
        <FadeIn>
          <p className="mt-10">
            <Link
              href={`/spots/${spot.district}/${spot.slug}`}
              className="inline-block rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-2.5 text-sm font-bold text-emerald-200 transition-colors hover:bg-emerald-400/20"
            >
              📍 The place itself: {spot.name.en} →
            </Link>
          </p>
        </FadeIn>
      )}

      <FadeIn>
        <p className="mt-12 text-sm text-stone-500">
          <Link href="/events" className="font-semibold text-amber-300 transition-colors hover:text-amber-200">
            ← The whole calendar
          </Link>
        </p>
      </FadeIn>
    </article>
  );
}
