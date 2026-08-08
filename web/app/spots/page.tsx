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
  const districts: { id: "dang" | "narmada"; label: string; blurb: string; accent: string }[] = [
    {
      id: "dang",
      label: "Dang",
      blurb: "Saputara, the Waghai belt and the forest interior.",
      accent: "from-emerald-400/70",
    },
    {
      id: "narmada",
      label: "Narmada",
      blurb: "The Statue of Unity campus, Rajpipla and the Shoolpaneshwar belt.",
      accent: "from-amber-400/70",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="text-4xl font-black tracking-tight text-stone-100">
        All{" "}
        <span className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
          spots
        </span>
      </h1>
      <p className="mt-2 text-sm text-stone-500">
        {spots.length} places, grouped by district. Filters land in the next milestone.
      </p>

      {districts.map(({ id, label, blurb, accent }) => {
        const group = spots.filter((s) => s.district === id);
        return (
          <section key={id} id={id} className="relative mt-14 scroll-mt-24">
            <div className={`absolute -top-4 left-0 h-px w-40 bg-gradient-to-r ${accent} to-transparent`} />
            <div className="flex items-baseline gap-3">
              <h2 className="text-2xl font-extrabold text-stone-100">{label}</h2>
              <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 text-xs text-stone-500">
                {group.length} spots
              </span>
            </div>
            <p className="mt-1.5 text-sm text-stone-500">{blurb}</p>
            <FadeIn>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
