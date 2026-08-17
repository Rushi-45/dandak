import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FadeIn } from "@/components/fade-in";
import { JsonLd } from "@/components/json-ld";
import { getFoodImagePath, getFoods } from "@/lib/data";
import { abs } from "@/lib/site";

export const metadata: Metadata = {
  title: "What to eat in Dang & Narmada",
  description:
    "Nagli rotla, vaas nu shaak, Dang forest honey, Saputara strawberries: the ten dishes and produce of the belt, where to actually try them, and the culture behind each.",
  alternates: { canonical: "/food" },
};

/** dish / produce / drink chips, kept in the food palette (rose) the district pages already use */
const TYPE_CHIP = "rounded-full bg-rose-400/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-rose-300 ring-1 ring-rose-400/25";

export default function FoodPage() {
  const foods = getFoods();

  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "ItemList",
              name: "Food of Dang and Narmada",
              itemListElement: foods.map((f, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: f.name.en,
                url: abs(`/food/${f.slug}`),
              })),
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: abs("/") },
                { "@type": "ListItem", position: 2, name: "Food", item: abs("/food") },
              ],
            },
          ],
        }}
      />

      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-rose-300">
        Eat like a local
      </p>
      <h1 className="mt-2 font-serif text-5xl font-black tracking-tight text-stone-100">
        The food{" "}
        <span className="bg-gradient-to-r from-rose-200 to-amber-200 bg-clip-text italic text-transparent">
          of the belt.
        </span>
      </h1>
      <p className="mt-3 max-w-xl text-sm text-stone-500">
        Hill-farm staples, forest produce and two famous crops. None of it is restaurant
        invention: this is what the districts actually eat, and where a traveller can sit down to
        it.
      </p>

      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {foods.map((f, i) => {
          const img = getFoodImagePath(f.id);
          const credit = f.media?.images?.[0]?.credit;
          return (
            <FadeIn key={f.id} delay={i * 0.03}>
              <Link
                href={`/food/${f.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-white/[0.07] bg-white/[0.02] transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-300/30 hover:bg-white/[0.04]"
              >
                {img && (
                  <div className="relative h-44 w-full">
                    <Image
                      src={img}
                      alt={f.name.en}
                      fill
                      sizes="(min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c100e] via-transparent to-transparent" />
                    {credit && (
                      <span className="absolute bottom-2 right-2 rounded bg-black/45 px-1.5 py-0.5 text-[9px] text-stone-300 backdrop-blur-md">
                        📷 {credit}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={TYPE_CHIP}>{f.type}</span>
                    {f.veg && (
                      <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        veg
                      </span>
                    )}
                    <span className="ml-auto text-[11px] capitalize text-stone-500">
                      {f.districts.join(" · ")}
                    </span>
                  </div>
                  <h2 className="mt-2.5 font-serif text-xl font-black leading-snug text-stone-100 group-hover:text-rose-200">
                    {f.name.en}
                  </h2>
                  <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-stone-400">
                    {f.description}
                  </p>
                  <p className="mt-auto pt-3 text-xs font-semibold text-rose-300/80">
                    Where to try it →
                  </p>
                </div>
              </Link>
            </FadeIn>
          );
        })}
      </div>
    </div>
  );
}
