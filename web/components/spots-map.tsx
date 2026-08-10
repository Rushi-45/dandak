"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export interface SpotMarker {
  id: string;
  district: string;
  slug: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  emoji: string;
}

interface SpotsMapProps {
  markers: SpotMarker[];
  categories: { key: string; label: string; emoji: string; count: number }[];
}

const W = 760;

const DISTRICT_DOT: Record<string, string> = {
  dang: "border-emerald-300/80 bg-emerald-400/25",
  narmada: "border-sky-300/80 bg-sky-400/25",
};

export function SpotsMap({ markers, categories }: SpotsMapProps) {
  const [category, setCategory] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const { H, project } = useMemo(() => {
    const midLat = markers.reduce((a, s) => a + s.lat, 0) / markers.length;
    const kx = Math.cos((midLat * Math.PI) / 180);
    const xs = markers.map((s) => s.lng * kx);
    const ys = markers.map((s) => s.lat);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const dx = Math.max(maxX - minX, 0.05);
    const dy = Math.max(maxY - minY, 0.05);
    // Height follows the real bbox shape, clamped to stay screen-friendly.
    const height = Math.min(Math.max((dy / dx) * W, 420), 980);
    const pad = 40;
    const scale = Math.min((W - pad * 2) / dx, (height - pad * 2) / dy);
    const ox = (W - dx * scale) / 2;
    const oy = (height - dy * scale) / 2;
    return {
      H: height,
      project: (s: SpotMarker) => ({
        x: ox + (s.lng * kx - minX) * scale,
        y: oy + (maxY - s.lat) * scale,
      }),
    };
  }, [markers]);

  const shown = category ? markers.filter((m) => m.category === category) : markers;
  const shownCount = shown.length;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.02]">
      <div className="pointer-events-none absolute -left-20 top-1/4 h-64 w-64 rounded-full bg-emerald-500/[0.06] blur-[80px]" />
      <div className="pointer-events-none absolute -right-20 bottom-1/4 h-64 w-64 rounded-full bg-sky-500/[0.05] blur-[80px]" />

      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-5 py-3.5">
        <button
          onClick={() => setCategory(null)}
          className={`rounded-full px-3 py-1 text-[11px] font-bold transition-colors ${
            category === null
              ? "bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-400/40"
              : "border border-white/[0.08] bg-white/[0.03] text-stone-400 hover:text-stone-200"
          }`}
        >
          All · {markers.length}
        </button>
        {categories.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(category === c.key ? null : c.key)}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
              category === c.key
                ? "bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-400/40"
                : "border border-white/[0.08] bg-white/[0.03] text-stone-400 hover:text-stone-200"
            }`}
          >
            {c.emoji} {c.label} · {c.count}
          </button>
        ))}
      </div>

      <div className="relative w-full" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full">
          <g stroke="rgba(255,255,255,0.03)" strokeWidth="1">
            {Array.from({ length: 7 }, (_, i) => (
              <line key={`v${i}`} x1={(W / 8) * (i + 1)} y1={0} x2={(W / 8) * (i + 1)} y2={H} />
            ))}
            {Array.from({ length: 9 }, (_, i) => (
              <line key={`h${i}`} x1={0} y1={(H / 10) * (i + 1)} x2={W} y2={(H / 10) * (i + 1)} />
            ))}
          </g>
          <g transform={`translate(${W - 30}, 34)`} className="select-none">
            <text textAnchor="middle" fontSize="12" fontWeight="700" fill="rgba(214,211,209,0.45)">
              N
            </text>
            <path d="M 0 -22 L 3.5 -11 L 0 -14 L -3.5 -11 Z" fill="rgba(52,211,153,0.55)" />
          </g>
        </svg>

        {markers.map((s) => {
          const { x, y } = project(s);
          const left = (x / W) * 100;
          const top = (y / H) * 100;
          const active = !category || s.category === category;
          const isHover = hovered === s.id;
          const flip = top < 12;
          return (
            <div
              key={s.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${left}%`, top: `${top}%`, zIndex: isHover ? 30 : 10 }}
            >
              <Link
                href={`/spots/${s.district}/${s.slug}`}
                aria-label={s.name}
                tabIndex={active ? 0 : -1}
                onMouseEnter={() => setHovered(s.id)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(s.id)}
                onBlur={() => setHovered(null)}
                className={`block rounded-full border transition-all duration-300 ${DISTRICT_DOT[s.district] ?? DISTRICT_DOT.dang} ${
                  active ? "opacity-100" : "pointer-events-none opacity-[0.07]"
                } ${isHover ? "scale-[1.8] border-white/90" : ""}`}
                style={{ width: 11, height: 11 }}
              />
              {isHover && active && (
                <div
                  className={`pointer-events-none absolute left-1/2 z-30 w-max max-w-[220px] -translate-x-1/2 rounded-xl border border-white/10 bg-[#0b1210]/95 px-3 py-2 text-center shadow-xl backdrop-blur ${
                    flip ? "top-full translate-y-[8px]" : "top-0 -translate-y-[calc(100%+8px)]"
                  }`}
                >
                  <p className="text-xs font-bold leading-snug text-stone-100">
                    {s.emoji} {s.name}
                  </p>
                  <p className="mt-0.5 text-[10px] capitalize text-stone-500">
                    {s.district} · {s.category.replace(/-/g, " ")}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] px-5 py-3">
        <div className="flex items-center gap-4 text-[11px] text-stone-400">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full border border-emerald-300/80 bg-emerald-400/25" />
            Dang
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full border border-sky-300/80 bg-sky-400/25" />
            Narmada
          </span>
          <span className="text-stone-600">
            {shownCount} spot{shownCount === 1 ? "" : "s"} shown
          </span>
        </div>
        <p className="text-[11px] text-stone-600">
          Schematic positions · hover a dot, click through to the record
        </p>
      </div>
    </div>
  );
}
