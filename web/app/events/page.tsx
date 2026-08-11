import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FadeIn } from "@/components/fade-in";
import { MONTHS } from "@/lib/format";
import { getEvents, getSpotById, getSpotImagePath, type EventRec } from "@/lib/data";

export const metadata: Metadata = {
  title: "Events & Seasons",
  description:
    "Dang Darbar, the Devmogra fair, Saputara's monsoon festival and the season windows that shape a Dang–Narmada trip.",
  alternates: { canonical: "/events" },
};

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

/** Events without an imaged spot borrow a thematically-right neighbour. */
const IMAGE_FALLBACK: Record<string, string> = {
  "saputara-winter-peak": "dang-saputara-lake",
  "shravan-narmada-temples": "narmada-shoolpaneshwar-wls",
};

function eventImageFor(e: EventRec): string | null {
  const direct = e.spot_id ? getSpotImagePath(e.spot_id) : null;
  if (direct) return direct;
  const fallback = IMAGE_FALLBACK[e.id];
  return fallback ? getSpotImagePath(fallback) : null;
}

export default function EventsPage() {
  const events = getEvents();

  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-300">
        The calendar that matters
      </p>
      <h1 className="mt-2 font-serif text-5xl font-black tracking-tight text-stone-100">
        Events &amp;{" "}
        <span className="bg-gradient-to-r from-amber-200 to-rose-200 bg-clip-text italic text-transparent">
          seasons.
        </span>
      </h1>
      <p className="mt-3 max-w-xl text-sm text-stone-500">
        Fairs measured in lakhs of pilgrims, a monsoon festival on a hill-station lake, and the
        peak-season windows worth planning around — or around which to plan your escape.
      </p>

      <div className="mt-12 space-y-5">
        {events.map((e, i) => {
          const spot = e.spot_id ? getSpotById(e.spot_id) : undefined;
          const img = eventImageFor(e);
          return (
            <FadeIn key={e.id} delay={i * 0.03}>
              <article className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.07] bg-white/[0.02] p-6 sm:p-7">
                {img ? (
                  <div className="absolute inset-y-0 right-0 w-36 sm:w-72">
                    <Image
                      src={img}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 288px, 144px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0c100e] via-[#0c100e]/60 to-[#0c100e]/10" />
                  </div>
                ) : (
                  <p
                    aria-hidden
                    className="pointer-events-none absolute -right-2 -top-6 select-none font-serif text-[8rem] font-black italic leading-none text-amber-200/[0.06]"
                  >
                    ઢોલ
                  </p>
                )}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-amber-400/[0.07] blur-2xl"
                />
                <div className={img ? "relative z-10 pr-24 sm:pr-56" : "relative z-10"}>
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className={`rounded-full px-2.5 py-1 font-bold uppercase tracking-wide ring-1 ${TYPE_STYLE[e.type]}`}>
                    {e.type.replace("-", " ")}
                  </span>
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-semibold text-stone-300">
                    {e.timing.typical_months.map((m) => MONTHS[m - 1]).join(" – ")}
                  </span>
                  <span className="text-stone-500">{SCALE_LABEL[e.scale]}</span>
                  <span className="ml-auto capitalize text-stone-500">{e.district}</span>
                </div>

                <h2 className="mt-3 font-serif text-2xl font-black text-stone-100 sm:text-3xl">
                  {e.name.en}
                </h2>
                <p className="mt-1 text-xs text-stone-500">{e.timing.recurrence}</p>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-400">
                  {e.description}
                </p>

                {e.crowd_impact && (
                  <p className="mt-3 rounded-xl border border-rose-400/10 bg-rose-400/[0.05] px-3.5 py-2.5 text-xs leading-relaxed text-stone-300">
                    <strong className="font-bold text-rose-300">Crowd reality · </strong>
                    {e.crowd_impact}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                  {spot && (
                    <Link
                      href={`/spots/${spot.district}/${spot.slug}`}
                      className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 font-bold text-emerald-200 transition-colors hover:bg-emerald-400/20"
                    >
                      📍 {spot.name.en} →
                    </Link>
                  )}
                  {!spot && e.place && <span className="text-stone-500">📍 {e.place}</span>}
                  {e.tips[0] && <span className="text-stone-500">💡 {e.tips[0]}</span>}
                </div>
                </div>
              </article>
            </FadeIn>
          );
        })}
      </div>
    </div>
  );
}
