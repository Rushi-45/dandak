"use client";

import {
  Fragment,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useSearchParams } from "next/navigation";
import { FadeIn } from "@/components/fade-in";
import { StopCard } from "@/components/stop-card";
import { DAY_STROKE, TripMap, type DayRoutes, type TripMapStop } from "@/components/trip-map";
import { buildGpx } from "@/lib/gpx";
import { fetchRoadRoute, type RoadLeg } from "@/lib/road-route";
import Link from "next/link";
import { categoryMeta, PRICE_BAND_LABEL, stayTypeMeta } from "@/lib/ui";
import { MONTHS } from "@/lib/format";
import {
  decodePlan,
  encodePlan,
  planTrip,
  type PlanInput,
  type PlannerData,
  type PlanResult,
  closureWarnings,
  type ClosureWarning,
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
 * The plan already lives in the URL, so sharing it only ever needed one button.
 * Telling people to copy the address bar was asking them to do the work by hand.
 *
 * navigator.clipboard is unavailable on insecure origins and can be refused, so
 * the failure path selects nothing and simply says so rather than pretending.
 */
function CopyPlanLink() {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setState("done");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 2500);
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-full border border-white/[0.09] bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-stone-300 transition-colors hover:border-emerald-400/40 hover:text-emerald-300"
    >
      {state === "done" ? "Link copied" : state === "failed" ? "Copy failed, use the address bar" : "Copy link to this plan"}
    </button>
  );
}

