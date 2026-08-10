"use client";

import Link from "next/link";
import { useState } from "react";
import { m } from "motion/react";

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

const W = 800;
const H = 500;
const PAD = 70;

const DAY_STROKE = ["#34d399", "#fbbf24", "#38bdf8", "#f472b6", "#a78bfa"];
const DAY_TEXT = [
  "text-emerald-300 ring-emerald-400/30 bg-emerald-400/10",
  "text-amber-300 ring-amber-400/30 bg-amber-400/10",
  "text-sky-300 ring-sky-400/30 bg-sky-400/10",
  "text-pink-300 ring-pink-400/30 bg-pink-400/10",
  "text-violet-300 ring-violet-400/30 bg-violet-400/10",
];

export function TripMap({ stops, durationDays }: TripMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  if (stops.length < 2) return null;

  // Equirectangular projection with latitude correction, fitted into the viewBox.
  const midLat = stops.reduce((a, s) => a + s.lat, 0) / stops.length;
  const kx = Math.cos((midLat * Math.PI) / 180);
  const xs = stops.map((s) => s.lng * kx);
  const ys = stops.map((s) => s.lat);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const dx = Math.max(maxX - minX, 0.015);
  const dy = Math.max(maxY - minY, 0.015);
  const scale = Math.min((W - PAD * 2) / dx, (H - PAD * 2) / dy);
  const ox = (W - dx * scale) / 2;
  const oy = (H - dy * scale) / 2;

  const project = (s: TripMapStop) => ({
    x: ox + (s.lng * kx - minX) * scale,
    y: oy + (maxY - s.lat) * scale,
  });

  // Fan out stops that project too close together so none hides another.
  const placed: { x: number; y: number }[] = [];
  const pos = new Map<string, { x: number; y: number }>();
  for (const s of stops) {
    const base = project(s);
    let p = base;
    for (let t = 0; t < 8; t++) {
      const clash = placed.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 30);
      if (!clash) break;
      const ang = (t * Math.PI * 2) / 6 - Math.PI / 2;
      p = { x: base.x + Math.cos(ang) * 30, y: base.y + Math.sin(ang) * 30 };
    }
    placed.push(p);
    pos.set(`${s.day}-${s.order}`, p);
  }
  const at = (s: TripMapStop) => pos.get(`${s.day}-${s.order}`)!;

  const days = Array.from({ length: durationDays }, (_, i) => i + 1);
  const byDay = days.map((d) =>
    stops.filter((s) => s.day === d).sort((a, b) => a.order - b.order)
  );

  const dayPath = (list: TripMapStop[]) =>
    list
      .map((s, i) => {
        const { x, y } = at(s);
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");

  // Faint dashed connector between the end of one day and the start of the next.
  const connectors = byDay.slice(0, -1).map((list, i) => {
    const next = byDay[i + 1];
    if (!list.length || !next?.length) return null;
    const a = at(list[list.length - 1]);
    const b = at(next[0]);
    return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} L ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  });

  const anyApprox = stops.some((s) => s.approx);

  const gmapsUrl = (list: TripMapStop[]) =>
    `https://www.google.com/maps/dir/${list.map((s) => `${s.lat},${s.lng}`).join("/")}`;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.02]">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/[0.07] blur-[70px]" />

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-5 py-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-500">
          The route
        </p>
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

      <div className="relative aspect-[8/5] w-full">
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full">
          {/* graph-paper hint */}
          <g stroke="rgba(255,255,255,0.035)" strokeWidth="1">
            {Array.from({ length: 7 }, (_, i) => (
              <line key={`v${i}`} x1={(W / 8) * (i + 1)} y1={0} x2={(W / 8) * (i + 1)} y2={H} />
            ))}
            {Array.from({ length: 4 }, (_, i) => (
              <line key={`h${i}`} x1={0} y1={(H / 5) * (i + 1)} x2={W} y2={(H / 5) * (i + 1)} />
            ))}
          </g>

          {/* inter-day connectors */}
          {connectors.map(
            (d, i) =>
              d && (
                <path
                  key={`c${i}`}
                  d={d}
                  fill="none"
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth="1.5"
                  strokeDasharray="3 7"
                />
              )
          )}

          {/* day routes: soft glow underlay + animated line */}
          {byDay.map((list, i) => {
            if (list.length < 2) return null;
            const d = dayPath(list);
            const color = DAY_STROKE[i % DAY_STROKE.length];
            return (
              <g key={`day${i}`}>
                <path d={d} fill="none" stroke={color} strokeOpacity="0.18" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
                <m.path
                  d={d}
                  fill="none"
                  stroke={color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 1.4, delay: 0.3 + i * 0.9, ease: "easeInOut" }}
                />
              </g>
            );
          })}

          {/* compass */}
          <g transform={`translate(${W - 34}, 38)`} className="select-none">
            <text textAnchor="middle" fontSize="13" fontWeight="700" fill="rgba(214,211,209,0.5)">
              N
            </text>
            <path d="M 0 -24 L 4 -12 L 0 -15 L -4 -12 Z" fill="rgba(52,211,153,0.6)" />
          </g>
        </svg>

        {/* stop nodes as HTML so they stay crisp, hoverable and linkable */}
        {stops.map((s) => {
          const { x, y } = at(s);
          const left = +((x / W) * 100).toFixed(4);
          const top = +((y / H) * 100).toFixed(4);
          const color = DAY_TEXT[(s.day - 1) % DAY_TEXT.length];
          const isHover = hovered === `${s.day}-${s.order}`;
          const flip = top < 28; // tooltip below the node near the top edge, so it never clips
          return (
            <div
              key={`${s.day}-${s.order}`}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${left}%`, top: `${top}%` }}
            >
              <Link
                href={`/spots/${s.district}/${s.slug}`}
                aria-label={`Stop ${s.order}, day ${s.day}: ${s.name}`}
                onMouseEnter={() => setHovered(`${s.day}-${s.order}`)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(`${s.day}-${s.order}`)}
                onBlur={() => setHovered(null)}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black ring-2 backdrop-blur transition-transform duration-200 ${color} ${isHover ? "scale-125" : ""}`}
                style={{ backgroundColor: "rgba(8,12,11,0.85)" }}
              >
                {s.order}
              </Link>
              {isHover && (
                <div
                  className={`pointer-events-none absolute left-1/2 z-20 w-max max-w-[200px] -translate-x-1/2 rounded-xl border border-white/10 bg-[#0b1210]/95 px-3 py-2 text-center shadow-xl backdrop-blur ${
                    flip ? "top-full translate-y-[10px]" : "top-0 -translate-y-[calc(100%+10px)]"
                  }`}
                >
                  <p className="text-xs font-bold leading-snug text-stone-100">
                    {s.emoji} {s.name}
                  </p>
                  <p className="mt-0.5 text-[10px] text-stone-500">
                    Day {s.day} · stop {s.order}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] px-5 py-3.5">
        <p className="text-[11px] text-stone-500">
          Schematic route — straight lines, not roads
          {anyApprox && " · some positions approximate"}
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
