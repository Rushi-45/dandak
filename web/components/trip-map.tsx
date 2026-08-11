"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap_ } from "leaflet";
import { addBaseLayers, keepMapSized } from "@/components/map-base";

export interface TripMapStop {
  id: string;
  /** absent for trip endpoints — a hub town has no record page to open */
  district?: string;
  slug?: string;
  name: string;
  lat: number;
  lng: number;
  day: number;
  order: number;
  emoji: string;
  approx: boolean;
  /** endpoints and beds draw their emoji instead of a stop number and never link */
  kind?: "stop" | "endpoint" | "bed";
  /** overrides the "Day N · stop N" popup subtitle */
  note?: string;
  /** where the popup's link goes; defaults to this spot's own record */
  href?: string;
  /** popup link text, when href is set */
  hrefLabel?: string;
}

/** Road geometry per day number: [[lat, lng], …] following the actual roads. */
export type DayRoutes = Record<number, [number, number][]>;

interface TripMapProps {
  stops: TripMapStop[];
  durationDays: number;
  /** Absent or partial is fine — any day without geometry falls back to a straight line. */
  routes?: DayRoutes;
}

export const DAY_STROKE = ["#34d399", "#fbbf24", "#38bdf8", "#f472b6", "#a78bfa"];
const DAY_TEXT = [
  "text-emerald-300 ring-emerald-400/30 bg-emerald-400/10",
  "text-amber-300 ring-amber-400/30 bg-amber-400/10",
  "text-sky-300 ring-sky-400/30 bg-sky-400/10",
  "text-pink-300 ring-pink-400/30 bg-pink-400/10",
  "text-violet-300 ring-violet-400/30 bg-violet-400/10",
];

