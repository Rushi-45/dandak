import type { Metadata } from "next";
import { SpotExplorer } from "@/components/spot-explorer";
import type { SpotCardData } from "@/components/spot-card";
import { getAllSpots } from "@/lib/data";

export const metadata: Metadata = {
  title: "All Spots",
  description:
    "Search and filter every documented place in Dang and Narmada districts — waterfalls, viewpoints, temples, sanctuaries and the Statue of Unity campus.",
};

export default function SpotsPage() {
  // Slim the records down to what the client explorer needs.
  const spots: SpotCardData[] = getAllSpots().map((s) => ({
    slug: s.slug,
    district: s.district,
    name: { en: s.name.en },
    category: s.category,
    cluster: s.cluster,
    tags: s.tags,
    summary: s.summary,
    seasonality: { monsoon_dependent: s.seasonality.monsoon_dependent },
    provenance: { confidence: s.provenance.confidence },
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-serif text-5xl font-black tracking-tight text-stone-100">
        Find your{" "}
        <span className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text italic text-transparent">
          spot.
        </span>
      </h1>
      <p className="mt-2 max-w-xl text-sm text-stone-500">
        {spots.length} documented places across Dang and Narmada — search anything, or filter by
        district, kind and mood.
      </p>

      <div className="mt-8">
        <SpotExplorer spots={spots} />
      </div>
    </div>
  );
}