/**
 * Today's month, without baking it into the prerendered HTML.
 *
 * /plan is static, so reading the clock during render would freeze the build
 * month into the page and mismatch on hydration. useSyncExternalStore renders 0
 * on the server, then swaps to the real month on the client, the supported way
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
  const params = useSearchParams();
  const options = useMemo(() => buildOptions(data), [data]);

  const initial = useMemo(
    () => decodePlan(params.toString(), data),
    // read the URL once, on mount: after that this component owns the state
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialParams = useMemo(() => new URLSearchParams(params.toString()), []);

  const [from, setFrom] = useState(initial.input?.from ?? "h:surat");
  const [to, setTo] = useState(initial.input?.to ?? "h:saputara");
  const [days, setDays] = useState(initial.input?.days ?? 2);
  const [monthChoice, setMonth] = useState<number | null>(initial.input?.month || null);
  /**
   * Optional start date, "YYYY-MM-DD" or "". Trip metadata like the bed choice,
   * not planner input: the algorithm plans by month and stays pure, the date
   * only unlocks day-of-week closure warnings (18 spots close on Mondays).
   * Rides the URL as on=, the same pattern as bed/beds.
   */
  const [startDate, setStartDate] = useState<string>(() => {
    const v = initialParams.get("on") ?? "";
    return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "";
  });
  const [must, setMust] = useState<string[]>(initial.input?.must ?? []);
  const [avoid, setAvoid] = useState<string[]>(initial.input?.avoid ?? []);
  const [mustQuery, setMustQuery] = useState("");

  /**
   * Beds are opt-in. Off, they are a suggestion under each day; on, the chosen
   * one joins the route, a marker on the map, a waypoint the road line runs
   * through, and the point the next morning starts from. Kept out of PlanInput
   * so the algorithm stays pure and deterministic; these only shape what is
   * drawn. decodePlan ignores unknown params, so they ride the same URL.
   */
  const [withBeds, setWithBeds] = useState(() => initialParams.get("bed") === "1");
  const [bedChoice, setBedChoice] = useState<Record<number, string>>(() => {
    const picks: Record<number, string> = {};
    for (const part of (initialParams.get("beds") ?? "").split(",").filter(Boolean)) {
      const [day, id] = part.split(":");
      if (day && id) picks[Number(day)] = id;
    }
    return picks;
  });

  const today = useSyncExternalStore(neverChanges, clientMonth, serverMonth);
  // a concrete date knows its month; the pills are the fallback, today the default
  const month = startDate ? Number(startDate.slice(5, 7)) : (monthChoice ?? today);

  const input: PlanInput = useMemo(
    () => ({ from, to, days, month, must, avoid }),
    [from, to, days, month, must, avoid]
  );

  /**
   * The URL is the only persistence this feature has: keep it in step.
   *
   * window.history.replaceState rather than router.replace: the planner rewrites
   * the URL on every pill click and every keystroke in the must-visit box, and
   * router.replace treats each as a navigation, fetching an RSC payload for a
   * page whose content never changes. Next integrates replaceState with the
   * router and keeps useSearchParams in sync, so this is the same behaviour
   * without the round-trips.
   */
  useEffect(() => {
    if (!month) return;
    const q = new URLSearchParams(encodePlan(input));
    if (startDate) q.set("on", startDate);
    if (withBeds) {
      q.set("bed", "1");
      const picks = Object.entries(bedChoice)
        .map(([day, id]) => `${day}:${id}`)
        .join(",");
      if (picks) q.set("beds", picks);
    }
    window.history.replaceState(null, "", `/plan?${q.toString()}`);
  }, [input, month, withBeds, bedChoice, startDate]);

  /**
   * planTrip is pure and fast on small inputs but not uniformly so: measured
   * against this dataset it runs under 2 ms for a one-day plan and up to about
   * 107 ms for some four-day endpoint pairs, and it is synchronous. Run
   * directly off the click it blocks the pill from even repainting, which on a
   * mid-range phone at three to five times this cost is a visible stall.
   *
   * Deferring it lets React paint the pressed pill first with the previous
   * plan still on screen, then compute the new plan at lower priority where it
   * can be interrupted by the next click. `replanning` is that gap, used to
   * mark the result stale rather than leaving the old numbers looking current.
   */
  const deferredInput = useDeferredValue(input);
  const replanning = deferredInput !== input;

  const plan: PlanResult | null = useMemo(
    () => (month ? planTrip(deferredInput, data) : null),
    [deferredInput, month, data]
  );

  /**
   * Day-of-week closures, only when a date was given. Parsed into a LOCAL date
   * by parts: new Date("YYYY-MM-DD") is UTC midnight, and west of Greenwich
   * getDay() would answer for the day before.
   */
  const closures = useMemo(() => {
    if (!plan || !startDate) return [];
    const [y, m, d] = startDate.split("-").map(Number);
    return closureWarnings(plan.days, new Date(y, m - 1, d));
  }, [plan, startDate]);

  const toggleMust = useCallback((id: string) => {
    setMust((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id].slice(0, 5)));
  }, []);

  /**
   * "Not this one." Skipping a must-visit also un-demands it — that is what the
   * traveller means — and the planner replans without the spot via the input
   * memo, so URL sync and the deferred transition come for free.
   */
  const skipSpot = useCallback((id: string) => {
    setMust((m) => m.filter((x) => x !== id));
    setAvoid((a) => (a.includes(id) ? a : [...a, id]));
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
      <div className="no-print rounded-3xl border border-white/[0.07] bg-white/[0.02] p-5 sm:p-6">
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
                <Pill
                  key={m}
                  active={month === i + 1}
                  onClick={() => {
                    // a pill press while a date is set means "forget the date":
                    // otherwise the pill would look dead, overridden by the date
                    setStartDate("");
                    setMonth(i + 1);
                  }}
                >
                  {m}
                </Pill>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label
                htmlFor="plan-start-date"
                className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500"
              >
                Starting on{" "}
                <span className="normal-case tracking-normal text-stone-600">
                  · optional, unlocks closing-day warnings
                </span>
              </label>
              <input
                id="plan-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl border border-white/[0.09] bg-white/[0.04] px-3 py-1.5 text-sm text-stone-200 [color-scheme:dark]"
              />
              {startDate && (
                <button
                  type="button"
                  onClick={() => setStartDate("")}
                  className="text-xs text-stone-500 underline decoration-white/20 underline-offset-4 hover:text-stone-300"
                >
                  clear
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
            Must visit <span className="normal-case tracking-normal text-stone-600">· optional, up to 5</span>
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

        <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.09] bg-white/[0.03] p-4 transition-colors hover:border-emerald-400/40">
          <input
            type="checkbox"
            checked={withBeds}
            onChange={(e) => setWithBeds(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-400"
          />
          <span className="text-sm text-stone-300">
            Book a bed into the route
            <span className="mt-0.5 block text-xs text-stone-500">
              Adds each night&rsquo;s stay to the map and the driving line, and starts the next
              morning from there. You pick which one.
            </span>
          </span>
        </label>
      </div>

      {initial.dropped.length > 0 && (
        <p className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-4 text-sm text-amber-200">
          This link asked for {initial.dropped.length} place
          {initial.dropped.length > 1 ? "s" : ""} that no longer exist in the dataset (
          {initial.dropped.join(", ")}). Everything else was kept.
        </p>
      )}

      {plan && (
        <div
          className={
            replanning ? "opacity-50 transition-opacity duration-150" : "transition-opacity"
          }
          aria-busy={replanning || undefined}
        >
          {/* deferred, not live: these describe the plan being shown, and during
              the replan gap the live values belong to the next one */}
          <PlanView
            plan={plan}
            days={deferredInput.days}
            month={deferredInput.month}
            withBeds={withBeds}
            bedChoice={bedChoice}
            onPickBed={(day, id) => setBedChoice((prev) => ({ ...prev, [day]: id }))}
            onSkip={skipSpot}
            closures={closures}
            startDate={startDate || null}
          />
        </div>
      )}

      {/* Skipped stops must stay visible, or a mis-tap silently loses a place
          with no way back. Restoring is the same chip, inverted. */}
      {avoid.length > 0 && (
        <div className="no-print mt-6 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-stone-500">Skipped by you:</span>
          {avoid.map((id) => {
            const s = data.spots.find((x) => x.id === id);
            if (!s) return null;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setAvoid((a) => a.filter((x) => x !== id))}
                title="Bring this stop back"
                className="rounded-full border border-white/[0.09] bg-white/[0.03] px-2.5 py-1 text-stone-400 transition-colors hover:border-emerald-400/40 hover:text-emerald-300"
              >
                {s.name} ×
              </button>
            );
          })}
          <span className="text-stone-600">tap one to bring it back</span>
        </div>
      )}
    </>
  );
}

// ------------------------------------------------------------------ result

const NO_LEGS: Record<number, RoadLeg> = {};

const WEEKDAY_LABEL: Record<string, string> = {
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
};

/** "A" | "A and B" | "A, B and C" */
function listNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** Say why a bed is being offered, so a 40 km "nearby" option is not a surprise. */
const MATCH_LABEL: Record<string, string> = {
  "at-the-spot": "at this stop",
  "nearest-spot": "serves this stop",
  cluster: "same area",
  coords: "nearest bed",
};

/** One line of the route list. `rest` marks a night, which reads differently from a sight. */
function RouteRow({
  glyph,
  title,
  sub,
  color,
  href,
  rest,
}: {
  glyph: string;
  title: string;
  sub: string;
  color: string;
  href?: string;
  rest?: boolean;
}) {
  const body = (
    <>
      <span
        aria-hidden
        className={`flex shrink-0 items-center justify-center border-2 text-[11px] font-bold ${
          rest ? "h-7 w-9 rounded-lg" : "h-7 w-7 rounded-full"
        }`}
        style={{ borderColor: color, color }}
      >
        {glyph}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-stone-200">{title}</span>
        <span className="block truncate text-[11px] text-stone-500">{sub}</span>
      </span>
      {rest && (
        <span className="shrink-0 rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300 ring-1 ring-amber-400/25">
          Rest
        </span>
      )}
      {href && (
        <span className="shrink-0 text-[11px] font-semibold text-stone-600 transition-colors group-hover:text-emerald-300">
          Open <span aria-hidden>→</span>
        </span>
      )}
    </>
  );

  const className = `group flex items-center gap-3 px-5 py-2.5 ${
    rest ? "bg-amber-400/[0.04]" : ""
  } ${href ? "cursor-pointer transition-colors hover:bg-white/[0.03]" : ""}`;

  return (
    <li>
      {href ? (
        <Link href={href} className={className}>
          {body}
        </Link>
      ) : (
        <div className={className}>{body}</div>
      )}
    </li>
  );
}

/**
 * A day's driving order as a Google Maps directions link.
 *
 * The planner's whole output is a sequence of places to drive between, and until
 * now the only way to act on it was to retype every stop into a maps app. This
 * hands the same waypoints over in one tap.
 *
 * The Maps URL API takes at most 9 intermediate waypoints. Days here top out at
 * about five stops, but the cap is real, so surplus middle points are dropped
 * rather than silently mangling the link; the endpoints always survive.
 */
const MAPS_WAYPOINT_CAP = 9;

function googleMapsUrl(pts: [number, number][]): string | null {
  if (pts.length < 2) return null;
  const fmt = (p: [number, number]) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`;
  const origin = pts[0];
  const destination = pts[pts.length - 1];
  const middle = pts.slice(1, -1).slice(0, MAPS_WAYPOINT_CAP);
  const q = new URLSearchParams({
    api: "1",
    origin: fmt(origin),
    destination: fmt(destination),
    travelmode: "driving",
  });
  if (middle.length) q.set("waypoints", middle.map(fmt).join("|"));
  return `https://www.google.com/maps/dir/?${q.toString()}`;
}

/** Drop waypoints that repeat the previous one: a day's end node is usually its last stop. */
function dedupeWaypoints(pts: [number, number][]): [number, number][] {
  const out: [number, number][] = [];
  for (const p of pts) {
    const last = out[out.length - 1];
    if (!last || Math.hypot((last[0] - p[0]) * 111, (last[1] - p[1]) * 104) > 0.05) out.push(p);
  }
  return out;
}

function PlanView({
  plan,
  days,
  month,
  withBeds,
  bedChoice,
  onPickBed,
  onSkip,
  closures,
  startDate,
}: {
  plan: PlanResult;
  days: number;
  month: number;
  withBeds: boolean;
  bedChoice: Record<number, string>;
  onPickBed: (day: number, stayId: string) => void;
  onSkip: (spotId: string) => void;
  closures: ClosureWarning[];
  /** "YYYY-MM-DD" when the traveller gave one */
  startDate: string | null;
}) {
  const stops = plan.days.flatMap((d) => d.stops);

  /**
   * The bed chosen for each night, defaulting to the best match. A pick made
   * for an earlier plan may name a stay that is no longer offered, so fall
   * back rather than show nothing. Beds with no coordinates (the Tent Cities)
   * cannot join the route, but stay selectable.
   */
  const bedFor = useCallback(
    (day: number) => {
      const d = plan.days.find((x) => x.day === day);
      if (!withBeds || !d?.stays.length) return null;
      const picked = d.stays.find((o) => o.stay.id === bedChoice[day]);
      return picked ?? d.stays[0];
    },
    [plan, withBeds, bedChoice]
  );

  /**
   * A day's points in driving order, shared by the router and the maps link so
   * the two can never describe different journeys. Sleeping somewhere means the
   * day ends there and the next one starts there.
   */
  const waypointsFor = useCallback(
    (d: (typeof plan.days)[number]): [number, number][] => {
      const first = plan.days[0] === d;
      const bed = bedFor(d.day);
      const prevBed = bedFor(d.day - 1);
      const startFrom: [number, number] =
        prevBed?.stay.lat != null && prevBed.stay.lng != null
          ? [prevBed.stay.lat, prevBed.stay.lng]
          : first
            ? [plan.from.lat, plan.from.lng]
            : [d.startNode.lat, d.startNode.lng];
      const endAt: [number, number] =
        bed?.stay.lat != null && bed.stay.lng != null
          ? [bed.stay.lat, bed.stay.lng]
          : [d.endNode.lat, d.endNode.lng];
      return dedupeWaypoints([
        startFrom,
        ...d.stops.map((s) => [s.spot.lat, s.spot.lng] as [number, number]),
        endAt,
      ]);
    },
    [plan, bedFor]
  );

  // Stamped with the plan they belong to, so a stale set is ignored by
  // derivation rather than cleared by a setState in the effect body.
  // beds are waypoints too, so a changed bed must invalidate the routed legs
  const planKey = useMemo(
    () =>
      `${plan.from.key}>${plan.to.key}|` +
      plan.days.map((d) => `${d.day}:${d.stops.map((s) => s.spot.id).join(",")}`).join("|") +
      `|beds:${withBeds ? plan.days.map((d) => bedFor(d.day)?.stay.id ?? "-").join(",") : "off"}`,
    [plan, withBeds, bedFor]
  );
  const [routed, setRouted] = useState<{ key: string; legs: Record<number, RoadLeg> }>({
    key: "",
    legs: {},
  });
  const legs = routed.key === planKey ? routed.legs : NO_LEGS;

  /**
   * Ask OSRM for each day's real road path. Debounced because the form replans
   * on every pill click, and aborted on change so a slow answer for last
   * second's plan can never paint over this one.
   */
  useEffect(() => {
    const ctrl = new AbortController();
    let live = true;
    const timer = setTimeout(() => {
      /*
       * All days at once. These are independent requests, and awaiting them in
       * a loop made a five-day plan five serial round trips: at the ~0.5s OSRM
       * is answering in, that was about two and a half seconds before the real
       * line finished drawing, for no reason other than the shape of the loop.
       *
       * Deliberately not Promise.all: each day commits as it lands, so day one
       * paints while day five is still in flight, rather than the map staying
       * straight until the slowest request returns. fetchRoadRoute resolves
       * null on failure and never rejects, so there is nothing to catch.
       */
      for (const d of plan.days) {
        fetchRoadRoute(waypointsFor(d), ctrl.signal).then((leg) => {
          if (!live || !leg) return;
          setRouted((prev) => ({
            key: planKey,
            legs: prev.key === planKey ? { ...prev.legs, [d.day]: leg } : { [d.day]: leg },
          }));
        });
      }
    }, 500);
    return () => {
      live = false;
      ctrl.abort();
      clearTimeout(timer);
    };
  }, [plan, planKey, waypointsFor]);

  const routes: DayRoutes = useMemo(() => {
    const r: DayRoutes = {};
    for (const [day, leg] of Object.entries(legs)) r[Number(day)] = leg.points;
    return r;
  }, [legs]);

  /**
   * Take OSRM's distance, keep our own driving time.
   *
   * OSRM's car profile drives the posted speed limit, which put this corridor at
   * 72 km/h; Google reckons about 40 for the same road, and our speed model,
   * regressed from the dataset's own road figures, agrees. So each day's
   * measured kilometres are re-timed at the speed our model implied for that
   * day, which keeps distance and duration consistent with each other.
   */
  const dayMinutes = (d: PlanResult["days"][number]) => {
    const leg = legs[d.day];
    if (!leg) return d.driveMin;
    const kmh = d.driveMin > 0 && d.driveKm > 0 ? d.driveKm / (d.driveMin / 60) : 38;
    return Math.round((leg.km / kmh) * 60);
  };

  // only trust the measured totals once every day has come back
  const measured =
    plan.days.length > 0 && plan.days.every((d) => legs[d.day])
      ? {
          km: plan.days.reduce((s, d) => s + legs[d.day].km, 0),
          min: plan.days.reduce((s, d) => s + dayMinutes(d), 0),
        }
      : null;

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
    // Skip one that lands on top of a real stop, the Statue of Unity shares the
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
    // a bed you have chosen belongs on the map: it is where the day actually ends
    if (withBeds) {
      for (const d of plan.days) {
        const bed = bedFor(d.day);
        if (!bed || bed.stay.lat == null || bed.stay.lng == null) continue;
        list.push({
          id: `bed-${d.day}-${bed.stay.id}`,
          name: bed.stay.name,
          lat: bed.stay.lat,
          lng: bed.stay.lng,
          day: d.day,
          order: 500 + d.day, // after that day's stops, before the finish marker
          emoji: "🛏️",
          approx: true,
          kind: "bed",
          note: `Night ${d.day}, where you sleep`,
          href: `/stays#${bed.stay.id}`,
          hrefLabel: "Open this stay",
        });
      }
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
  }, [plan, stops, withBeds, bedFor]);

  const monthName = month ? MONTHS[month - 1] : "";
  const closureFor = (day: number) => closures.find((c) => c.day === day);
  // "starting Mon, 14 Sept" beats "planned for Sep" once a date is known
  const startLabel = useMemo(() => {
    if (!startDate) return null;
    const [y, m, d] = startDate.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }, [startDate]);

  if (!stops.length) {
    return (
      <div className="mt-8 rounded-3xl border border-white/[0.07] bg-white/[0.02] p-8 text-center">
        <p className="font-serif text-xl font-black italic text-stone-200">
          Nothing fits between those two points.
        </p>
        <p className="mt-2 text-sm text-stone-500">
          {plan.excludedBySeason > 0
            ? `${plan.excludedBySeason} places are shut in ${monthName}. Try more days, a wider pair of endpoints, or another month.`
            : "Try more days or endpoints further apart, everything nearby is already on the way."}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10">
      {/* Paper loses the site header, so the sheet has to say what it is and
          which trip it describes. Printed month included: this plan is only
          correct for the month it was built for. */}
      <div className="print-only mb-4 border-b pb-2">
        <p className="font-serif text-xl font-black">
          {plan.from.name} → {plan.to.name}
        </p>
        <p className="text-[11px]">
          {plan.days.length} day{plan.days.length > 1 ? "s" : ""} · {stops.length} stops ·{" "}
          {startLabel ? `starting ${startLabel}` : `planned for ${monthName}`} ·
          dandak.vercel.app/plan
        </p>
      </div>

      {/* headline numbers */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-emerald-400/10 px-3 py-1 font-bold text-emerald-300 ring-1 ring-emerald-400/25">
          {plan.days.length} day{plan.days.length > 1 ? "s" : ""} · {stops.length} stops
        </span>
        <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-stone-400">
          {measured ? `${Math.round(measured.km)} km` : `~${Math.round(plan.totalKm)} km`}
        </span>
        <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-stone-400">
          {hhmm(measured ? measured.min : plan.totalDriveMin)} driving
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

      <div className="no-print mt-6">
        <TripMap stops={mapStops} durationDays={days} routes={routes} />
      </div>

      {/* The whole route in order. A map answers "where"; this answers "then what",
          and it is the only place a night reads as a night rather than a marker. */}
      <section className="mt-4 overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.02]">
        <p className="border-b border-white/[0.06] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-stone-500">
          The whole route
        </p>
        <ol className="divide-y divide-white/[0.05]">
          <RouteRow
            glyph="🚩"
            title={plan.from.name}
            sub="Trip starts here"
            color="#78716c"
          />
          {plan.days.map((d) => {
            const color = DAY_STROKE[(d.day - 1) % DAY_STROKE.length];
            const bed = bedFor(d.day);
            return (
              <Fragment key={d.day}>
                {d.stops.map((s) => (
                  <RouteRow
                    key={s.spot.id}
                    glyph={String(s.order)}
                    title={s.spot.name}
                    sub={`Day ${d.day} · ${categoryMeta(s.spot.category).emoji} ${
                      s.driveKmFromPrev > 0 ? `${Math.round(s.driveKmFromPrev)} km · ` : ""
                    }${hhmm(s.spot.durationMin)} here`}
                    color={color}
                    href={`/spots/${s.spot.district}/${s.spot.slug}`}
                  />
                ))}
                {bed && (
                  <RouteRow
                    glyph="🛏️"
                    title={bed.stay.name}
                    sub={`Night ${d.day} · ${stayTypeMeta(bed.stay.type).label} · ${
                      PRICE_BAND_LABEL[bed.stay.priceBand] ?? bed.stay.priceBand
                    }`}
                    color={color}
                    href={`/stays#${bed.stay.id}`}
                    rest
                  />
                )}
              </Fragment>
            );
          })}
          {!plan.isLoop && (
            <RouteRow glyph="🏁" title={plan.to.name} sub="Trip ends here" color="#78716c" />
          )}
        </ol>
      </section>

      {plan.days.map((d) => (
        <section key={d.day} className="print-day mt-10">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="font-serif text-5xl font-black text-stroke">
              {String(d.day).padStart(2, "0")}
            </span>
            <h2 className="font-serif text-2xl font-black italic text-stone-100">Day {d.day}</h2>
            {(() => {
              const href = googleMapsUrl(waypointsFor(d));
              return href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-print ml-auto shrink-0 self-center rounded-full border border-white/[0.09] bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-stone-300 transition-colors hover:border-emerald-400/40 hover:text-emerald-300"
                >
                  Drive this day ↗
                </a>
              ) : null;
            })()}
          </div>
          <p className="mt-2 text-xs text-stone-500">
            {d.startNode.name} → {d.endNode.name} ·{" "}
            {legs[d.day]
              ? `${Math.round(legs[d.day].km)} km · ${hhmm(dayMinutes(d))}`
              : `~${Math.round(d.driveKm)} km · ${hhmm(d.driveMin)}`}{" "}
            driving · {hhmm(d.visitMin)} at places
          </p>

          {/* The trust warning. Deliberately NOT no-print: on paper, mid-trip,
              is exactly where "it's shut today" matters most. */}
          {(() => {
            const c = closureFor(d.day);
            if (!c) return null;
            const w = WEEKDAY_LABEL[c.weekday] ?? c.weekday;
            return (
              <p className="mt-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-4 text-sm leading-relaxed text-amber-200">
                ⚠ Day {c.day} lands on a {w}: {listNames(c.spotNames)}{" "}
                {c.spotNames.length === 1 ? "closes" : "close"} on {w}s. Shift the start date, or
                skip {c.spotNames.length === 1 ? "it" : "them"}.
              </p>
            );
          })()}

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
                {/* On paper the map is gone, so the coordinates have to be on the
                    page: they are the one thing that still works with no signal,
                    typed into an offline maps app or a GPS. */}
                <p className="print-only text-[11px]">
                  #{s.order} {s.spot.name} · {s.spot.lat.toFixed(4)}, {s.spot.lng.toFixed(4)}
                </p>
                <StopCard
                  onSkip={() => onSkip(s.spot.id)}
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

          {d.stays.length > 0 && (
            <div className="mt-5 rounded-2xl border border-white/[0.07] bg-gradient-to-br from-emerald-400/[0.06] to-transparent p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                🛏 Where to sleep after day {d.day}
                {withBeds && (
                  <span className="ml-2 font-sans normal-case tracking-normal text-stone-500">
                    · pick one and it joins the route
                  </span>
                )}
              </p>
              <div className="mt-3 space-y-2.5">
                {d.stays.map((opt) => {
                  const type = stayTypeMeta(opt.stay.type);
                  const chosen = withBeds && bedFor(d.day)?.stay.id === opt.stay.id;
                  const mappable = opt.stay.lat != null && opt.stay.lng != null;
                  return (
                    <div
                      key={opt.stay.id}
                      role={withBeds ? "button" : undefined}
                      tabIndex={withBeds ? 0 : undefined}
                      onClick={withBeds ? () => onPickBed(d.day, opt.stay.id) : undefined}
                      onKeyDown={
                        withBeds
                          ? (e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                onPickBed(d.day, opt.stay.id);
                              }
                            }
                          : undefined
                      }
                      className={`rounded-xl border p-3.5 transition-colors ${
                        chosen
                          ? "border-emerald-400/50 bg-emerald-400/[0.08]"
                          : "border-white/[0.07] bg-white/[0.03]"
                      } ${withBeds ? "cursor-pointer hover:border-emerald-400/40" : ""}`}
                    >
                      {withBeds && (
                        <p className="mb-1.5 text-[11px] font-bold text-emerald-300">
                          {chosen ? "✓ Sleeping here" : "Choose this one"}
                          {chosen && !mappable && (
                            <span className="ml-2 font-normal text-stone-500">
                              (no coordinates on record, so it cannot join the drawn route)
                            </span>
                          )}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className={`rounded-full px-2 py-0.5 font-semibold ring-1 ${type.chip}`}>
                          {type.emoji} {type.label}
                        </span>
                        <span className="text-stone-500">
                          {PRICE_BAND_LABEL[opt.stay.priceBand] ?? opt.stay.priceBand}
                        </span>
                        <span className="text-stone-600">{MATCH_LABEL[opt.matchedOn]}</span>
                        {opt.km !== null && opt.km >= 1 && (
                          <span className="text-stone-600">· ~{Math.round(opt.km)} km away</span>
                        )}
                      </div>
                      <p className="mt-1.5 font-serif text-base font-black text-stone-100">
                        {opt.stay.name}
                      </p>
                      {opt.stay.bookingNotes && (
                        <p className="mt-1 text-xs leading-relaxed text-stone-500">
                          {opt.stay.bookingNotes}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        {opt.stay.bookingUrl && (
                          <a
                            href={opt.stay.bookingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-emerald-300 transition-colors hover:text-emerald-200"
                          >
                            Book ↗
                          </a>
                        )}
                        {opt.stay.contact && (
                          <span className="text-stone-500">{opt.stay.contact}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-[11px] text-stone-600">
                Distances are straight-line from where the day ends.{" "}
                <Link href="/stays" className="text-stone-500 underline hover:text-emerald-300">
                  See every documented bed →
                </Link>
              </p>
            </div>
          )}
        </section>
      ))}

      {/* honesty footer */}
      <section className="mt-10 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 text-sm text-stone-400">
        <p>
          <strong className="font-semibold text-stone-200">How this was built:</strong> stops are
          chosen for least detour from your route, then ordered to cut driving, using the
          dataset&rsquo;s own road figures where we have them ({plan.curatedLegs} leg
          {plan.curatedLegs === 1 ? "" : "s"} here) and straight-line estimates otherwise (
          {plan.estimatedLegs}).{" "}
          {measured
            ? "The line on the map and the distances above are the real road route from OpenStreetMap. Driving times are ours, not the router's: its default speed limits are far too optimistic for these ghat roads."
            : "The map is still fetching the real road route; until it lands, distances are estimates and the line is drawn straight."}
        </p>
        {plan.excludedBySeason > 0 && (
          <p className="mt-2 text-xs text-stone-500">
            {plan.excludedBySeason} place{plan.excludedBySeason === 1 ? " was" : "s were"} left out
            because {monthName} is the wrong month for {plan.excludedBySeason === 1 ? "it" : "them"}
            {plan.excluded.length > 0 && (
              <>, including {plan.excluded.slice(0, 3).map((e) => e.name).join(", ")}</>
            )}
            .
          </p>
        )}
        <p className="mt-2 text-xs text-stone-500">
          Every stop links to its full record, timings, fees, seasons, safety and sources.
        </p>
        <div className="no-print mt-4 flex flex-wrap items-center gap-2">
          <CopyPlanLink />
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-full border border-white/[0.09] bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-stone-300 transition-colors hover:border-emerald-400/40 hover:text-emerald-300"
          >
            Print or save as PDF
          </button>
          <button
            type="button"
            onClick={() => {
              /*
               * The interior has no signal, so the plan has to leave the
               * browser. A GPX opens in OsmAnd / Organic Maps, offline-first,
               * with each day as a track (the real road geometry when OSRM has
               * answered, the straight chain otherwise, the same fallback the
               * map draws) and every stop as a numbered waypoint.
               */
              const xml = buildGpx(
                `${plan.from.name} to ${plan.to.name} · dandak`,
                plan.days.map((d) => ({
                  day: d.day,
                  points: legs[d.day]?.points ?? waypointsFor(d),
                  stops: d.stops.map((s) => ({
                    order: s.order,
                    name: s.spot.name,
                    lat: s.spot.lat,
                    lng: s.spot.lng,
                  })),
                }))
              );
              const url = URL.createObjectURL(new Blob([xml], { type: "application/gpx+xml" }));
              const a = document.createElement("a");
              a.href = url;
              a.download = "dandak-plan.gpx";
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="rounded-full border border-white/[0.09] bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-stone-300 transition-colors hover:border-emerald-400/40 hover:text-emerald-300"
          >
            Download GPX for offline maps
          </button>
          <button
            type="button"
            onClick={() => {
              // built at click time so the URL is never stale
              const text = `${plan.from.name} to ${plan.to.name} · ${plan.days.length} day${plan.days.length > 1 ? "s" : ""} · ${stops.length} stops · ${window.location.href}`;
              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
            }}
            className="rounded-full border border-white/[0.09] bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-stone-300 transition-colors hover:border-emerald-400/40 hover:text-emerald-300"
          >
            Share on WhatsApp
          </button>
          <span className="text-xs text-stone-600">
            The whole plan is in the URL, so the link reopens exactly this.
          </span>
        </div>
      </section>
    </div>
  );
}
