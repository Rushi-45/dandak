import type { Metadata } from "next";
import { Suspense } from "react";
import { TripPlanner } from "@/components/trip-planner";
import { getItineraries, getPlannerIndex } from "@/lib/data";

export const metadata: Metadata = {
  title: "Plan your own trip",
  description:
    "Tell us where you start, where you finish and when you are travelling: get a day-by-day route through Dang and Narmada built from the whole dataset.",
  alternates: { canonical: "/plan" },
};

export default function PlanPage() {
  const data = getPlannerIndex();
  const itineraries = getItineraries();
  const covered = new Set(itineraries.flatMap((i) => i.stops.map((s) => s.spot_id))).size;

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-12">
      <div className="pointer-events-none absolute -top-10 right-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-[90px]" />

      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-500">
        Build your own
      </p>
      <h1 className="mt-3 font-serif text-4xl font-black leading-[1.05] tracking-tight text-stone-50 sm:text-5xl">
        Where are you starting, and where do you have to be?
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-stone-400">
        The {itineraries.length} trips we wrote by hand reach {covered} of these{" "}
        {data.spots.length} places. Give us two points on the map and a month, and we will build a
        route through the rest, using the same road distances, visit lengths and season notes
        that every record already carries.
      </p>

      <div className="mt-10">
        {/* useSearchParams needs a Suspense boundary or the prerender fails */}
        <Suspense
          fallback={
            <div className="h-64 animate-pulse rounded-3xl border border-white/[0.07] bg-white/[0.02]" />
          }
        >
          <TripPlanner data={data} />
        </Suspense>
      </div>
    </div>
  );
}
