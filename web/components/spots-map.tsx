"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import geoRaw from "@/lib/geo.json";

interface GeoData {
  districts: { name: string; rings: [number, number][][] }[];
  rivers: { name: string; segments: [number, number][][] }[];
}
const geo = geoRaw as unknown as GeoData;

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

  const { H, positions, districtPaths, riverPaths } = useMemo(() => {
    // The frame fits the real district shapes plus every marker (OD spots
    // sit honestly outside their district's boundary).
    const present = new Set(markers.map((m) => m.district));
    const shapes = geo.districts.filter((d) => present.has(d.name));
    const boundaryPts = shapes.flatMap((d) => d.rings.flat());
    const all = [
      ...markers.map((m) => [m.lat, m.lng] as [number, number]),
      ...boundaryPts,
    ];

    const midLat = all.reduce((a, p) => a + p[0], 0) / all.length;
    const kx = Math.cos((midLat * Math.PI) / 180);
    const xs = all.map((p) => p[1] * kx);
    const ys = all.map((p) => p[0]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const dx = Math.max(maxX - minX, 0.05);
    const dy = Math.max(maxY - minY, 0.05);
    // Height follows the real bbox shape, clamped to stay screen-friendly.
    const height = Math.min(Math.max((dy / dx) * W, 420), 980);
    const pad = 34;
    const scale = Math.min((W - pad * 2) / dx, (height - pad * 2) / dy);
    const ox = (W - dx * scale) / 2;
    const oy = (height - dy * scale) / 2;
    const proj = ([lat, lng]: [number, number]) => ({
      x: ox + (lng * kx - minX) * scale,
      y: oy + (maxY - lat) * scale,
    });

    const toPath = (pts: [number, number][], close: boolean) =>
      pts
        .map((p, i) => {
          const { x, y } = proj(p);
          return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
        })
        .join(" ") + (close ? " Z" : "");

    const dPaths = shapes.map((d) => ({
      name: d.name,
      d: d.rings.map((r) => toPath(r, true)).join(" "),
    }));
    const rPaths = geo.rivers.flatMap((r) =>
      r.segments.map((seg, i) => ({ key: `${r.name}-${i}`, d: toPath(seg, false) }))
    );

    // Spiral fan-out: dense clusters (the SoU complex packs ~15 spots into
    // a square kilometre) bloom into readable rings instead of one smudge.
    const placed: { x: number; y: number }[] = [];
    const pts = new Map<string, { x: number; y: number }>();
    for (const s of markers) {
      const base = proj([s.lat, s.lng]);
      let p = base;
      for (let t = 0; t < 24; t++) {
        const clash = placed.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 13);
        if (!clash) break;
        const ring = Math.floor(t / 6) + 1;
        const ang = (t % 6) * ((Math.PI * 2) / 6) + (ring - 1) * 0.55;
        p = { x: base.x + Math.cos(ang) * 13 * ring, y: base.y + Math.sin(ang) * 13 * ring };
      }
      placed.push(p);
      pts.set(s.id, p);
    }
    return { H: height, positions: pts, districtPaths: dPaths, riverPaths: rPaths };
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

          {/* real district land, from OpenStreetMap */}
          {districtPaths.map((d) => (
            <path
              key={d.name}
              d={d.d}
              fill={d.name === "dang" ? "rgba(52,211,153,0.055)" : "rgba(56,189,248,0.05)"}
              stroke={d.name === "dang" ? "rgba(52,211,153,0.35)" : "rgba(56,189,248,0.33)"}
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          ))}

          {/* rivers */}
          {riverPaths.map((r) => (
            <path
              key={r.key}
              d={r.d}
              fill="none"
              stroke="rgba(96,165,250,0.4)"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          <g transform={`translate(${W - 30}, 34)`} className="select-none">
            <text textAnchor="middle" fontSize="12" fontWeight="700" fill="rgba(214,211,209,0.45)">
              N
            </text>
            <path d="M 0 -22 L 3.5 -11 L 0 -14 L -3.5 -11 Z" fill="rgba(52,211,153,0.55)" />
          </g>
        </svg>

        {markers.map((s) => {
          const { x, y } = positions.get(s.id)!;
          const left = +((x / W) * 100).toFixed(4);
          const top = +((y / H) * 100).toFixed(4);
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
          {markers.some((m) => m.district === "dang") && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full border border-emerald-300/80 bg-emerald-400/25" />
              Dang
            </span>
          )}
          {markers.some((m) => m.district === "narmada") && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full border border-sky-300/80 bg-sky-400/25" />
              Narmada
            </span>
          )}
          <span className="text-stone-600">
            {shownCount} spot{shownCount === 1 ? "" : "s"} shown
          </span>
        </div>
        <p className="text-[11px] text-stone-600">
          Hover a dot, click through · boundaries & rivers ©{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-stone-700 underline-offset-2 hover:text-stone-400"
          >
            OpenStreetMap
          </a>{" "}
          contributors
        </p>
      </div>
    </div>
  );
}
