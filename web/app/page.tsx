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
  const waterfalls = spots.filter((s) => s.category === "waterfall").length;

  const districts = [
    { d: dang, href: "/spots#dang", accent: "from-emerald-400/70" },
    { d: narmada, href: "/spots#narmada", accent: "from-amber-400/70" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative py-20 sm:py-28">
        {/* glow blobs */}
        <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-emerald-500/15 blur-[100px]" />
        <div className="pointer-events-none absolute left-1/3 top-32 h-56 w-56 rounded-full bg-amber-500/10 blur-[100px]" />

        <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1 text-xs font-medium tracking-wide text-emerald-300">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Dang &amp; Narmada · Gujarat · dataset v1.0
        </p>

        <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[1.05] tracking-tight sm:text-7xl">
          <span className="text-stone-100">The forest belt</span>
          <br />
          <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 bg-clip-text text-transparent">
            of the epics.
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-stone-400">
          Waterfalls that only exist in monsoon. A statue taller than imagination. Meadow villages,
          leopard forests and living Ramayana geography — {spots.length} places documented with
          timings, fees, seasons and{" "}
          <span className="text-emerald-300">sources you can actually trust</span>.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Link
            href="/spots"
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-bold text-emerald-950 shadow-[0_10px_40px_-10px_rgba(16,185,129,0.6)] transition-all hover:shadow-[0_10px_50px_-8px_rgba(16,185,129,0.8)]"
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
        <dl className="mt-14 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Places", value: spots.length },
            { label: "Web-verified", value: verified },
            { label: "Waterfalls", value: waterfalls },
            { label: "Itineraries", value: itineraries.length },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 text-center backdrop-blur"
            >
              <dd className="bg-gradient-to-b from-emerald-200 to-emerald-400 bg-clip-text text-3xl font-black text-transparent">
                {s.value}
              </dd>
              <dt className="mt-1 text-[11px] uppercase tracking-widest text-stone-500">{s.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Districts ────────────────────────────────────────── */}
      {districts.map(({ d, href, accent }) => (
        <FadeIn key={d.id}>
          <section className="relative border-t border-white/[0.06] py-14">
            <div className={`absolute left-0 top-0 h-px w-40 bg-gradient-to-r ${accent} to-transparent`} />
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <h2 className="text-3xl font-extrabold capitalize tracking-tight text-stone-100">
                  {d.name.en}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-400">{d.headline}</p>
              </div>
              <Link
                href={href}
                className="shrink-0 text-sm font-semibold text-emerald-300 transition-colors hover:text-emerald-200"
              >
                See all →
              </Link>
            </div>
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {d.hero_spots.slice(0, 6).map((id) => {
                const spot = getSpotById(id);
                return spot ? <SpotCard key={id} spot={spot} /> : null;
              })}
            </div>
          </section>
        </FadeIn>
      ))}

      {/* ── Honesty strip ────────────────────────────────────── */}
      <FadeIn>
        <section className="my-14 overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-emerald-400/[0.08] via-transparent to-amber-400/[0.05] p-8 sm:p-10">
          <h2 className="text-xl font-bold text-stone-100">Built different: every fact has a receipt.</h2>
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
