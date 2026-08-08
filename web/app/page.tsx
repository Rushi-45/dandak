import Image from "next/image";
import Link from "next/link";
import { FadeIn } from "@/components/fade-in";
import { FlipWords } from "@/components/flip-words";
import { SpotCard } from "@/components/spot-card";
import { TiltCard } from "@/components/tilt-card";
import { Meteors } from "@/components/meteors";
import { getAllSpots, getDistrict, getItineraries, getSpotById } from "@/lib/data";
import souImg from "@/public/images/statue-of-unity.jpg";
import lakeImg from "@/public/images/saputara-lake.jpg";
import giraImg from "@/public/images/gira-falls.jpg";
import damImg from "@/public/images/sardar-sarovar-dam.jpg";

const TICKER = [
  "Monsoon waterfalls",
  "182 m of Sardar",
  "Leopard country",
  "Ramayana geography",
  "Hill-station sunsets",
  "Tribal heartland",
  "Forest campsites",
  "Dam in full release",
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function Home() {
  const spots = getAllSpots();
  const dang = getDistrict("dang");
  const narmada = getDistrict("narmada");
  const itineraries = getItineraries();
  const verified = spots.filter((s) => s.provenance.last_verified).length;
  const waterfalls = spots.filter((s) => s.category === "waterfall").length;

  // Computed from the dataset, not vibes: what is actually in season right now.
  const month = new Date().getMonth() + 1;
  const inSeason = spots
    .filter((s) => s.seasonality.best_months.includes(month))
    .sort((a, b) => {
      const pa = a.tags.includes("popular") ? 0 : 1;
      const pb = b.tags.includes("popular") ? 0 : 1;
      return pa - pb || a.name.en.localeCompare(b.name.en);
    })
    .slice(0, 10);

  return (
    <div>
      {/* == Cinematic hero ================================== */}
      <section className="relative left-1/2 right-1/2 -mx-[50vw] flex min-h-[92svh] w-screen items-end overflow-hidden">
        <Image
          src={souImg}
          alt="The Statue of Unity towering over the visitor walkway at Ekta Nagar"
          priority
          placeholder="blur"
          fill
          sizes="100vw"
          className="animate-kenburns object-cover object-top"
        />
        {/* scrims */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080c0b] via-[#080c0b]/45 to-[#080c0b]/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080c0b]/70 via-transparent to-transparent" />

        {/* floating fact badge */}
        <div className="absolute right-5 top-20 hidden rounded-2xl border border-white/15 bg-black/35 px-4 py-3 backdrop-blur-md sm:block">
          <p className="text-[10px] uppercase tracking-[0.25em] text-stone-400">
            World&apos;s tallest statue
          </p>
          <p className="font-serif text-3xl font-black text-stone-50">
            182 <span className="text-lg italic text-emerald-300">metres</span>
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-4 pb-20 pt-40">
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-200 backdrop-blur">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Dang &amp; Narmada · Gujarat
          </p>

          <h1 className="mt-6 max-w-4xl font-serif text-6xl font-black leading-[0.95] tracking-tight text-stone-50 sm:text-8xl">
            The forest belt{" "}
            <span className="block bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 bg-clip-text italic text-transparent">
              of the epics.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone-300">
            This is the land of{" "}
            <FlipWords
              words={[
                "monsoon waterfalls",
                "leopard forests",
                "Ramayana trails",
                "meadow villages",
                "one colossal statue",
              ]}
              className="font-serif text-xl font-black italic text-emerald-300"
            />
            <br />— every place documented with{" "}
            <span className="text-amber-300">receipts</span>.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/spots" className="group relative inline-flex overflow-hidden rounded-xl p-[1.5px]">
              <span
                aria-hidden
                className="absolute inset-[-1000%] animate-[spin_3.5s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#34d399_0%,#115e59_25%,#fbbf24_50%,#115e59_75%,#34d399_100%)] motion-reduce:animate-none"
              />
              <span className="relative inline-flex items-center rounded-[10.5px] bg-[#06110d] px-6 py-3 text-sm font-bold text-emerald-200 transition-colors group-hover:bg-[#0a1a14] group-hover:text-emerald-100">
                Explore {spots.length} places →
              </span>
            </Link>
            <Link
              href="/spots#dang"
              className="rounded-xl border border-white/20 bg-white/[0.06] px-6 py-3 text-sm font-semibold text-stone-200 backdrop-blur transition-colors hover:border-emerald-300/50 hover:text-emerald-200"
            >
              Start with Saputara
            </Link>
          </div>

          {/* photo credit */}
          <a
            href="https://commons.wikimedia.org/wiki/File:Statue_of_Unity.jpg"
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-5 right-4 rounded-md bg-black/35 px-2 py-1 text-[10px] text-stone-400 backdrop-blur-md transition-colors hover:text-emerald-300"
          >
            📷 Vijay Barot · CC BY-SA
          </a>
        </div>
      </section>

      {/* == Marquee ticker ================================== */}
      <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden border-y border-white/[0.06] bg-white/[0.02] py-3">
        <div className="animate-marquee flex w-max gap-8 whitespace-nowrap">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span
              key={i}
              className="flex items-center gap-8 text-[11px] font-semibold uppercase tracking-[0.3em] text-stone-500"
            >
              {t} <span className="text-amber-400/70">✦</span>
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4">
        {/* == Stats band ==================================== */}
        <section className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 py-14 text-center">
          {[
            { label: "places documented", value: spots.length },
            { label: "web-verified", value: verified },
            { label: "waterfalls", value: waterfalls },
            { label: "ready itineraries", value: itineraries.length },
          ].map((s) => (
            <div key={s.label}>
              <p className="bg-gradient-to-b from-stone-100 to-stone-400 bg-clip-text font-serif text-6xl font-black text-transparent">
                {s.value}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-stone-500">
                {s.label}
              </p>
            </div>
          ))}
        </section>

        {/* == In season right now =========================== */}
        {inSeason.length > 0 && (
          <FadeIn>
            <section className="border-t border-white/[0.06] py-14">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-300">
                    In season right now
                  </p>
                  <h2 className="mt-2 font-serif text-4xl font-black tracking-tight text-stone-100">
                    {MONTH_NAMES[month - 1]}
                    <span className="text-amber-300">.</span>
                  </h2>
                  <p className="mt-2 text-sm text-stone-500">
                    Computed from every place&apos;s <code className="text-emerald-300/80">best_months</code> — the
                    dataset decides, not vibes.
                  </p>
                </div>
                <Link href="/spots" className="text-sm font-semibold text-emerald-300 hover:text-emerald-200">
                  All spots →
                </Link>
              </div>
              <div className="group relative left-1/2 right-1/2 -mx-[50vw] mt-7 w-screen overflow-hidden">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#080c0b] to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#080c0b] to-transparent" />
                <div className="animate-marquee flex w-max gap-4 px-4 pb-2 [animation-duration:55s] group-hover:[animation-play-state:paused] motion-reduce:animate-none">
                  {[...inSeason, ...inSeason].map((spot, i) => (
                    <div key={`${spot.id}-${i}`} className="w-[300px] shrink-0">
                      <SpotCard spot={spot} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </FadeIn>
        )}

        {/* == Mood collections ============================== */}
        <FadeIn>
          <section className="border-t border-white/[0.06] py-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-300">
              Pick a mood
            </p>
            <h2 className="mt-2 font-serif text-4xl font-black tracking-tight text-stone-100">
              Three ways in<span className="text-emerald-300">.</span>
            </h2>

            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {/* Monsoon */}
              <TiltCard className="h-[440px]">
              <Link
                href="/spots#dang"
                className="group relative block h-full overflow-hidden rounded-[2rem] ring-1 ring-white/10"
              >
                <Image
                  src={giraImg}
                  alt="Gira Falls in full monsoon flow"
                  placeholder="blur"
                  fill
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#02120c]/95 via-[#02120c]/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <span className="rounded-full bg-cyan-400/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-200 ring-1 ring-cyan-300/30 backdrop-blur">
                    Jul – Sep
                  </span>
                  <h3 className="mt-3 font-serif text-3xl font-black italic text-stone-50">
                    Chase the monsoon
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-300">
                    Gira, Girmal, Zarwani, Ninai — {waterfalls} waterfalls at full throat, and the
                    forests running neon green.
                  </p>
                </div>
                <span className="absolute bottom-4 right-4 rounded-md bg-black/35 px-2 py-1 text-[9px] text-stone-500 backdrop-blur-md">
                  📷 JB Kalola · CC BY-SA
                </span>
              </Link>
              </TiltCard>

              {/* Legends — editorial card */}
              <TiltCard className="h-[440px]">
              <Link
                href="/spots#dang"
                className="group relative flex h-full flex-col justify-end overflow-hidden rounded-[2rem] bg-gradient-to-br from-amber-400/[0.14] via-orange-400/[0.06] to-transparent p-6 ring-1 ring-amber-300/15 transition-colors hover:ring-amber-300/35"
              >
                <p
                  aria-hidden
                  className="pointer-events-none absolute -right-6 -top-10 select-none font-serif text-[11rem] font-black italic leading-none text-amber-200/[0.07] transition-colors duration-500 group-hover:text-amber-200/[0.12]"
                >
                  राम
                </p>
                <Meteors />
                <span className="w-fit rounded-full bg-amber-400/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-200 ring-1 ring-amber-300/30">
                  Living geography
                </span>
                <h3 className="mt-3 font-serif text-3xl font-black italic text-stone-50">
                  Walk with legends
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-300">
                  Shabari&apos;s berries, Anjani&apos;s cave, Kabir&apos;s banyan — the epics mapped
                  onto living hills, told as tradition, not fact.
                </p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-amber-300/80">
                  Shabari Dham · Pampa · Anjan Kund · Kabirvad
                </p>
              </Link>
              </TiltCard>

              {/* Grand campus */}
              <TiltCard className="h-[440px]">
              <Link
                href="/spots#narmada"
                className="group relative block h-full overflow-hidden rounded-[2rem] ring-1 ring-white/10"
              >
                <Image
                  src={damImg}
                  alt="The Sardar Sarovar dam wall"
                  placeholder="blur"
                  fill
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a02]/95 via-[#0c0a02]/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <span className="rounded-full bg-indigo-400/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-indigo-200 ring-1 ring-indigo-300/30 backdrop-blur">
                    Engineered wonder
                  </span>
                  <h3 className="mt-3 font-serif text-3xl font-black italic text-stone-50">
                    The grand campus
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-300">
                    The statue, the dam, a jungle safari and a glow garden — India&apos;s biggest
                    tourism build, one ticket portal.
                  </p>
                </div>
                <span className="absolute bottom-4 right-4 rounded-md bg-black/35 px-2 py-1 text-[9px] text-stone-500 backdrop-blur-md">
                  📷 Vijayakumarblathur · CC BY-SA
                </span>
              </Link>
              </TiltCard>
            </div>
          </section>
        </FadeIn>

        {/* == District 01 — Dang ============================ */}
        <FadeIn>
          <section className="relative border-t border-white/[0.06] py-14">
            <div className="relative overflow-hidden rounded-[2rem] ring-1 ring-white/10">
              <Image
                src={lakeImg}
                alt="Saputara lake and town seen from the Pushpak ropeway"
                placeholder="blur"
                className="h-80 w-full object-cover sm:h-96"
                sizes="(min-width: 1152px) 1104px, 100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#080c0b]/95 via-[#080c0b]/55 to-[#080c0b]/10" />
              <p
                aria-hidden
                className="pointer-events-none absolute -right-4 -top-8 select-none font-serif text-[12rem] font-black leading-none text-stroke"
              >
                01
              </p>
              <div className="absolute inset-0 flex flex-col justify-center p-7 sm:p-12">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-300">
                  District 01 · hill country
                </p>
                <h2 className="mt-2 font-serif text-5xl font-black italic tracking-tight text-stone-50 sm:text-6xl">
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
                className="absolute bottom-3 right-3 rounded-md bg-black/35 px-2 py-1 text-[10px] text-stone-400 backdrop-blur-md transition-colors hover:text-emerald-300"
              >
                📷 Dinesh Valke · CC BY-SA
              </a>
            </div>
            <div className="group/cards mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {dang.hero_spots.slice(0, 6).map((id) => {
                const spot = getSpotById(id);
                return spot ? <SpotCard key={id} spot={spot} /> : null;
              })}
            </div>
          </section>
        </FadeIn>

        {/* == District 02 — Narmada ========================= */}
        <FadeIn>
          <section className="relative border-t border-white/[0.06] py-14">
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-amber-400/[0.13] via-emerald-400/[0.05] to-transparent p-7 ring-1 ring-white/10 sm:p-12">
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-400/15 blur-[90px]" />
              <p
                aria-hidden
                className="pointer-events-none absolute -right-4 -top-8 select-none font-serif text-[12rem] font-black leading-none text-stroke"
              >
                02
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-300">
                District 02 · the river&apos;s realm
              </p>
              <h2 className="mt-2 font-serif text-5xl font-black italic tracking-tight text-stone-50 sm:text-6xl">
                Narmada
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-stone-300">
                {narmada.headline}
              </p>
              <Link
                href="/spots#narmada"
                className="mt-5 inline-block w-fit rounded-xl border border-amber-300/30 bg-amber-400/10 px-4 py-2 text-sm font-bold text-amber-200 backdrop-blur transition-colors hover:bg-amber-400/20"
              >
                Explore Narmada →
              </Link>
            </div>
            <div className="group/cards mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {narmada.hero_spots.slice(0, 6).map((id) => {
                const spot = getSpotById(id);
                return spot ? <SpotCard key={id} spot={spot} /> : null;
              })}
            </div>
          </section>
        </FadeIn>

        {/* == Editorial pull-quote ========================== */}
        <FadeIn>
          <section className="border-t border-white/[0.06] py-20 text-center">
            <div className="mx-auto h-10 w-px bg-gradient-to-b from-transparent to-amber-300/50" />
            <blockquote className="mx-auto mt-6 max-w-3xl font-serif text-3xl font-black italic leading-snug text-stone-200 sm:text-4xl">
              “Dandakaranya — the forest the epics wandered through.{" "}
              <span className="bg-gradient-to-r from-emerald-300 to-amber-200 bg-clip-text text-transparent">
                It still stands, and it still floods every monsoon.
              </span>”
            </blockquote>
            <div className="mx-auto mt-6 h-10 w-px bg-gradient-to-t from-transparent to-emerald-300/50" />
          </section>
        </FadeIn>

        {/* == Honesty strip ================================= */}
        <FadeIn>
          <section className="relative mb-4 overflow-hidden rounded-[2rem] border border-white/[0.07] p-8 sm:p-10">
            {/* aurora */}
            <div
              aria-hidden
              className="animate-aurora-a pointer-events-none absolute -left-20 -top-24 h-80 w-[36rem] rounded-full bg-emerald-500/15 blur-[80px]"
            />
            <div
              aria-hidden
              className="animate-aurora-b pointer-events-none absolute -bottom-28 -right-16 h-72 w-[30rem] rounded-full bg-amber-500/12 blur-[80px]"
            />
            <div
              aria-hidden
              className="animate-aurora-a pointer-events-none absolute left-1/3 top-1/2 h-40 w-72 rounded-full bg-cyan-500/10 blur-[70px]"
            />
            <h2 className="relative font-serif text-2xl font-black text-stone-100">
              Built different: every fact has a receipt<span className="text-emerald-300">.</span>
            </h2>
            <p className="relative mt-3 max-w-2xl text-sm leading-relaxed text-stone-400">
              Each place carries a confidence level, a last-verified date and its sources — official
              portals first. When something is unverified, the page says so instead of guessing.
              That is the whole point of dandak.
            </p>
          </section>
        </FadeIn>
      </div>
    </div>
  );
}
