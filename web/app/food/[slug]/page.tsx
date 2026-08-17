import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FadeIn } from "@/components/fade-in";
import { JsonLd } from "@/components/json-ld";
import { SectionHeading } from "@/components/section-heading";
import { getFood, getFoodImagePath, getFoods } from "@/lib/data";
import { abs } from "@/lib/site";

type Params = Promise<{ slug: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return getFoods().map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const f = getFood(slug);
  if (!f) return {};
  const description = `${f.description.split(/(?<=\.)\s/)[0]} Where to try it in ${f.districts.join(" and ")}, and the culture behind it.`;
  const image = getFoodImagePath(f.id);
  const path = `/food/${f.slug}`;
  return {
    title: f.name.en,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      url: path,
      title: f.name.en,
      description,
      images: image ? [{ url: image, alt: f.name.en }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: f.name.en,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function FoodDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const f = getFood(slug);
  if (!f) notFound();

  const img = getFoodImagePath(f.id);
  const meta = f.media?.images?.[0];
  const path = `/food/${f.slug}`;

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      {/* schema.org has no honest type for a regional dish — Recipe wants
          instructions and MenuItem wants a restaurant — so this stays a plain
          Thing plus the breadcrumb, which claims nothing the page cannot back. */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Thing",
              name: f.name.en,
              description: f.description,
              url: abs(path),
              ...(img ? { image: abs(img) } : {}),
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Food", item: abs("/food") },
                { "@type": "ListItem", position: 2, name: f.name.en, item: abs(path) },
              ],
            },
          ],
        }}
      />

      <nav className="text-xs text-stone-500">
        <Link href="/food" className="transition-colors hover:text-rose-300">
          Food
        </Link>{" "}
        / <span className="text-stone-400">{f.name.en}</span>
      </nav>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="rounded-full bg-rose-400/10 px-2.5 py-1 font-bold uppercase tracking-wide text-rose-300 ring-1 ring-rose-400/25">
          {f.type}
        </span>
        {f.veg && (
          <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 font-bold text-emerald-300">
            veg
          </span>
        )}
        <span className="capitalize text-stone-500">{f.districts.join(" · ")}</span>
        {f.season && <span className="ml-auto text-amber-300/90">🗓 {f.season}</span>}
      </div>

      <h1 className="mt-4 font-serif text-4xl font-black leading-[1.05] tracking-tight text-stone-50 sm:text-5xl">
        {f.name.en}
      </h1>

      {img && (
        <figure className="mt-8 overflow-hidden rounded-[2rem] ring-1 ring-white/10">
          <div className="relative h-64 w-full sm:h-80">
            <Image src={img} alt={meta?.caption ?? f.name.en} fill priority sizes="(min-width: 768px) 736px, 100vw" className="object-cover" />
          </div>
          {(meta?.caption || meta?.credit) && (
            <figcaption className="bg-white/[0.02] px-5 py-2.5 text-xs text-stone-500">
              {meta?.caption}
              {meta?.credit && <span className="text-stone-600"> · 📷 {meta.credit}</span>}
            </figcaption>
          )}
        </figure>
      )}

      <FadeIn>
        <p className="mt-8 max-w-[68ch] text-[1.0625rem] leading-[1.75] text-stone-200">
          {f.description}
        </p>
      </FadeIn>

      {f.cultural_note && (
        <FadeIn>
          <section className="mt-10 overflow-hidden rounded-2xl border border-amber-400/15 bg-gradient-to-br from-amber-400/[0.08] to-transparent p-6">
            <SectionHeading accent="amber">The culture behind it</SectionHeading>
            <p className="mt-4 max-w-[62ch] font-serif text-lg leading-[1.7] text-stone-200/90">
              {f.cultural_note}
            </p>
          </section>
        </FadeIn>
      )}

      {f.where_to_try.length > 0 && (
        <FadeIn>
          <section className="mt-10">
            <SectionHeading>Where to try it</SectionHeading>
            <ul className="mt-5 space-y-2.5">
              {f.where_to_try.map((w) => (
                <li
                  key={`${w.name}-${w.place}`}
                  className="flex items-baseline gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-5 py-3.5"
                >
                  <span className="font-semibold text-stone-100">{w.name}</span>
                  <span className="ml-auto shrink-0 text-right text-xs text-stone-500">{w.place}</span>
                </li>
              ))}
            </ul>
          </section>
        </FadeIn>
      )}

      <FadeIn>
        <p className="mt-12 text-sm text-stone-500">
          Hungry for the rest?{" "}
          <Link href="/food" className="font-semibold text-rose-300 transition-colors hover:text-rose-200">
            All ten foods of the belt →
          </Link>
        </p>
      </FadeIn>
    </article>
  );
}
