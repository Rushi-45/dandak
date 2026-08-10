"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FadeIn } from "@/components/fade-in";
import { StopCard } from "@/components/stop-card";
import { TripMap, type TripMapStop } from "@/components/trip-map";
import { categoryMeta } from "@/lib/ui";
import { MONTHS } from "@/lib/format";
import {
  decodePlan,
  encodePlan,
  planTrip,
  type PlanInput,
  type PlannerData,
  type PlanResult,
} from "@/lib/planner";

// ------------------------------------------------------------------ options

interface Option {
  key: string;
  label: string;
  group: string;
  emoji: string;
}

function buildOptions(data: PlannerData): Option[] {
  return [
    ...data.hubs.map((h) => ({ key: `h:${h.key}`, label: h.name, group: "Towns", emoji: "🏙" })),
    ...data.spots.map((s) => ({
      key: `s:${s.id}`,
      label: s.name,
      group: s.district === "dang" ? "Dang" : "Narmada",
      emoji: categoryMeta(s.category).emoji,
    })),
  ];
}

/**
 * Searchable picker. A native <select> over 126 options is unusable on desktop
 * and a plain text input cannot express "hub or spot", so this filters as you
 * type and commits a node key.
 */
function NodePicker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.key === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as HTMLElement)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const hits = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
    return hits.slice(0, 60);
  }, [query, options]);

  return (
    <div ref={boxRef} className="relative">
      <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
        {label}
      </label>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setQuery("");
        }}
        className="mt-1.5 flex w-full items-center justify-between gap-2 rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-3 text-left text-sm text-stone-200 transition-colors hover:border-emerald-400/40"
      >
        <span className="truncate">
          {selected ? `${selected.emoji} ${selected.label}` : "Choose a place"}
        </span>
        <span className="shrink-0 text-stone-600">▾</span>
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 max-h-72 w-full overflow-hidden rounded-xl border border-white/[0.1] bg-[#0b1210] shadow-2xl shadow-black/60">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search towns and places…"
            className="w-full border-b border-white/[0.08] bg-transparent px-3.5 py-2.5 text-sm text-stone-200 outline-none placeholder:text-stone-600"
          />
          <ul className="max-h-56 overflow-y-auto py-1">
            {matches.length === 0 && (
              <li className="px-3.5 py-3 text-xs text-stone-500">Nothing matches that.</li>
            )}
            {matches.map((o) => (
              <li key={o.key}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.key);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm transition-colors hover:bg-emerald-400/10 ${
                    o.key === value ? "text-emerald-300" : "text-stone-300"
                  }`}
                >
                  <span aria-hidden className="w-5 shrink-0">
                    {o.emoji}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  <span className="shrink-0 text-[10px] text-stone-600">{o.group}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------------- bits

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[38px] rounded-full px-3.5 text-[12px] font-bold transition-all ${
        active
          ? "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/40"
          : "border border-white/[0.08] bg-white/[0.03] text-stone-400 hover:border-emerald-400/25 hover:text-stone-200"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Today's month, without baking it into the prerendered HTML.
 *
 * /plan is static, so reading the clock during render would freeze the build
 * month into the page and mismatch on hydration. useSyncExternalStore renders 0
 * on the server, then swaps to the real month on the client — the supported way
 * to hold a value that legitimately differs between the two.
 */
const neverChanges = () => () => {};
const clientMonth = () => new Date().getMonth() + 1;
const serverMonth = () => 0;

function hhmm(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (!h) return `${m} min`;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

// ------------------------------------------------------------------ planner

export function TripPlanner({ data }: { data: PlannerData }) {
  const router = useRouter();
  const params = useSearchParams();
  const options = useMemo(() => buildOptions(data), [data]);

  const initial = useMemo(
    () => decodePlan(params.toString(), data),
    // read the URL once, on mount: after that this component owns the state
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [from, setFrom] = useState(initial.input?.from ?? "h:surat");
  const [to, setTo] = useState(initial.input?.to ?? "h:saputara");
  const [days, setDays] = useState(initial.input?.days ?? 2);
  const [monthChoice, setMonth] = useState<number | null>(initial.input?.month || null);
  const [must, setMust] = useState<string[]>(initial.input?.must ?? []);
  const [mustQuery, setMustQuery] = useState("");

  const today = useSyncExternalStore(neverChanges, clientMonth, serverMonth);
  const month = monthChoice ?? today;

  const input: PlanInput = useMemo(
    () => ({ from, to, days, month, must }),
    [from, to, days, month, must]
  );

  // the URL is the only persistence this feature has — keep it in step
  useEffect(() => {
    if (!month) return;
    router.replace(`/plan?${encodePlan(input)}`, { scroll: false });
  }, [input, month, router]);

  const plan: PlanResult | null = useMemo(
    () => (month ? planTrip(input, data) : null),
    [input, month, data]
  );

  const toggleMust = useCallback((id: string) => {
    setMust((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id].slice(0, 5)));
  }, []);

  const mustMatches = useMemo(() => {
    const q = mustQuery.trim().toLowerCase();
    if (!q) return [];
    return data.spots.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 6);
  }, [mustQuery, data]);

  const spotById = useMemo(
    () => new Map(data.spots.map((s) => [s.id, s])),
    [data]
  );

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <>
      {/* ------------------------------------------------------------ form */}
      <div className="rounded-3xl border border-white/[0.07] bg-white/[0.02] p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          <NodePicker label="Starting from" value={from} options={options} onChange={setFrom} />
          <button
            type="button"
            onClick={swap}
            aria-label="Swap start and finish"
            className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.09] bg-white/[0.04] text-stone-400 transition-colors hover:border-emerald-400/40 hover:text-emerald-300"
          >
            ⇄
          </button>
          <NodePicker label="Finishing at" value={to} options={options} onChange={setTo} />
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-[auto_1fr]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">Days</p>
            <div className="mt-2 flex gap-1.5">
              {[1, 2, 3, 4, 5].map((d) => (
                <Pill key={d} active={d === days} onClick={() => setDays(d)}>
                  {d}
                </Pill>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
              Travelling in
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {MONTHS.map((m, i) => (
                <Pill key={m} active={month === i + 1} onClick={() => setMonth(i + 1)}>
                  {m}
                </Pill>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
            Must visit <span className="normal-case tracking-normal text-stone-600">— optional, up to 5</span>
          </p>
          {must.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {must.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleMust(id)}
                  className="flex min-h-[34px] items-center gap-1.5 rounded-full bg-amber-400/10 px-3 text-[12px] font-semibold text-amber-300 ring-1 ring-amber-400/30 transition-colors hover:bg-amber-400/20"
                >
                  {spotById.get(id)?.name ?? id}
                  <span aria-hidden className="text-amber-400/70">✕</span>
                </button>
              ))}
            </div>
          )}
          <div className="relative mt-2">
            <input
              value={mustQuery}
              onChange={(e) => setMustQuery(e.target.value)}
              placeholder="Add a place you refuse to miss…"
              className="w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-3 text-sm text-stone-200 outline-none transition-colors placeholder:text-stone-600 focus:border-emerald-400/40"
            />
            {mustMatches.length > 0 && (
              <ul className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-white/[0.1] bg-[#0b1210] py-1 shadow-2xl shadow-black/60">
                {mustMatches.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => {
                        toggleMust(s.id);
                        setMustQuery("");
                      }}
                      className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-stone-300 transition-colors hover:bg-emerald-400/10"
                    >
                      <span aria-hidden>{categoryMeta(s.category).emoji}</span>
                      <span className="min-w-0 flex-1 truncate">{s.name}</span>
                      {must.includes(s.id) && <span className="text-[10px] text-emerald-400">added</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {initial.dropped.length > 0 && (
        <p className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-4 text-sm text-amber-200">
          This link asked for {initial.dropped.length} place
          {initial.dropped.length > 1 ? "s" : ""} that no longer exist in the dataset (
          {initial.dropped.join(", ")}). Everything else was kept.
        </p>
      )}

      {plan && <PlanView plan={plan} days={days} month={month} />}
    </>
  );
}

// ------------------------------------------------------------------ result

function PlanView({ plan, days, month }: { plan: PlanResult; days: number; month: number }) {
  const stops = plan.days.flatMap((d) => d.stops);

  const mapStops: TripMapStop[] = useMemo(() => {
    const list: TripMapStop[] = stops.map((s) => ({
      id: s.spot.id,
      district: s.spot.district,
      slug: s.spot.slug,
      name: s.spot.name,
      lat: s.spot.lat,
      lng: s.spot.lng,
      day: s.day,
      order: s.order,
      emoji: categoryMeta(s.spot.category).emoji,
      approx: s.spot.precision !== "exact",
      kind: "stop" as const,
    }));
    // Endpoints bracket the route: order 0 sorts before every stop, 999 after.
    // Skip one that lands on top of a real stop — the Statue of Unity shares the
    // Ekta Nagar hub's coordinates exactly, and Saputara Lake is 1 km from the
    // Saputara hub, so drawing both just buries the numbered marker.
    const clashes = (lat: number, lng: number) =>
      list.some((s) => Math.hypot((s.lat - lat) * 111, (s.lng - lng) * 104) < 1.2);

    if (!clashes(plan.from.lat, plan.from.lng)) {
      list.unshift({
        id: plan.from.key,
        name: plan.from.name,
        lat: plan.from.lat,
        lng: plan.from.lng,
        day: 1,
        order: 0,
        emoji: "🚩",
        approx: false,
        kind: "endpoint",
        note: "Trip starts here",
      });
    }
    if (!plan.isLoop && !clashes(plan.to.lat, plan.to.lng)) {
      list.push({
        id: `${plan.to.key}-end`,
        name: plan.to.name,
        lat: plan.to.lat,
        lng: plan.to.lng,
        day: plan.days.length || 1,
        order: 999,
        emoji: "🏁",
        approx: false,
        kind: "endpoint",
        note: "Trip ends here",
      });
    }
    return list;
  }, [plan, stops]);

  const monthName = month ? MONTHS[month - 1] : "";

  if (!stops.length) {
    return (
      <div className="mt-8 rounded-3xl border border-white/[0.07] bg-white/[0.02] p-8 text-center">
        <p className="font-serif text-xl font-black italic text-stone-200">
          Nothing fits between those two points.
        </p>
        <p className="mt-2 text-sm text-stone-500">
          {plan.excludedBySeason > 0
            ? `${plan.excludedBySeason} places are shut in ${monthName}. Try more days, a wider pair of endpoints, or another month.`
            : "Try more days or endpoints further apart — everything nearby is already on the way."}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10">
      {/* headline numbers */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-emerald-400/10 px-3 py-1 font-bold text-emerald-300 ring-1 ring-emerald-400/25">
          {plan.days.length} day{plan.days.length > 1 ? "s" : ""} · {stops.length} stops
        </span>
        <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-stone-400">
          ~{Math.round(plan.totalKm)} km
        </span>
        <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-stone-400">
          {hhmm(plan.totalDriveMin)} driving
        </span>
        <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-stone-400">
          {hhmm(plan.totalVisitMin)} at places
        </span>
      </div>

      {plan.warnings.length > 0 && (
        <ul className="mt-4 space-y-2">
          {plan.warnings.map((w) => (
            <li
              key={w}
              className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-4 text-sm leading-relaxed text-amber-200"
            >
              {w}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6">
        <TripMap stops={mapStops} durationDays={days} />
      </div>

      {plan.days.map((d) => (
        <section key={d.day} className="mt-10">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-5xl font-black text-stroke">
              {String(d.day).padStart(2, "0")}
            </span>
            <h2 className="font-serif text-2xl font-black italic text-stone-100">Day {d.day}</h2>
          </div>
          <p className="mt-2 text-xs text-stone-500">
            {d.startNode.name} → {d.endNode.name} · ~{Math.round(d.driveKm)} km ·{" "}
            {hhmm(d.driveMin)} driving · {hhmm(d.visitMin)} at places
          </p>

          {d.transitLeg && (
            <p className="mt-3 rounded-2xl border border-sky-400/15 bg-sky-400/[0.05] p-4 text-sm leading-relaxed text-stone-300">
              🛣 Long transfer: {d.transitLeg.fromName} to {d.transitLeg.toName}, about{" "}
              {Math.round(d.transitLeg.km)} km and {hhmm(d.transitLeg.min)}. Nothing worth
              stopping for in between.
            </p>
          )}

          <div className="mt-5 space-y-3">
            {d.stops.map((s, idx) => (
              <FadeIn key={s.spot.id} delay={idx * 0.05}>
                <StopCard
                  stop={{
                    order: s.order,
                    name: s.spot.name,
                    category: s.spot.category,
                    durationMin: s.spot.durationMin,
                    href: `/spots/${s.spot.district}/${s.spot.slug}`,
                    image: s.spot.hasPhoto ? `/images/spots/${s.spot.id}.jpg` : null,
                    flag: s.seasonNote,
                    approach:
                      idx === 0 && s.driveKmFromPrev === 0
                        ? null
                        : `${Math.round(s.driveKmFromPrev)} km${
                            s.distanceSource === "estimated" ? " est." : ""
                          } · ${hhmm(s.driveMinFromPrev)}`,
                  }}
                />
              </FadeIn>
            ))}
          </div>

          {d.stay && (
            <p className="mt-4 rounded-2xl border border-white/[0.07] bg-gradient-to-br from-emerald-400/[0.06] to-transparent p-4 text-sm text-stone-400">
              🛏 <strong className="font-semibold text-stone-200">Sleep near here:</strong>{" "}
              {d.stay.stay.name}
              <span className="text-stone-500">
                {" "}
                ({d.stay.stay.type.replace(/-/g, " ")}, {d.stay.stay.priceBand})
              </span>
              {d.stay.stay.bookingUrl && (
                <>
                  {" · "}
                  <a
                    href={d.stay.stay.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-emerald-300 hover:text-emerald-200"
                  >
                    booking ↗
                  </a>
                </>
              )}
            </p>
          )}
        </section>
      ))}

      {/* honesty footer */}
      <section className="mt-10 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 text-sm text-stone-400">
        <p>
          <strong className="font-semibold text-stone-200">How this was built:</strong> stops are
          chosen for least detour from your route, then ordered to cut driving. Distances come from
          the dataset&rsquo;s own road figures where we have them ({plan.curatedLegs} leg
          {plan.curatedLegs === 1 ? "" : "s"} here) and are estimated from straight-line distance
          otherwise ({plan.estimatedLegs}) — no routing service is involved, so treat the times as
          planning numbers, not promises.
        </p>
        {plan.excludedBySeason > 0 && (
          <p className="mt-2 text-xs text-stone-500">
            {plan.excludedBySeason} place{plan.excludedBySeason === 1 ? " was" : "s were"} left out
            because {monthName} is the wrong month for {plan.excludedBySeason === 1 ? "it" : "them"}
            {plan.excluded.length > 0 && (
              <>
                {" "}
                — including {plan.excluded.slice(0, 3).map((e) => e.name).join(", ")}
              </>
            )}
            .
          </p>
        )}
        <p className="mt-2 text-xs text-stone-500">
          Every stop links to its full record — timings, fees, seasons, safety and sources. Copy
          the address bar to share this exact plan.
        </p>
      </section>
    </div>
  );
}