export function TripMap({ stops, durationDays, routes }: TripMapProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap_ | null>(null);
  const [failed, setFailed] = useState(false);

  const days = Array.from({ length: durationDays }, (_, i) => i + 1);
  const byDay = days.map((d) =>
    stops.filter((s) => s.day === d).sort((a, b) => a.order - b.order)
  );

  // The Leaflet effect below cannot depend on `stops` (a new array identity every
  // render would tear the map down constantly) nor run once (the planner changes
  // its route in place). This key changes exactly when the drawn route changes.
  const routeKey = useMemo(
    () =>
      stops.map((s) => `${s.day}:${s.order}:${s.id}:${s.lat},${s.lng}`).join("|") +
      // road geometry usually arrives after the first paint, so it has to redraw
      "#" +
      Object.entries(routes ?? {})
        .map(([d, pts]) => `${d}:${pts.length}`)
        .join(","),
    [stops, routes]
  );

  // Stops that sit within ~400 m of one another (U-Turn Point and the Mahal
  // campsite are 350 m apart) would hide each other's numbers, so nudge them
  // apart by ~350 m — an order of magnitude less than these records' own
  // coordinate uncertainty, and the footer says so when it happens.
  const { at, nudged } = useMemo(() => {
    const placed: [number, number][] = [];
    const map = new Map<string, [number, number]>();
    let moved = false;
    for (const s of stops) {
      const perLat = 111;
      const perLng = 111 * Math.cos((s.lat * Math.PI) / 180);
      let pos: [number, number] = [s.lat, s.lng];
      for (let t = 0; t < 8; t++) {
        const clash = placed.some(
          ([a, b]) => Math.hypot((a - pos[0]) * perLat, (b - pos[1]) * perLng) < 0.4
        );
        if (!clash) break;
        moved = true;
        const ang = (t * Math.PI * 2) / 6;
        pos = [s.lat + (0.35 / perLat) * Math.sin(ang), s.lng + (0.35 / perLng) * Math.cos(ang)];
      }
      placed.push(pos);
      map.set(`${s.day}-${s.order}`, pos);
    }
    return { at: map, nudged: moved };
  }, [stops]);
  const posOf = (s: TripMapStop) => at.get(`${s.day}-${s.order}`) ?? [s.lat, s.lng];

  useEffect(() => {
    if (stops.length < 2) return;
    let cancelled = false;
    let dispose: (() => void) | undefined;
    (async () => {
      try {
        const L = (await import("leaflet")).default;
        if (cancelled || !divRef.current || mapRef.current) return;

        const map = L.map(divRef.current, { scrollWheelZoom: false });
        addBaseLayers(L, map);

        byDay.forEach((list, i) => {
          const color = DAY_STROKE[i % DAY_STROKE.length];
          const road = routes?.[i + 1];
          const line: [number, number][] | null =
            road && road.length >= 2
              ? road
              : list.length >= 2
                ? list.map((s) => posOf(s) as [number, number])
                : null;
          if (line) {
            L.polyline(line, { color, weight: 5, opacity: 0.35 }).addTo(map);
            L.polyline(line, { color, weight: 2.5, opacity: 0.95 }).addTo(map);
          }
          // dashed handoff from the previous day's last stop
          const prev = byDay[i - 1];
          if (prev?.length && list.length) {
            L.polyline([posOf(prev[prev.length - 1]), posOf(list[0])], {
              color: "#e7e5e4",
              weight: 1.5,
              opacity: 0.45,
              dashArray: "4 8",
            }).addTo(map);
          }
        });

        for (const s of stops) {
          const color = DAY_STROKE[(s.day - 1) % DAY_STROKE.length];
          const isBed = s.kind === "bed";
          const isGlyph = isBed || s.kind === "endpoint";
          const extra = isBed ? " dk-stop-bed" : s.kind === "endpoint" ? " dk-stop-endpoint" : "";
          const target = s.href ?? (s.district && s.slug ? `/spots/${s.district}/${s.slug}` : null);
          const link = target
            ? `<a href="${target}">${s.hrefLabel ?? "Open the record"} →</a>`
            : "";
          L.marker(posOf(s), {
            icon: L.divIcon({
              className: "dk-stop-wrap",
              html: `<span class="dk-stop${extra}" style="border-color:${color};color:${color}">${
                isGlyph ? s.emoji : s.order
              }</span>`,
              iconSize: [36, 36],
              iconAnchor: [18, 18],
            }),
            zIndexOffset: isGlyph ? 400 : 500,
            riseOnHover: true,
            title: s.name,
          })
            .bindTooltip(`${s.emoji} ${s.name}`, { direction: "top", offset: [0, -16] })
            .bindPopup(
              `<div class="dk-pop">` +
                `<p class="dk-pop-title">${s.emoji} ${s.name}</p>` +
                `<p class="dk-pop-sub">${s.note ?? `Day ${s.day} · stop ${s.order}`}</p>` +
                link +
                `</div>`,
              { closeButton: false }
            )
            .addTo(map);
        }

        // include the road geometry, or a route that swings wide gets cropped
        const bounds = L.latLngBounds(stops.map((s) => posOf(s)));
        for (const pts of Object.values(routes ?? {})) for (const p of pts) bounds.extend(p);
        map.fitBounds(bounds.pad(0.15));
        mapRef.current = map;
        dispose = keepMapSized(map, divRef.current);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      dispose?.();
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey]);

  if (stops.length < 2 || failed) return null;

  const gmapsUrl = (list: TripMapStop[]) =>
    `https://www.google.com/maps/dir/${list.map((s) => `${s.lat},${s.lng}`).join("/")}`;
  const anyApprox = stops.some((s) => s.approx);
  const hasRoads = Object.values(routes ?? {}).some((p) => p.length >= 2);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.02]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-5 py-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-500">The route</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {days.map((d) => (
            <span
              key={d}
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ${DAY_TEXT[(d - 1) % DAY_TEXT.length]}`}
            >
              Day {d}
            </span>
          ))}
        </div>
      </div>

      <div ref={divRef} className="h-[440px] w-full sm:h-[520px]" />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] px-5 py-3.5">
        <p className="text-[11px] text-stone-500">
          {hasRoads
            ? "Lines follow driving routes from OpenStreetMap"
            : "Lines connect stops directly, not along roads"}
          {anyApprox && " · some pins are approximate"}
          {nudged && " · overlapping stops nudged apart"}
        </p>
        <div className="flex flex-wrap gap-2">
          {durationDays > 1 ? (
            byDay.map(
              (list, i) =>
                list.length >= 2 && (
                  <a
                    key={i}
                    href={gmapsUrl(list)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/[0.1] bg-white/[0.04] px-3.5 py-1.5 text-[11px] font-bold text-stone-200 transition-colors hover:border-emerald-400/40 hover:text-emerald-200"
                  >
                    Day {i + 1} in Google Maps ↗
                  </a>
                )
            )
          ) : (
            <a
              href={gmapsUrl(stops)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/[0.1] bg-white/[0.04] px-3.5 py-1.5 text-[11px] font-bold text-stone-200 transition-colors hover:border-emerald-400/40 hover:text-emerald-200"
            >
              Open route in Google Maps ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
