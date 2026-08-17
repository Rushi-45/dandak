/**
 * One stop in a day's plan.
 *
 * Shared by the curated itineraries (server-rendered) and the trip planner
 * (client-rendered) so a generated plan looks identical to a hand-written one
 * rather than merely similar. No "use client" directive on purpose: this module
 * has no server-only imports, so it compiles into whichever tree imports it.
 */
import Image from "next/image";
import Link from "next/link";
import { categoryLabel } from "@/lib/format";
import { categoryMeta } from "@/lib/ui";

export interface StopCardData {
  order: number;
  name: string;
  category: string;
  durationMin: number;
  /** null when there is no record to open (a hub endpoint, for instance) */
  href: string | null;
  image: string | null;
  note?: string | null;
  /** honesty label, e.g. "likely dry in March" */
  flag?: string | null;
  /** how you arrive, e.g. "18 km · 30 min drive" */
  approach?: string | null;
}

function Body({ stop }: { stop: StopCardData }) {
  const meta = categoryMeta(stop.category);
  const hours = Math.round((stop.durationMin / 60) * 10) / 10;
  return (
    <>
      {stop.image ? (
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
          <Image
            src={stop.image}
            alt=""
            fill
            sizes="80px"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>
      ) : (
        <div
          className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-xl text-3xl ring-1 ${meta.chip}`}
        >
          <span aria-hidden>{meta.emoji}</span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="font-bold text-emerald-300">#{stop.order}</span>
          <span className={`rounded-full px-2 py-0.5 font-medium ring-1 ${meta.chip}`}>
            {meta.emoji} {categoryLabel(stop.category)}
          </span>
          <span className="text-stone-500">
            ~{hours >= 1 ? `${hours} hr` : `${stop.durationMin} min`}
          </span>
          {stop.approach && <span className="text-stone-600">· {stop.approach}</span>}
        </div>
        <h3 className="mt-1.5 font-serif text-lg font-black leading-snug text-stone-100 group-hover:text-emerald-200">
          {stop.name}
        </h3>
        {stop.flag && (
          <p className="mt-1.5 inline-block rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300 ring-1 ring-amber-400/25">
            {stop.flag}
          </p>
        )}
        {stop.note && (
          <p className="mt-1 text-xs leading-relaxed text-stone-400">→ {stop.note}</p>
        )}
      </div>
    </>
  );
}

const SHELL =
  "group flex gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 transition-all duration-300";

/**
 * `onSkip` renders a small "not this one" control. It sits as an absolutely
 * positioned SIBLING of the link, never inside it: a button inside an anchor is
 * invalid HTML and the click would navigate. Only the trip planner passes it;
 * the curated itineraries render this card server-side without it, which is why
 * this module can stay free of "use client".
 */
export function StopCard({ stop, onSkip }: { stop: StopCardData; onSkip?: () => void }) {
  const card = !stop.href ? (
    <div className={SHELL}>
      <Body stop={stop} />
    </div>
  ) : (
    <Link
      href={stop.href}
      className={`${SHELL} hover:-translate-y-0.5 hover:border-emerald-400/30 hover:bg-white/[0.05]`}
    >
      <Body stop={stop} />
    </Link>
  );

  if (!onSkip) return card;
  return (
    <div className="relative">
      {card}
      <button
        type="button"
        onClick={onSkip}
        aria-label={`Skip ${stop.name} and replan without it`}
        title="Skip this stop"
        className="no-print absolute right-2.5 top-2.5 rounded-full border border-white/[0.08] bg-[#0b1210]/85 px-2 py-0.5 text-[10px] font-semibold text-stone-500 transition-colors hover:border-red-400/40 hover:text-red-300"
      >
        Skip ×
      </button>
    </div>
  );
}
