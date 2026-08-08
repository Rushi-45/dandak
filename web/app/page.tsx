import Image from "next/image";
import Link from "next/link";
import { FadeIn } from "@/components/fade-in";
import { SpotCard } from "@/components/spot-card";
import { getAllSpots, getDistrict, getItineraries, getSpotById } from "@/lib/data";
import souImg from "@/public/images/statue-of-unity.jpg";
import lakeImg from "@/public/images/saputara-lake.jpg";

export default function Home() {
  const spots = getAllSpots();
  const dang = getDistrict("dang");
  const narmada = getDistrict("narmada");
  const itineraries = getItineraries();
  const verified = spots.filter((s) => s.provenance.last_verified).length;
  const waterfalls = spots.filter((s) => s.category === "waterfall").length;

  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr]">
        {/* glow blobs */}
        <div className="pointer-events-none absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-emerald-500/15 blur-[110px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-56 w-56 rounded-full bg-amber-500/10 blur-[100px]" />

        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1 text-xs font-medium tracking-wide text-emerald-300">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Dang &amp; Narmada · Gujarat · dataset v1.0
          </p>

          <h1 className="mt-6 text-5xl font-black leading-[1.04] tracking-tight sm:text-6xl xl:text-7xl">
            <span className="text-stone-100">The forest belt</span>
            <br />
            <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 bg-clip-text text-transparent">
              of the epics.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone-400">
            Waterfalls that only exist in monsoon. A statue taller than imagination. Meadow
            villages, leopard forests and living Ramayana geography — {spots.length} places
            documented with timings, fees, seasons and{" "}
            <span className="text-emerald-300">sources you can actually trust</span>.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/spots"
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-bold text-emerald-950 shadow-[0_10px_40px_-10px_rgba(16,185,129,0.6)] transition-shadow hover:shadow-[0_10px_55px_-8px_rgba(16,185,129,0.85)]"
            >
              Explore {spots.length} spots →
            </Link>
            <Link
              href="/spots#dang"
              className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-stone-300 transition-colors hover:border-emerald-400/40 hover:text-emerald-300"
            >
              Start with Saputara
            </Link>
          </div>

          {/* stats */}
          <dl className="mt-12 grid max-w-md grid-cols-4 gap-3">
            {[
              { label: "Places", value: spots.length },
              { label: "Verified", value: verified },
              { label: "Falls", value: waterfalls },
              { label: "Routes", value: itineraries.length },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <dd className="bg-gradient-to-b from-emerald-200 to-emerald-400 bg-clip-text text-3xl font-black text-transparent">
                  {s.value}
                </dd>
                <dt className="mt-1 text-[10px] uppercase tracking-widest text-stone-500">
                  {s.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>

        {/* hero photo */}
        <div className="relative">
          <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-emerald-500/25 via-teal-500/10 to-amber-500/20 blur-2xl" />
          <div className="relative overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/15">
            <Image
              src={souImg}
              alt="The Statue of Unity towering over the visitor walkway at Ekta Nagar"
              priority
              placeholder="blur"
              className="h-[460px] w-full object-cover object-top sm:h-[560px]"
              sizes="(min-width: 1024px) 45vw, 100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080c0b]/85 via-transparent to-[#080c0b]/10" />
            {/* floating badge */}
            <div className="absolute left-4 top-4 rounded-xl border border-white/15 bg-black/40 px-3 py-2 backdrop-blur-md">
              <p className="text-[10px] uppercase tracking-widest text-stone-400">World&apos;s tallest statue</p>
              <p className="text-lg font-black text-stone-100">
                182 <span className="text-sm font-bold text-emerald-300">metres</span>
              </p>
            </div>
            {/* caption + credit */}
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-stone-100">Statue of Unity</p>
                <p className="text-xs text-stone-400">Ekta Nagar · Narmada</p>
              </div>
              <a
                href="https://commons.wikimedia.org/wiki/File:Statue_of_Unity.jpg"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-black/40 px-2 py-1 text-[10px] text-stone-400 backdrop-blur-md transition-colors hover:text-emerald-300"
              >
                📷 Vijay Barot · CC BY-SA
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Dang — photo banner ──────────────────────────────── */}
      <FadeIn>
        <section className="border-t border-white/[0.06] py-14">
          <div className="relative overflow-hidden rounded-3xl ring-1 ring-white/10">
            <Image
              src={lakeImg}
              alt="Saputara lake and town seen from the Pushpak ropeway"
              placeholder="blur"
              className="h-72 w-full object-cover sm:h-80"
              sizes="(min-width: 1152px) 1104px, 100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#080c0b]/95 via-[#080c0b]/55 to-[#080c0b]/10" />
            <div className="absolute inset-0 flex flex-col justify-center p-7 sm:p-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
                District 01
              </p>
              <h2 className="mt-2 text-4xl font-black tracking-tight text-stone-50 sm:text-5xl">
                Dang
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-stone-300">{dang.headline}</p>
              <Link
                href="/spots#dang"
                className="mt-5 w-fit rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-200 backdrop-blur transition-colors hover:bg-emerald-400/20"
              >
                Explore Dang →
              </Link>
            </div>
            <a
              href="https://commons.wikimedia.org/wiki/File:Saputara_lake_viewed_from_ropeway_(51697377388).jpg"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-3 right-3 rounded-md bg-black/40 px-2 py-1 text-[10px] text-stone-400 backdrop-blur-md transition-colors hover:text-emerald-300"
            >
              📷 Dinesh Valke · CC BY-SA
            </a>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dang.hero_spots.slice(0, 6).map((id) => {
              const spot = getSpotById(id);
              return spot ? <SpotCard key={id} spot={spot} /> : null;
            })}
          </div>
        </section>
      </FadeIn>

      {/* ── Narmada — gradient banner ────────────────────────── */}
      <FadeIn>
        <section className="border-t border-white/[0.06] py-14">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400/[0.12] via-emerald-400/[0.06] to-transparent p-7 ring-1 ring-white/10 sm:p-10">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-400/15 blur-[90px]" />
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-300">
              District 02
            </p>
            <h2 className="mt-2 text-4xl font-black tracking-tight text-stone-50 sm:text-5xl">
              Narmada
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-stone-300">{narmada.headline}</p>
            <Link
              href="/spots#narmada"
              className="mt-5 inline-block w-fit rounded-xl border border-amber-300/30 bg-amber-400/10 px-4 py-2 text-sm font-bold text-amber-200 backdrop-blur transition-colors hover:bg-amber-400/20"
            >
              Explore Narmada →
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {narmada.hero_spots.slice(0, 6).map((id) => {
              const spot = getSpotById(id);
              return spot ? <SpotCard key={id} spot={spot} /> : null;
            })}
          </div>
        </section>
      </FadeIn>

      {/* ── Honesty strip ────────────────────────────────────── */}
      <FadeIn>
        <section className="my-14 overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-emerald-400/[0.08] via-transparent to-amber-400/[0.05] p-8 sm:p-10">
          <h2 className="text-xl font-bold text-stone-100">
            Built different: every fact has a receipt.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-400">
            Each place carries a confidence level, a last-verified date and its sources — official
            portals first. When something is unverified, the page says so instead of guessing. That
            is the whole point of dandak.
          </p>
        </section>
      </FadeIn>
    </div>
  );
}
