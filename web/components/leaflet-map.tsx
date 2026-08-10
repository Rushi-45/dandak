"use client";

import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap_, LatLngExpression } from "leaflet";
import { addBaseLayers } from "@/components/map-base";
import geoRaw from "@/lib/geo.json";

interface GeoData {
  districts: { name: string; rings: [number, number][][] }[];
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

interface LeafletMapProps {
  markers: SpotMarker[];
  categories: { key: string; label: string; emoji: string; count: number }[];
}

const DISTRICT_COLOR: Record<string, string> = {
  dang: "#34d399",
  narmada: "#38bdf8",
};

// Key base towns, always labelled regardless of zoom (registry hub coordinates).
const TOWNS: { name: string; lat: number; lng: number }[] = [
  { name: "Saputara", lat: 20.575, lng: 73.757 },
  { name: "Ahwa", lat: 20.757, lng: 73.686 },
  { name: "Waghai", lat: 20.772, lng: 73.499 },
  { name: "Subir", lat: 20.845, lng: 73.74 },
  { name: "Vansda", lat: 20.758, lng: 73.365 },
  { name: "Songadh", lat: 21.169, lng: 73.564 },
  { name: "Rajpipla", lat: 21.866, lng: 73.502 },
  { name: "Ekta Nagar", lat: 21.838, lng: 73.719 },
  { name: "Dediapada", lat: 21.633, lng: 73.612 },
  { name: "Sagbara", lat: 21.473, lng: 73.772 },
  { name: "Poicha", lat: 21.976, lng: 73.534 },
];

export function RealMap({ markers, categories }: LeafletMapProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap_ | null>(null);
  const groupRef = useRef<LayerGroup | null>(null);
  const LRef = useRef<typeof import("leaflet") | null>(null);
  const [ready, setReady] = useState(false);
  const [category, setCategory] = useState<string | null>(null);

  // Boot Leaflet once, client-side only.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !divRef.current || mapRef.current) return;
      LRef.current = L;

      const map = L.map(divRef.current, {
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: true,
      });

      addBaseLayers(L, map);

      // Our base towns, always visible in the site's own type.
      for (const t of TOWNS) {
        L.marker([t.lat, t.lng], {
          icon: L.divIcon({
            className: "dk-town",
            html: `<span class="dk-town-dot"></span>${t.name}`,
            iconSize: [0, 0],
            iconAnchor: [-6, 6],
          }),
          interactive: false,
          keyboard: false,
        }).addTo(map);
      }

      // Real district boundaries (OSM) as dashed overlays.
      const present = new Set(markers.map((m) => m.district));
      for (const d of geo.districts) {
        if (!present.has(d.name)) continue;
        L.polygon(d.rings as LatLngExpression[][], {
          color: DISTRICT_COLOR[d.name] ?? "#34d399",
          weight: 2,
          opacity: 0.8,
          fillOpacity: 0.03,
          dashArray: "6 6",
          interactive: false,
        }).addTo(map);
      }

      groupRef.current = L.layerGroup().addTo(map);
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]));
      map.fitBounds(bounds.pad(0.06));
      mapRef.current = map;
      setReady(true);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // (Re)draw markers whenever the category filter changes.
  useEffect(() => {
    const L = LRef.current;
    const group = groupRef.current;
    if (!ready || !L || !group) return;
    group.clearLayers();
    for (const s of markers) {
      if (category && s.category !== category) continue;
      const color = DISTRICT_COLOR[s.district] ?? "#34d399";
      // A divIcon rather than a circleMarker: the 32 px wrapper is an easy
      // click/tap target while the visible dot stays small.
      L.marker([s.lat, s.lng], {
        icon: L.divIcon({
          className: "dk-dot-wrap",
          html: `<span class="dk-dot" style="border-color:${color};background:${color}59"></span>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        }),
        riseOnHover: true,
        title: s.name,
      })
        .bindTooltip(`${s.emoji} ${s.name}`, { direction: "top", offset: [0, -12] })
        .bindPopup(
          `<div class="dk-pop">` +
            `<p class="dk-pop-title">${s.emoji} ${s.name}</p>` +
            `<p class="dk-pop-sub">${s.district} · ${s.category.replace(/-/g, " ")}</p>` +
            `<a href="/spots/${s.district}/${s.slug}">Open the record →</a>` +
            `</div>`,
          { closeButton: false }
        )
        .addTo(group);
    }
  }, [ready, category, markers]);

  const shownCount = category ? markers.filter((m) => m.category === category).length : markers.length;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.02]">
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

      <div ref={divRef} className="h-[540px] w-full sm:h-[620px]" />

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
            {shownCount} spot{shownCount === 1 ? "" : "s"} shown · dashed lines = district borders
          </span>
        </div>
        <p className="text-[11px] text-stone-600">
          Interior positions can be approximate — each record's ledger tells you how exact
        </p>
      </div>
    </div>
  );
}
