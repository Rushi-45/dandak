import Link from "next/link";
import { FadeIn } from "@/components/fade-in";
import { SpotCard } from "@/components/spot-card";
import { getAllSpots, getDistrict, getItineraries, getSpotById } from "@/lib/data";

export default function Home() {
  const spots = getAllSpots();
  const dang = getDistrict("dang");
  const narmada = getDistrict("narmada");
  const itineraries = getItineraries();
  const verified = spots.filter((s) => s.provenance.last_verified).length;

  const districts = [
    { d: dang, href: "/spots#dang" },
    { d: narmada, href: "/spots#narmada" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Hero — renders immediately, no animation above the fold */}
      <section className="py-16 sm:py-24">
        <p className="text-sm font-medium uppercase tracking-widest text-emerald-700">
          Dang &amp; Narmada · Gujarat
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
          The forest belt of the epics, mapped honestly.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-stone-600">
          Waterfalls, hill meadows, the world&apos;s tallest statue and living adivasi culture —
          {" "}{spots.length} places documented with timings, fees, seasons and sources you can
          actually trust.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/spots"
            className="rounded-xl bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            Browse all {spots.length} spots
          </Link>
          <a
            href="https://github.com/Rushi-45/dandak"
            className="rounded-xl border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-700 hover:border-stone-400"
          >
            The dataset on GitHub
          </a>
        </div>
        <dl className="mt-10 grid max-w-xl grid-cols-3 gap-4 text-center">
          <div className="rounded-2xl border border-stone-200 bg-white p-4">
            <dt className="text-xs text-stone-500">Spots</dt>
            <dd className="text-2xl font-bold text-emerald-900">{spots.length}</dd>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-4">
            <dt className="text-xs text-stone-500">Verified</dt>
            <dd className="text-2xl font-bold text-emerald-900">{verified}</dd>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-4">
            <dt className="text-xs text-stone-500">Itineraries</dt>
            <dd className="text-2xl font-bold text-emerald-900">{itineraries.length}</dd>
          </div>
        </dl>
      </section>

      {/* District sections */}
      {districts.map(({ d, href }) => (
        <FadeIn key={d.id}>
          <section className="border-t border-stone-200 py-12">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold capitalize text-stone-900">{d.name.en}</h2>
                <p className="mt-1 max-w-2xl text-sm text-stone-600">{d.headline}</p>
              </div>
              <Link href={href} className="shrink-0 text-sm font-medium text-emerald-800 hover:underline">
                See all →
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {d.hero_spots.slice(0, 6).map((id) => {
                const spot = getSpotById(id);
                return spot ? <SpotCard key={id} spot={spot} /> : null;
              })}
            </div>
          </section>
        </FadeIn>
      ))}
    </div>
  );
}
