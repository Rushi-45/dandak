import type { Metadata } from "next";
import { FadeIn } from "@/components/fade-in";
import { SpotCard } from "@/components/spot-card";
import { getAllSpots } from "@/lib/data";

export const metadata: Metadata = {
  title: "All Spots",
  description:
    "Every documented place in Dang and Narmada districts — waterfalls, viewpoints, temples, sanctuaries and the Statue of Unity campus.",
};

export default function SpotsPage() {
  const spots = getAllSpots();
  const districts: { id: "dang" | "narmada"; label: string; blurb: string }[] = [
    { id: "dang", label: "Dang", blurb: "Saputara, the Waghai belt and the forest interior." },
    { id: "narmada", label: "Narmada", blurb: "The Statue of Unity campus, Rajpipla and the Shoolpaneshwar belt." },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-stone-900">All spots</h1>
      <p className="mt-2 text-sm text-stone-600">
        {spots.length} places, grouped by district. Filters land in the next milestone.
      </p>

      {districts.map(({ id, label, blurb }) => {
        const group = spots.filter((s) => s.district === id);
        return (
          <section key={id} id={id} className="mt-12 scroll-mt-20">
            <div className="flex items-baseline gap-3">
              <h2 className="text-xl font-bold text-stone-900">{label}</h2>
              <span className="text-xs text-stone-400">{group.length} spots</span>
            </div>
            <p className="mt-1 text-sm text-stone-500">{blurb}</p>
            <FadeIn>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.map((spot) => (
                  <SpotCard key={spot.id} spot={spot} />
                ))}
              </div>
            </FadeIn>
          </section>
        );
      })}
    </div>
  );
}
