import Image from "next/image";
import Link from "next/link";
import { FadeIn } from "@/components/fade-in";
import { FlipWords } from "@/components/flip-words";
import { SpotCard } from "@/components/spot-card";
import { TiltCard } from "@/components/tilt-card";
import { Meteors } from "@/components/meteors";
import { getAllSpots, getDistrict, getEvents, getItineraries, getSpotById, toCardData } from "@/lib/data";
import { formatMonths, MONTHS } from "@/lib/format";
import souImg from "@/public/images/statue-of-unity.jpg";
import lakeImg from "@/public/images/saputara-lake.jpg";
import giraImg from "@/public/images/gira-falls.jpg";
import damImg from "@/public/images/sardar-sarovar-dam.jpg";
import shabariImg from "@/public/images/spots/dang-shabari-dham.jpg";

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

const FEATURED_TRIPS = ["monsoon-waterfall-circuit", "sou-family-2-day", "dang-ramayana-trail"];

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

  // Events landing this month or next — again computed, not curated.
  const nextMonth = (month % 12) + 1;
  const upcoming = getEvents()
    .filter((e) => e.timing.typical_months.some((m) => m === month || m === nextMonth))
    .slice(0, 4);

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
          <section id="moods" className="scroll-mt-20 border-t border-white/[0.06] py-14">
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
                href="/itineraries/monsoon-waterfall-circuit"
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
                href="/itineraries/dang-ramayana-trail"
                className="group relative flex h-full flex-col justify-end overflow-hidden rounded-[2rem] ring-1 ring-amber-300/15 transition-colors hover:ring-amber-300/35"
              >
                <Image
                  src={shabariImg}
                  alt="The Shabari Dham temple at Subir under monsoon cloud"
                  placeholder="blur"
                  fill
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="object-cover object-[60%_center] transition-transform duration-[1.2s] ease-out group-hover:scale-110"
                />
                {/* amber wash keeps the legends card its own thing */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#150c02]/95 via-[#150c02]/55 to-amber-400/[0.12]" />
                <p
                  aria-hidden
                  className="pointer-events-none absolute -right-6 -top-10 select-none font-serif text-[11rem] font-black italic leading-none text-amber-100/[0.14] transition-colors duration-500 group-hover:text-amber-100/[0.22]"
                >
                  राम
                </p>
                <Meteors />
                <div className="relative p-6">
                  <span className="inline-block w-fit rounded-full bg-amber-400/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-100 ring-1 ring-amber-300/40 backdrop-blur">
                    Living geography
                  </span>
                  <h3 className="mt-3 font-serif text-3xl font-black italic text-stone-50">
                    Walk with legends
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-300">
                    Shabari&apos;s berries, Anjani&apos;s cave, Kabir&apos;s banyan — the epics
                    mapped onto living hills, told as tradition, not fact.
                  </p>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-amber-300/80">
                    Shabari Dham · Pampa · Anjan Kund · Kabirvad
                  </p>
                </div>
                <span className="absolute right-4 top-4 rounded-md bg-black/40 px-2 py-1 text-[9px] text-stone-400 backdrop-blur-md">
                  📷 સતિષચંદ્ર · CC BY-SA
                </span>
              </Link>
              </TiltCard>

              {/* Grand campus */}
              <TiltCard className="h-[440px]">
              <Link
                href="/itineraries/sou-family-2-day"
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
                  href="/districts/dang"
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
                return spot ? <SpotCard key={id} spot={toCardData(spot)} /> : null;
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
                href="/districts/narmada"
                className="mt-5 inline-block w-fit rounded-xl border border-amber-300/30 bg-amber-400/10 px-4 py-2 text-sm font-bold text-amber-200 backdrop-blur transition-colors hover:bg-amber-400/20"
              >
                Explore Narmada →
              </Link>
            </div>
            <div className="group/cards mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {narmada.hero_spots.slice(0, 6).map((id) => {
                const spot = getSpotById(id);
                return spot ? <SpotCard key={id} spot={toCardData(spot)} /> : null;
              })}
            </div>
          </section>
        </FadeIn>

        {/* == Featured trips ================================ */}
        <FadeIn>
          <section id="trips" className="scroll-mt-20 border-t border-white/[0.06] py-14">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-teal-300">
                  Go with a plan
                </p>
                <h2 className="mt-2 font-serif text-4xl font-black tracking-tight text-stone-100">
                  Trips, pre-routed<span className="text-teal-300">.</span>
                </h2>
              </div>
              <Link href="/itineraries" className="text-sm font-semibold text-teal-300 hover:text-teal-200">
                All {itineraries.length} trips →
              </Link>
            </div>
            <div className="group/cards mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURED_TRIPS.map((slug) => {
                const it = itineraries.find((i) => i.slug === slug);
                if (!it) return null;
                return (
                  <Link
                    key={slug}
                    href={`/itineraries/${it.slug}`}
                    className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-white/[0.07] bg-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-teal-400/30 hover:bg-white/[0.05] hover:shadow-[0_20px_50px_-20px_rgba(45,212,191,0.35)] group-hover/cards:[&:not(:hover)]:opacity-40 group-hover/cards:[&:not(:hover)]:blur-[1.5px]"
                  >
                    <p
                      aria-hidden
                      className="pointer-events-none absolute -right-3 -top-8 select-none font-serif text-[7rem] font-black leading-none text-stroke"
                    >
                      {it.duration_days}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="rounded-full bg-teal-400/10 px-2.5 py-1 font-bold text-teal-300 ring-1 ring-teal-400/25">
                        {it.duration_days} day{it.duration_days > 1 ? "s" : ""}
                      </span>
                      <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-stone-400">
                        {it.stops.length} stops
                      </span>
                    </div>
                    <h3 className="mt-4 font-serif text-xl font-black leading-snug text-stone-100 transition-colors group-hover:text-teal-200">
                      {it.title}
                    </h3>
                    <p className="mt-auto pt-4 text-[11px] font-semibold uppercase tracking-widest text-amber-300/80">
                      Best: {formatMonths(it.best_months)}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        </FadeIn>

        {/* == Coming up (events) ============================ */}
        {upcoming.length > 0 && (
          <FadeIn>
            <section className="border-t border-white/[0.06] py-14">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-rose-300">
                Coming up
              </p>
              <h2 className="mt-2 font-serif text-4xl font-black tracking-tight text-stone-100">
                On the calendar<span className="text-rose-300">.</span>
              </h2>
              <div className="mt-7 space-y-3">
                {upcoming.map((e) => (
                  <Link
                    key={e.id}
                    href="/events"
                    className="group flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-5 py-4 transition-all hover:-translate-y-0.5 hover:border-rose-400/25 hover:bg-white/[0.04]"
                  >
                    <span className="font-serif text-lg font-black text-rose-200">
                      {e.timing.typical_months.map((m) => MONTHS[m - 1]).join(" – ")}
                    </span>
                    <span className="font-serif text-lg font-black text-stone-100 group-hover:text-rose-100">
                      {e.name.en}
                    </span>
                    <span className="text-xs uppercase tracking-widest text-stone-500">
                      {e.type.replace("-", " ")} · {e.district}
                    </span>
                    <span className="ml-auto text-sm text-stone-500 transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </FadeIn>
        )}

        {/* == Finale ======================================== */}
        <FadeIn>
          <section className="relative mb-6 overflow-hidden rounded-[2.5rem] border border-white/[0.08] px-6 py-16 text-center sm:py-20">
            {/* aurora + meteors */}
            <div
              aria-hidden
              className="animate-aurora-a pointer-events-none absolute -left-24 -top-24 h-80 w-[36rem] rounded-full bg-emerald-500/15 blur-[80px]"
            />
            <div
              aria-hidden
              className="animate-aurora-b pointer-events-none absolute -bottom-28 -right-16 h-72 w-[30rem] rounded-full bg-amber-500/12 blur-[80px]"
            />
            <Meteors />

            <p className="relative text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-300">
              Every fact has a receipt
            </p>
            <h2 className="relative mx-auto mt-5 max-w-3xl font-serif text-4xl font-black italic leading-snug text-stone-100 sm:text-5xl">
              “The forest the epics wandered{" "}
              <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 bg-clip-text text-transparent">
                still stands — and still floods every monsoon.
              </span>”
            </h2>
            <p className="relative mx-auto mt-5 max-w-xl text-sm leading-relaxed text-stone-400">
              {spots.length} places, {verified} of them verified against official sources, with
              confidence levels and citations on every page. When something is unknown, dandak says
              so instead of guessing.
            </p>
            <div className="relative mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link href="/spots" className="group relative inline-flex overflow-hidden rounded-xl p-[1.5px]">
                <span
                  aria-hidden
                  className="absolute inset-[-1000%] animate-[spin_3.5s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#34d399_0%,#115e59_25%,#fbbf24_50%,#115e59_75%,#34d399_100%)] motion-reduce:animate-none"
                />
                <span className="relative inline-flex items-center rounded-[10.5px] bg-[#06110d] px-7 py-3 text-sm font-bold text-emerald-200 transition-colors group-hover:bg-[#0a1a14] group-hover:text-emerald-100">
                  Start exploring →
                </span>
              </Link>
              <a
                href="https://github.com/Rushi-45/dandak"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-stone-300 backdrop-blur transition-colors hover:border-amber-300/40 hover:text-amber-200"
              >
                The open dataset ↗
              </a>
            </div>
          </section>
        </FadeIn>
      </div>
    </div>
  );
}
