"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap_ } from "leaflet";
import { addBaseLayers, precisionRadius } from "@/components/map-base";

interface SpotMapProps {
  name: string;
  emoji: string;
  lat: number;
  lng: number;
  precision: string;
}

const PRECISION_NOTE: Record<string, string> = {
  exact: "Exact pin — verified coordinates",
  approximate: "Approximate pin — the circle is the margin",
  area: "Area-level pin — somewhere in the circle; ask locally",
};

export function SpotMap({ name, emoji, lat, lng, precision }: SpotMapProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap_ | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const L = (await import("leaflet")).default;
        if (cancelled || !divRef.current || mapRef.current) return;

        const zoom = precision === "exact" ? 14 : precision === "approximate" ? 13 : 12;
        const map = L.map(divRef.current, { scrollWheelZoom: false }).setView([lat, lng], zoom);
        addBaseLayers(L, map);

        const radius = precisionRadius(precision);
        if (radius) {
          L.circle([lat, lng], {
            radius,
            color: "#34d399",
            weight: 1,
            opacity: 0.5,
            fillColor: "#34d399",
            fillOpacity: 0.08,
            dashArray: "4 6",
            interactive: false,
          }).addTo(map);
        }

        L.marker([lat, lng], {
          icon: L.divIcon({
            className: "dk-stop-wrap",
            html: `<span class="dk-pin">${emoji}</span>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          }),
          interactive: false,
          keyboard: false,
        }).addTo(map);

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

  if (failed) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
      <div ref={divRef} className="h-[320px] w-full sm:h-[380px]" />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] px-5 py-3">
        <p className="text-[11px] text-stone-500">
          {PRECISION_NOTE[precision] ?? precision} ·{" "}
          <span className="text-stone-600">
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </span>
        </p>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-white/[0.1] bg-white/[0.04] px-3.5 py-1.5 text-[11px] font-bold text-stone-200 transition-colors hover:border-emerald-400/40 hover:text-emerald-200"
        >
          Directions to {name.split(" ")[0]} ↗
        </a>
      </div>
    </div>
  );
}
