import type { Metadata } from "next";
import { SpotsMap, type SpotMarker } from "@/components/spots-map";
import { categoryLabel } from "@/lib/format";
import { getAllSpots } from "@/lib/data";
import { categoryMeta } from "@/lib/ui";

export const metadata: Metadata = {
  title: "The Map",
  description:
    "Every documented spot in Dang and Narmada on one schematic map — filter by category, hover for names, click through to full records.",
};

export default function MapPage() {
  const spots = getAllSpots();

  const markers: SpotMarker[] = spots.map((s) => ({
    id: s.id,
    district: s.district,
    slug: s.slug,
    name: s.name.en,
    lat: s.location.coordinates.lat,
    lng: s.location.coordinates.lng,
    category: s.category,
    emoji: categoryMeta(s.category).emoji,
  }));

  const counts = new Map<string, number>();
  for (const m of markers) counts.set(m.category, (counts.get(m.category) ?? 0) + 1);
  const categories = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({
      key,
      label: categoryLabel(key),
      emoji: categoryMeta(key).emoji,
      count,
    }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-300">
        The whole forest at once
      </p>
      <h1 className="mt-2 font-serif text-5xl font-black tracking-tight text-stone-100">
        The{" "}
        <span className="bg-gradient-to-r from-emerald-300 to-amber-200 bg-clip-text italic text-transparent">
          map.
        </span>
      </h1>
      <p className="mt-3 max-w-xl text-sm text-stone-500">
        All {markers.length} documented spots across Dang and Narmada, plotted from the dataset's
        own coordinates. Filter by category, hover for names, click through to the full record.
      </p>

      <div className="mt-8">
        <SpotsMap markers={markers} categories={categories} />
      </div>

      <p className="mt-4 text-xs leading-relaxed text-stone-600">
        Positions are schematic — most interior records carry approximate or area-level
        coordinates (it's the standing item on the verification ledger). For turn-by-turn
        navigation, open any spot's record or use the Google Maps buttons on trip pages.
      </p>
    </div>
  );
}
