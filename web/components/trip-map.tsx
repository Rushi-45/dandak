"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap_ } from "leaflet";
import { addBaseLayers } from "@/components/map-base";

export interface TripMapStop {
  id: string;
  district: string;
  slug: string;
  name: string;
  lat: number;
  lng: number;
  day: number;
  order: number;
  emoji: string;
  approx: boolean;
}

interface TripMapProps {
  stops: TripMapStop[];
  durationDays: number;
}

const DAY_STROKE = ["#34d399", "#fbbf24", "#38bdf8", "#f472b6", "#a78bfa"];
const DAY_TEXT = [
  "text-emerald-300 ring-emerald-400/30 bg-emerald-400/10",
  "text-amber-300 ring-amber-400/30 bg-amber-400/10",
  "text-sky-300 ring-sky-400/30 bg-sky-400/10",
  "text-pink-300 ring-pink-400/30 bg-pink-400/10",
  "text-violet-300 ring-violet-400/30 bg-violet-400/10",
];

export function TripMap({ stops, durationDays }: TripMapProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap_ | null>(null);
  const [failed, setFailed] = useState(false);

  const days = Array.from({ length: durationDays }, (_, i) => i + 1);
  const byDay = days.map((d) =>
    stops.filter((s) => s.day === d).sort((a, b) => a.order - b.order)
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
    (async () => {
      try {
        const L = (await import("leaflet")).default;
        if (cancelled || !divRef.current || mapRef.current) return;

        const map = L.map(divRef.current, { scrollWheelZoom: false });
        addBaseLayers(L, map);

        byDay.forEach((list, i) => {
          const color = DAY_STROKE[i % DAY_STROKE.length];
          if (list.length >= 2) {
            const line = list.map((s) => posOf(s));
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
          L.marker(posOf(s), {
            icon: L.divIcon({
              className: "dk-stop-wrap",
              html: `<span class="dk-stop" style="border-color:${color};color:${color}">${s.order}</span>`,
              iconSize: [26, 26],
              iconAnchor: [13, 13],
            }),
            zIndexOffset: 500,
          })
            .bindTooltip(`${s.emoji} ${s.name}`, { direction: "top", offset: [0, -12] })
            .bindPopup(
              `<div class="dk-pop">` +
                `<p class="dk-pop-title">${s.emoji} ${s.name}</p>` +
                `<p class="dk-pop-sub">Day ${s.day} · stop ${s.order}</p>` +
                `<a href="/spots/${s.district}/${s.slug}">Open the record →</a>` +
                `</div>`,
              { closeButton: false }
            )
            .addTo(map);
        }

        map.fitBounds(L.latLngBounds(stops.map((s) => posOf(s))).pad(0.15));
        mapRef.current = map;
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (stops.length < 2 || failed) return null;

  const gmapsUrl = (list: TripMapStop[]) =>
    `https://www.google.com/maps/dir/${list.map((s) => `${s.lat},${s.lng}`).join("/")}`;
  const anyApprox = stops.some((s) => s.approx);

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
          Lines connect stops directly, not along roads
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
